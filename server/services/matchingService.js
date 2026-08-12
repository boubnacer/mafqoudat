const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const FoundLost = require("../models/FoundLost");
const PostMatch = require("../models/PostMatch");
const Notification = require("../models/Notification");
const { tokenSet, tokenSimilarity, sharedNumericTokens, normalizeText } = require("../utils/textMatching");
const { resolveEventDate } = require("../utils/postDates");
const matchEmailService = require("./matchEmailService");
const pushNotificationService = require("./pushNotificationService");

/**
 * Lost/found match engine.
 *
 * When someone posts a lost item, the platform already holds everything needed
 * to tell them "somebody found something that looks like this" - it just never
 * asked the question. This service asks it: for a given post it scans the
 * opposite side of the same country for plausible counterparts, scores each
 * pair on five independent signals, persists the pair, and notifies both
 * owners when the score clears their confidence floor.
 *
 * Design constraints worth knowing before changing anything here:
 *  - It must never be able to fail a post write. Every entry point is called
 *    fire-and-forget and swallows its own errors.
 *  - Scoring is deterministic and explainable. Every point a pair earns maps
 *    to a reason code the UI can show the user in their own language.
 *  - Notifying the *other* owner matters as much as notifying the poster: the
 *    person who found a cat three weeks ago is the one who can return it.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// Per-signal maxima. They sum to 100, so `score` is directly a percentage and
// the breakdown can be rendered as a bar without rescaling.
const WEIGHTS = {
  category: 30,
  city: 20,
  location: 10,
  date: 15,
  keywords: 25,
};

// A shared reference number (plate fragment, chip id, model number) is the
// single most distinctive thing two strangers can independently write down, so
// it earns a bonus on top of the keyword similarity it already contributed to.
const SHARED_REFERENCE_BONUS = 8;
const KEYWORD_MAX = WEIGHTS.keywords + SHARED_REFERENCE_BONUS;

// Confidence band boundaries, shared with the API layer so the label a user
// sees and the score the engine assigns can never drift apart.
const GOOD_MATCH_SCORE = 55;
const STRONG_MATCH_SCORE = 75;

// A shared category in the same city is treated as a strong lead in its own
// right, whatever the free-text signals say. Two people in one city, one
// reporting a lost item and one reporting a found item of the same kind, is the
// exact situation this platform exists to resolve - and descriptions are the
// least reliable part of a listing (often blank, often written in a different
// language from the other side). On weights alone that pair scores 50, which
// reads as a lukewarm "possible match"; the floor below lifts it into the
// strong band so it is labelled - and delivered - as the lead it actually is.
//
// Consequence worth knowing: `score` can exceed the sum of `breakdown` when
// this applies. The breakdown stays a faithful record of what each signal
// earned, so keep reading it as an explanation, not as an addend list.
const applyCoreMatchFloor = (total, { sameCategory, sameCity }) => (
  sameCategory && sameCity ? Math.max(total, STRONG_MATCH_SCORE) : total
);

const readIntEnv = (name, fallback, { min, max }) => {
  const parsed = Number.parseInt(process.env[name], 10);
  const value = Number.isNaN(parsed) ? fallback : parsed;
  // The fallback is clamped too, so a bound that depends on another setting
  // (NOTIFY_MIN_SCORE's floor is STORE_MIN_SCORE) still holds when the env var
  // is absent and only the default applies.
  return Math.min(max, Math.max(min, value));
};

// Floor for *storing* a pair. Anything above this shows up in the post's
// "possible matches" panel, where the user asked to see borderline candidates.
const STORE_MIN_SCORE = readIntEnv('MATCH_MIN_SCORE', 40, { min: 10, max: 100 });

// Absolute floor for *notifying*, before the recipient's own preference is
// applied. A user can raise their bar, never lower it below this.
const NOTIFY_MIN_SCORE = readIntEnv('MATCH_NOTIFY_MIN_SCORE', 50, { min: STORE_MIN_SCORE, max: 100 });

// Only email about matches that are genuinely worth an inbox interruption.
const EMAIL_MIN_SCORE = readIntEnv('MATCH_EMAIL_MIN_SCORE', 70, { min: 0, max: 100 });

// How far back to look for counterparts. Six months: found items are often
// held for a long time, and a lost pet reported in March can surface in August.
const LOOKBACK_DAYS = readIntEnv('MATCH_LOOKBACK_DAYS', 180, { min: 7, max: 730 });

// Hard ceilings so one post in a dense category cannot turn into an expensive
// scan or a notification flood.
const CANDIDATE_LIMIT = readIntEnv('MATCH_CANDIDATE_LIMIT', 300, { min: 20, max: 1000 });
const MAX_MATCHES_PER_RUN = readIntEnv('MATCH_MAX_PER_RUN', 10, { min: 1, max: 50 });

// Recomputation window for the on-demand path (opening a post's match panel).
const RECOMPUTE_AFTER_MS = 6 * 60 * 60 * 1000;

// Fields the scorer needs - deliberately narrow, these documents are fetched in
// batches of up to CANDIDATE_LIMIT.
const SCORING_FIELDS = 'user country categories category foundLost city exactLocation description mainDate createdAt status returned';

// ---------------------------------------------------------------------------
// FoundLost id <-> code resolution
// ---------------------------------------------------------------------------

// The FOUND/LOST documents are effectively static reference data, so their ids
// are memoised rather than re-read on every post creation.
let foundLostCache = null;
let foundLostCacheAt = 0;
const FOUND_LOST_TTL_MS = 60 * 60 * 1000;

const getFoundLostMap = async () => {
  if (foundLostCache && Date.now() - foundLostCacheAt < FOUND_LOST_TTL_MS) {
    return foundLostCache;
  }

  const docs = await FoundLost.find({}).select('_id code').lean();
  const byCode = {};
  const byId = {};
  docs.forEach((doc) => {
    const code = String(doc.code || '').toUpperCase();
    if (code !== 'FOUND' && code !== 'LOST') return;
    byCode[code] = doc._id;
    byId[String(doc._id)] = code;
  });

  if (!byCode.FOUND || !byCode.LOST) {
    // Reference data missing or half-seeded: refuse to cache a broken map.
    return { byCode, byId, complete: false };
  }

  foundLostCache = { byCode, byId, complete: true };
  foundLostCacheAt = Date.now();
  return foundLostCache;
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const toIdStrings = (values) => (Array.isArray(values) ? values : [values])
  .filter(Boolean)
  .map((value) => String(value));

const categoryIdsOf = (post) => {
  if (Array.isArray(post.categories) && post.categories.length > 0) return post.categories;
  return post.category ? [post.category] : [];
};

/**
 * Post.city is a Mixed field: normally a City ObjectId, but older or
 * unresolved rows can hold a raw place name. Only compare like with like -
 * an id and a name can't be checked for equality without a lookup, and
 * guessing there would invent matches that aren't real.
 */
const cityComparable = (post) => {
  const raw = post.city;
  if (!raw) return { id: null, text: null };
  if (raw instanceof mongoose.Types.ObjectId) return { id: String(raw), text: null };
  const asString = String(raw);
  if (mongoose.Types.ObjectId.isValid(asString) && asString.length === 24) {
    return { id: asString, text: null };
  }
  const text = normalizeText(asString);
  return { id: null, text: text || null };
};

const scoreCity = (a, b) => {
  const cityA = cityComparable(a);
  const cityB = cityComparable(b);
  if (cityA.id && cityB.id) return cityA.id === cityB.id ? WEIGHTS.city : 0;
  if (cityA.text && cityB.text) return cityA.text === cityB.text ? WEIGHTS.city : 0;
  return 0;
};

/**
 * Distance in days between the two events, plus the raw dates so the caller can
 * apply the direction rule (a find cannot precede the loss).
 */
const compareDates = (a, b) => {
  const eventA = resolveEventDate(a);
  const eventB = resolveEventDate(b);
  if (!eventA.date || !eventB.date) {
    return { daysApart: null, exact: false, dateA: null, dateB: null };
  }
  return {
    daysApart: Math.abs(eventA.date.getTime() - eventB.date.getTime()) / DAY_MS,
    exact: eventA.isExact && eventB.isExact,
    dateA: eventA.date,
    dateB: eventB.date,
  };
};

const scoreDate = ({ daysApart }, lostDate, foundDate) => {
  if (daysApart === null) return 0;

  // Same day or one day apart is as good as it gets; confidence then decays
  // linearly and reaches zero at two months.
  const closeness = daysApart <= 1 ? 1 : Math.max(0, 1 - (daysApart - 1) / 60);
  let points = WEIGHTS.date * closeness;

  // An item found more than a few days *before* it was reported lost is very
  // unlikely to be the same item. Heavily discounted rather than zeroed: users
  // do misremember and mistype dates.
  if (lostDate && foundDate && foundDate.getTime() < lostDate.getTime() - 3 * DAY_MS) {
    points *= 0.35;
  }

  return points;
};

/**
 * Scores one candidate pair. `post` and `candidate` are lean documents holding
 * at least SCORING_FIELDS. Returns null when the pair fails the corroboration
 * gate or the storage floor.
 *
 * The gate matters as much as the score: two posts sharing only a category in a
 * country-sized area are not a lead, they are noise, and a notification that
 * turns out to be noise trains people to ignore the next one.
 */
const scorePair = (post, candidate, roles) => {
  const catsA = toIdStrings(categoryIdsOf(post));
  const catsB = toIdStrings(categoryIdsOf(candidate));
  if (catsA.length === 0 || catsB.length === 0) return null;

  const setA = new Set(catsA);
  const setB = new Set(catsB);
  let shared = 0;
  setA.forEach((id) => { if (setB.has(id)) shared += 1; });
  if (shared === 0) return null;

  const categoryPoints = WEIGHTS.category * ((2 * shared) / (setA.size + setB.size));
  const cityPoints = scoreCity(post, candidate);

  const locationA = tokenSet(post.exactLocation);
  const locationB = tokenSet(candidate.exactLocation);
  const locationPoints = WEIGHTS.location * tokenSimilarity(locationA, locationB);

  const keywordsA = tokenSet(post.description);
  const keywordsB = tokenSet(candidate.description);
  const keywordSimilarity = tokenSimilarity(keywordsA, keywordsB);
  const sharedRefs = sharedNumericTokens(
    new Set([...keywordsA, ...locationA]),
    new Set([...keywordsB, ...locationB])
  );
  let keywordPoints = WEIGHTS.keywords * keywordSimilarity;
  if (sharedRefs.length > 0) {
    keywordPoints = Math.min(KEYWORD_MAX, keywordPoints + SHARED_REFERENCE_BONUS);
  }

  const dates = compareDates(post, candidate);
  const lostDate = roles.lostPostId === String(post._id) ? dates.dateA : dates.dateB;
  const foundDate = roles.lostPostId === String(post._id) ? dates.dateB : dates.dateA;
  const datePoints = scoreDate(dates, lostDate, foundDate);

  const reasons = ['same_category'];
  if (cityPoints > 0) reasons.push('same_city');
  if (locationPoints >= WEIGHTS.location * 0.4) reasons.push('nearby_location');
  if (dates.daysApart !== null && dates.daysApart <= 14) reasons.push('close_dates');
  if (keywordSimilarity >= 0.25) reasons.push('similar_description');
  if (sharedRefs.length > 0) reasons.push('shared_reference');

  // Category alone is never enough: at least one independent signal has to
  // agree before this pair is worth anyone's attention.
  const corroborated = reasons.some((reason) => reason !== 'same_category')
    || (dates.daysApart !== null && dates.daysApart <= 10);
  if (!corroborated) return null;

  const earned = Math.round(
    categoryPoints + cityPoints + locationPoints + datePoints + keywordPoints
  );
  const total = Math.min(
    100,
    applyCoreMatchFloor(earned, {
      // Always true this far in - the early return above rejects a pair with no
      // shared category - but passed explicitly so the rule reads as its own
      // condition rather than depending on where it sits in the function.
      sameCategory: shared > 0,
      sameCity: cityPoints > 0,
    })
  );
  if (total < STORE_MIN_SCORE) return null;

  return {
    score: total,
    breakdown: {
      category: Math.round(categoryPoints),
      city: Math.round(cityPoints),
      location: Math.round(locationPoints),
      date: Math.round(datePoints),
      keywords: Math.round(keywordPoints),
    },
    reasons,
    daysApart: dates.daysApart === null ? null : Math.round(dates.daysApart),
    exactDates: dates.exact,
  };
};

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const upsertMatch = async ({ post, candidate, scored, roles }) => {
  const [postA, postB] = PostMatch.canonicalPair(post._id, candidate._id);

  const match = await PostMatch.findOneAndUpdate(
    { postA, postB },
    {
      $set: {
        lostPost: roles.lostPostId === String(post._id) ? post._id : candidate._id,
        foundPost: roles.lostPostId === String(post._id) ? candidate._id : post._id,
        owners: [post.user, candidate.user],
        country: post.country,
        score: scored.score,
        breakdown: scored.breakdown,
        reasons: scored.reasons,
        daysApart: scored.daysApart,
        exactDates: scored.exactDates,
        computedAt: new Date(),
      },
      // Status is only seeded, never overwritten here - a pair the user has
      // confirmed must keep that state through a rescan. (The one status change
      // a rescan may make, reopening a closed pair, is handled below where the
      // current value is known.) postA/postB are omitted: the upsert already
      // seeds them from the equality conditions in the filter.
      $setOnInsert: { status: 'active' },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Re-open a pair that had been closed because one side was marked returned,
  // if that mark has since been undone. Reaching this point already proves both
  // posts are active and unreturned - the candidate query and the caller's own
  // guard both require it - so the close no longer reflects reality. A pair the
  // user explicitly confirmed keeps its status.
  if (match && match.status === 'closed') {
    await PostMatch.updateOne({ _id: match._id }, { $set: { status: 'active' } });
    match.status = 'active';
  }

  return match;
};

/**
 * Creates (or refreshes) the in-app notification for one owner of a pair.
 * Returns the notification when it was newly created, null otherwise - the
 * caller uses that to decide whether an email is warranted, so that editing a
 * post cannot re-send the same email.
 */
const upsertNotification = async ({ recipientId, ownPostId, otherPostId, match }) => {
  const filter = {
    user: recipientId,
    type: 'match_found',
    post: ownPostId,
    matchedPost: otherPostId,
  };

  const existing = await Notification.findOne(filter).select('_id isDismissed').lean();

  if (existing) {
    // Never resurrect something the user dismissed, and never flip an already
    // read notification back to unread - only keep its score current.
    if (existing.isDismissed) return null;
    await Notification.updateOne(
      { _id: existing._id },
      { $set: { score: match.score, reasons: match.reasons, match: match._id } }
    );
    return null;
  }

  try {
    return await Notification.create({
      ...filter,
      match: match._id,
      score: match.score,
      reasons: match.reasons,
    });
  } catch (error) {
    // Duplicate key: another concurrent run created it first. Not an error.
    if (error?.code === 11000) return null;
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/**
 * Scores `postId` against the opposite side of its country, stores every pair
 * that clears the storage floor, and (when `notify`) alerts both owners of the
 * pairs that clear their notification floor.
 *
 * Always resolves - it reports what it did instead of throwing, because every
 * caller is a fire-and-forget hook on a user-facing write.
 */
const computeMatchesForPost = async (postId, { notify = true } = {}) => {
  const result = { scanned: 0, matched: 0, notified: 0, pushed: 0, skipped: null };

  if (!postId || !mongoose.Types.ObjectId.isValid(String(postId))) {
    result.skipped = 'invalid_post_id';
    return result;
  }

  const post = await Post.findById(postId).select(SCORING_FIELDS).lean();
  if (!post) {
    result.skipped = 'post_not_found';
    return result;
  }

  // Stamped for every outcome from here on, including "nothing matched" and
  // "this post can never match" - those are exactly the cases the on-demand
  // throttle needs to remember, and they are the cheapest ones to repeat by
  // accident. Deliberately not awaited into the critical path.
  const stampScan = () => {
    Post.updateOne({ _id: post._id }, { $set: { lastMatchScanAt: new Date() } })
      .catch((error) => {
        console.error(`[matching] could not stamp scan time for ${post._id}:`, error?.message || error);
      });
  };

  if (post.status !== 'active' || post.returned) {
    result.skipped = 'post_not_active';
    stampScan();
    return result;
  }

  const foundLostMap = await getFoundLostMap();
  if (!foundLostMap.complete) {
    result.skipped = 'foundlost_reference_data_missing';
    return result;
  }

  const code = foundLostMap.byId[String(post.foundLost)];
  if (!code) {
    result.skipped = 'unknown_foundlost';
    stampScan();
    return result;
  }
  const oppositeCode = code === 'LOST' ? 'FOUND' : 'LOST';
  const oppositeId = foundLostMap.byCode[oppositeCode];

  const categoryIds = categoryIdsOf(post);
  if (categoryIds.length === 0) {
    result.skipped = 'post_without_category';
    stampScan();
    return result;
  }

  const candidates = await Post.find({
    _id: { $ne: post._id },
    country: post.country,
    foundLost: oppositeId,
    status: 'active',
    returned: false,
    user: { $ne: post.user },
    createdAt: { $gte: new Date(Date.now() - LOOKBACK_DAYS * DAY_MS) },
    // Legacy rows may only carry the single `category` field, so both shapes
    // have to be considered or those posts become invisible to matching.
    $or: [
      { categories: { $in: categoryIds } },
      { category: { $in: categoryIds } },
    ],
  })
    .select(SCORING_FIELDS)
    .sort({ createdAt: -1 })
    .limit(CANDIDATE_LIMIT)
    .lean();

  stampScan();

  result.scanned = candidates.length;
  if (candidates.length === 0) return result;

  const roles = {
    lostPostId: code === 'LOST' ? String(post._id) : null,
  };

  const scoredPairs = [];
  candidates.forEach((candidate) => {
    const pairRoles = {
      lostPostId: roles.lostPostId || String(candidate._id),
    };
    const scored = scorePair(post, candidate, pairRoles);
    if (scored) scoredPairs.push({ candidate, scored, roles: pairRoles });
  });

  scoredPairs.sort((a, b) => b.scored.score - a.scored.score);
  const accepted = scoredPairs.slice(0, MAX_MATCHES_PER_RUN);
  result.matched = accepted.length;
  if (accepted.length === 0) return result;

  // One fetch for every owner involved, so preferences don't cost a query each.
  const ownerIds = [...new Set([
    String(post.user),
    ...accepted.map(({ candidate }) => String(candidate.user)),
  ])];
  const owners = await User.find({ _id: { $in: ownerIds } })
    .select('_id email username notificationPreferences isActive pushTokens')
    .lean();
  const ownersById = new Map(owners.map((owner) => [String(owner._id), owner]));

  // Device pushes are collected across the whole run and sent once per
  // recipient at the end, rather than inside the loop. One listing in a dense
  // city/category legitimately produces a burst of strong matches (see
  // applyCoreMatchFloor), and a phone buzzing ten times in one second is how a
  // user turns notifications off for good. The inbox can group them after the
  // fact; a notification tray cannot.
  const pushQueue = new Map();

  for (const { candidate, scored, roles: pairRoles } of accepted) {
    const match = await upsertMatch({ post, candidate, scored, roles: pairRoles });
    if (!notify || !match || match.status !== 'active') continue;

    const dismissedBy = new Set((match.dismissedBy || []).map((id) => String(id)));

    // `ownPostCode` is the side of the recipient's *own* post, which is what
    // decides the wording of a push ("someone found something like the item you
    // lost" vs its mirror). The scanned post is on `code`; every candidate is
    // on the opposite side by construction of the candidate query.
    const recipients = [
      { recipientId: post.user, ownPostId: post._id, otherPostId: candidate._id, ownPostCode: code },
      { recipientId: candidate.user, ownPostId: candidate._id, otherPostId: post._id, ownPostCode: oppositeCode },
    ];

    for (const recipient of recipients) {
      const owner = ownersById.get(String(recipient.recipientId));
      if (!owner || owner.isActive === false) continue;
      if (dismissedBy.has(String(recipient.recipientId))) continue;

      const preferences = owner.notificationPreferences || {};
      if (preferences.matchAlerts === false) continue;

      const floor = Math.max(
        NOTIFY_MIN_SCORE,
        Number.isFinite(preferences.minScore) ? preferences.minScore : 0
      );
      if (scored.score < floor) continue;

      const created = await upsertNotification({ ...recipient, match });
      if (!created) continue;
      result.notified += 1;

      if (preferences.emailAlerts === true && owner.email && scored.score >= EMAIL_MIN_SCORE) {
        // Fire-and-forget: an SMTP hiccup must not abort the remaining matches.
        matchEmailService
          .sendMatchAlert({
            recipient: owner,
            ownPostId: recipient.ownPostId,
            matchedPostId: recipient.otherPostId,
            score: scored.score,
            reasons: scored.reasons,
          })
          .then((sent) => {
            if (sent?.success) {
              return Notification.updateOne(
                { _id: created._id },
                { $set: { emailSentAt: new Date() } }
              );
            }
            return null;
          })
          .catch((error) => {
            console.error('Match alert email failed:', error?.message || error);
          });
      }

      // Queued rather than sent, and only for a notification that was actually
      // created: upsertNotification returns null when it merely re-scored an
      // existing row, so a rescan of the same pair can never buzz a phone twice
      // for something the user has already seen.
      if (preferences.pushAlerts !== false && (owner.pushTokens || []).length > 0) {
        const queued = pushQueue.get(String(recipient.recipientId)) || {
          owner,
          ownPostCode: recipient.ownPostCode,
          alerts: [],
        };
        queued.alerts.push({
          notificationId: created._id,
          matchedPostId: recipient.otherPostId,
        });
        pushQueue.set(String(recipient.recipientId), queued);
      }
    }
  }

  result.pushed = await dispatchQueuedPushes(pushQueue);

  return result;
};

/**
 * Sends the run's collected pushes, one per recipient.
 *
 * Awaited rather than fire-and-forget, unlike the email above: the caller is
 * already detached from the request (scheduleMatchScan defers the whole scan
 * with setImmediate), so awaiting costs no user-visible latency and buys an
 * accurate count in the scan result. Individual failures are swallowed inside
 * pushNotificationService, which never throws.
 */
const dispatchQueuedPushes = async (pushQueue) => {
  let pushed = 0;

  for (const { owner, ownPostCode, alerts } of pushQueue.values()) {
    const sent = await pushNotificationService.sendMatchAlert({
      user: owner,
      ownPostCode,
      alerts,
    });
    if (sent) pushed += 1;
  }

  return pushed;
};

/**
 * Fire-and-forget wrapper for the post write paths. Deferred with setImmediate
 * so the HTTP response is already on its way before the scan starts.
 */
const scheduleMatchScan = (postId, options = {}) => {
  setImmediate(() => {
    computeMatchesForPost(postId, options)
      .then((outcome) => {
        if (process.env.NODE_ENV !== 'production' && outcome) {
          console.log(`[matching] post ${postId}:`, outcome);
        }
      })
      .catch((error) => {
        console.error(`[matching] scan failed for post ${postId}:`, error?.message || error);
      });
  });
};

/**
 * Recomputes only if the stored pairs for this post are stale or absent. Used
 * by the read path so posts created before this feature existed - or edited
 * since their last scan - still have something to show. Never notifies:
 * viewing your own post must not push alerts to strangers.
 */
const ensureFreshMatches = async (postId) => {
  const post = await Post.findById(postId).select('lastMatchScanAt').lean();
  if (!post) return { refreshed: false };

  const lastScan = post.lastMatchScanAt ? new Date(post.lastMatchScanAt).getTime() : 0;
  if (lastScan && Date.now() - lastScan < RECOMPUTE_AFTER_MS) {
    return { refreshed: false };
  }

  await computeMatchesForPost(postId, { notify: false });
  return { refreshed: true };
};

/**
 * A post that was returned or resolved is no longer a lead, so its pairs are
 * closed and stop appearing in the match panels.
 *
 * The matching notifications are deliberately left alone. The inbox already
 * filters on both posts still being active and unreturned
 * (controllers/notificationsController.js), so they disappear from the list on
 * their own - whereas flagging them dismissed here would be indistinguishable
 * from the user having cleared them, and would permanently destroy the alert if
 * the "returned" mark were later undone.
 */
const closeMatchesForPost = async (postId) => {
  try {
    await PostMatch.updateMany(
      { $or: [{ postA: postId }, { postB: postId }], status: 'active' },
      { $set: { status: 'closed' } }
    );
  } catch (error) {
    console.error(`[matching] failed to close matches for post ${postId}:`, error?.message || error);
  }
};

/** Hard cleanup for a deleted post - nothing should reference a missing row. */
const purgeMatchesForPost = async (postId) => {
  try {
    await PostMatch.deleteMany({ $or: [{ postA: postId }, { postB: postId }] });
    await Notification.deleteMany({ $or: [{ post: postId }, { matchedPost: postId }] });
  } catch (error) {
    console.error(`[matching] failed to purge matches for post ${postId}:`, error?.message || error);
  }
};

module.exports = {
  computeMatchesForPost,
  scheduleMatchScan,
  ensureFreshMatches,
  closeMatchesForPost,
  purgeMatchesForPost,
  scorePair,
  WEIGHTS,
  STORE_MIN_SCORE,
  NOTIFY_MIN_SCORE,
  GOOD_MATCH_SCORE,
  STRONG_MATCH_SCORE,
};
