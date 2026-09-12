/**
 * Shared Meta Graph API plumbing.
 *
 * facebookService, instagramService and socialStatsService all talk to the
 * same host with the same token and the same error envelope, so the version
 * string and the error predicates live here rather than being restated (and
 * drifting) in three places.
 */

// Overridable so a version bump is a deploy setting, not a code change -
// Meta retires versions on a fixed schedule and metric names move with them.
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v26.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/** The `error` object Graph nests inside a failed response body, or null. */
const graphError = (error) => error?.response?.data?.error || null;

/**
 * The object is gone (deleted from the Page, or never visible to this token).
 * Retrying never helps, so callers stop asking about that post for good.
 */
const isMissingObjectError = (error) => {
  const graph = graphError(error);
  if (!graph) return false;
  // 100 with subcode 33 is "unsupported get request" - Graph's answer for an
  // object that does not exist *or* is not visible to the token. 803 is the
  // older "some of the aliases you requested do not exist".
  return graph.code === 803 || (graph.code === 100 && graph.error_subcode === 33);
};

/**
 * The metric name is not valid for this version/object. Meta renames insight
 * metrics on a yearly cadence (impressions -> views), so this is a routine
 * answer to probe against, not an outage.
 */
const isInvalidMetricError = (error) => {
  const graph = graphError(error);
  if (!graph) return false;
  if (graph.code !== 100) return false;
  return /metric/i.test(graph.message || '');
};

/**
 * Instagram's content-publishing errors all carry a subcode in one reserved
 * range, and nothing else does. That is worth leaning on: the alternative is
 * a hand-maintained registry of codes that Meta extends without announcing,
 * and anything missing from it falls through to isPermissionError's
 * OAuthException catch-all - which is how a refused photo ends up logged as
 * "check your token scopes".
 */
const IG_CONTENT_SUBCODE_MIN = 2207000;
const IG_CONTENT_SUBCODE_MAX = 2207999;

const igContentSubcode = (error) => {
  const graph = graphError(error);
  const subcode = graph?.error_subcode;
  if (typeof subcode !== 'number') return null;
  return subcode >= IG_CONTENT_SUBCODE_MIN && subcode <= IG_CONTENT_SUBCODE_MAX ? subcode : null;
};

// Instagram's own "please try again" family: the container could not be built
// *this time*. 2207003 is "Timeout downloading media" (Meta could not fetch
// the image URL fast enough), 2207032 "Failed to create media", 2207053
// "Unknown upload error". None of them says anything is wrong with the file,
// so the answer is to wait and resubmit the same one rather than spend a
// download, a composite and a Cloudinary upload regenerating a derivative
// that was never the problem.
const IG_TRANSIENT_SUBCODES = [2207003, 2207032, 2207053];

// The publishing cap and the spam block live in the same range and are
// handled by their own predicates below, so they must never read as either a
// transient hiccup or a bad file.
const IG_SUBCODES_HANDLED_ELSEWHERE = [2207042, 2207051];

/**
 * Nothing is wrong with the request - Meta could not complete it right now.
 * A connection that never got an answer belongs here too: a timeout tells us
 * nothing about whether the call was refused or merely slow.
 */
const isTransientError = (error) => {
  const status = error?.response?.status;
  if (typeof status === 'number' && status >= 500) return true;

  const graph = graphError(error);
  if (graph) {
    // 1 "An unknown error occurred" / 2 "Service temporarily unavailable" are
    // Meta's own answer for "try again", not a description of the request.
    if (graph.code === 1 || graph.code === 2) return true;
    const subcode = igContentSubcode(error);
    if (subcode !== null && IG_TRANSIENT_SUBCODES.includes(subcode)) return true;
    // Every Instagram content error in the transient family is worded
    // "..., please try again". Kept as a secondary signal so a subcode Meta
    // adds after this was written lands on a retry rather than on a
    // regenerate-and-retry, which is the more expensive wrong answer.
    if (subcode !== null && /please try again/i.test(graph.message || '')) return true;
    return false;
  }

  // No Graph envelope at all: the request never reached an answer.
  return ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'EPIPE', 'EAI_AGAIN', 'ENETUNREACH']
    .includes(error?.code);
};

/**
 * Instagram's media container refused the *content* it was given - wrong
 * format, unfetchable URL, a caption it did not accept - rather than
 * anything about who is asking. Meta nests these under
 * `type: "OAuthException"` exactly like a real permission problem (see
 * isPermissionError below), so this has to be checked first or a bad photo
 * gets misreported as a bad token, which sends whoever reads the log looking
 * in the wrong place.
 *
 * Anything in the content-publishing subcode range that is not transient and
 * not one of the two limits handled by their own predicates is treated as a
 * bad derivative: 2207052 is "Only photo or video can be accepted as media
 * type" (the fetched URL was not usable as either), 2207010 caption too long,
 * 2207020 an unreachable or invalid image_url. The range test rather than a
 * fixed list is deliberate - see IG_CONTENT_SUBCODE_MIN above.
 */
const isMediaContentError = (error) => {
  const subcode = igContentSubcode(error);
  if (subcode === null) return false;
  if (IG_SUBCODES_HANDLED_ELSEWHERE.includes(subcode)) return false;
  return !isTransientError(error);
};

/**
 * Meta has decided this posting *behaviour* looks like spam and has blocked
 * it for a while, independently of any documented numeric limit - Instagram's
 * 2207051 ("The publishing action is suspected to be spam") and Facebook's
 * code 368 ("temporarily blocked for policies violations").
 *
 * Worth its own predicate because it is neither a rate limit nor a bad file:
 * nothing about the listing is wrong, and retrying at the same cadence is
 * precisely what earns a longer block. The queue answers it by standing the
 * whole platform down for hours, not minutes.
 */
const isSpamBlockError = (error) => {
  const graph = graphError(error);
  if (!graph) return false;
  return graph.code === 368 || graph.error_subcode === 2207051;
};

/**
 * The access token itself is no longer usable - expired, revoked, invalidated
 * by a password change, or attached to an account that lost its Page role.
 *
 * Distinct from isPermissionError, which covers a token that is valid but was
 * never granted a scope. Both need a human, but they need different humans
 * doing different things, and only this one is routinely self-inflicted (a
 * Page token derived from a user token expires; a System User token does not,
 * which is why this deployment uses one). The queue treats it as a platform-
 * wide stand-down rather than a per-job failure: a token that went stale
 * overnight must not convert a night's worth of listings into dead jobs.
 *
 * 190 is the token error; 458/459/460/463/464/467 are the session subcodes
 * (app uninstalled, checkpointed, password changed, expired, unconfirmed,
 * logged out) and 492 is "no longer has a role on this Page".
 */
const AUTH_SUBCODES = [458, 459, 460, 463, 464, 467, 492];

const isAuthError = (error) => {
  const graph = graphError(error);
  if (!graph) return false;
  if (graph.code === 190 || graph.code === 102) return true;
  return AUTH_SUBCODES.includes(graph.error_subcode);
};

/**
 * The token is valid but was never granted the permission this edge needs.
 *
 * The narrow version of isPermissionError below, and the one anything that
 * acts on the answer should use. 10 and the 200-299 family are Meta's own
 * permission codes; isPermissionError additionally answers true for
 * *anything* wearing an OAuthException, which on Meta is nearly everything -
 * fine for a reader deciding whether to leave a metric empty, and much too
 * broad for a publisher deciding whether to stop calling a platform. A code
 * 100 "Invalid parameter" on one listing must not stand down the queue for
 * every other listing behind it.
 */
const isScopeError = (error) => {
  const graph = graphError(error);
  if (!graph) return false;
  return graph.code === 10 || (graph.code >= 200 && graph.code <= 299);
};

/**
 * The token lacks the permission this edge needs (e.g. read_insights).
 *
 * Note for callers that also classify throttling: Meta returns its rate-limit
 * codes under `type: "OAuthException"` too, so this predicate answers true for
 * those as well. Check isRateLimitError/isPublishLimitError/isMediaContentError
 * *first* - a throttle or a bad photo that gets classified as a permission
 * problem looks permanent (or points at the wrong fix) and stops work that a
 * retry, or a regenerated image, would have gotten through.
 */
const isPermissionError = (error) => {
  const graph = graphError(error);
  if (!graph) return false;
  return graph.code === 10 || graph.code === 200 || graph.type === 'OAuthException';
};

/**
 * Meta is throttling us: too many calls in too short a window. Always
 * temporary - the right response is to back off and try again later, never to
 * give up on the work.
 *
 * 4 is the app-level limit, 17 the user/account one, 32 the Page one, 613 the
 * calls-per-second ceiling, and 341 the older "application limit reached".
 * A plain HTTP 429 is included for the same reason: the edge gateway can
 * answer before the request ever reaches Graph's own error envelope.
 */
const isRateLimitError = (error) => {
  if (error?.response?.status === 429) return true;
  const graph = graphError(error);
  if (!graph) return false;
  return [4, 17, 32, 341, 613].includes(graph.code);
};

/**
 * The account has published as much as it is allowed to in the current
 * rolling 24 hours - Instagram's Content Publishing API cap (25 posts at the
 * time of writing). Distinct from a rate limit: waiting minutes does not help,
 * the oldest publish has to age out of the window first.
 *
 * Worth catching even though socialPublishQueue counts publishes itself: our
 * count only knows about posts *this app* published, so anything posted to the
 * account by hand spends quota we never saw. This is the platform's own answer,
 * and it is always right.
 */
const isPublishLimitError = (error) => {
  const graph = graphError(error);
  if (!graph) return false;
  return graph.code === 9 || graph.error_subcode === 2207042;
};

/**
 * How close this app is to being throttled, read off the headers Meta puts on
 * *every* Graph response - successes included.
 *
 * This is the only way to slow down before being refused rather than after.
 * `x-app-usage` reports the app-wide budget and `x-business-use-case-usage`
 * the per-asset one (the Page and the Instagram account each have their own),
 * both as percentages of three separate ceilings - calls, CPU time and total
 * time - any one of which triggers throttling at 100. So the number worth
 * acting on is the highest of all of them, across every object in the header.
 *
 * `estimated_time_to_regain_access` comes back in minutes and is only ever
 * non-zero once already blocked; when Meta states it, it beats any cooldown
 * guessed from a constant.
 *
 * Answers null when the headers are absent, which is the normal case for a
 * stubbed transport and for anything that never reached Graph at all.
 */
const readHeader = (headers, name) => {
  if (!headers) return null;
  if (typeof headers.get === 'function') return headers.get(name) ?? null;
  return headers[name] ?? headers[name.toLowerCase()] ?? null;
};

const parseUsageHeader = (raw) => {
  if (!raw) return [];
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== 'object') return [];
  // x-app-usage is one flat object; x-business-use-case-usage is a map of
  // business-object-id to an array of per-use-case objects.
  const values = Object.values(parsed);
  if (values.every((value) => Array.isArray(value))) return values.flat();
  return [parsed];
};

const USAGE_PERCENT_FIELDS = ['call_count', 'total_cputime', 'total_time'];

const readRateLimitUsage = (source) => {
  const headers = source?.response?.headers || source?.headers || null;
  const entries = [
    ...parseUsageHeader(readHeader(headers, 'x-app-usage')),
    ...parseUsageHeader(readHeader(headers, 'x-business-use-case-usage')),
  ];
  if (entries.length === 0) return null;

  let percent = 0;
  let regainAccessMinutes = 0;
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    for (const field of USAGE_PERCENT_FIELDS) {
      const value = Number(entry[field]);
      if (Number.isFinite(value) && value > percent) percent = value;
    }
    const wait = Number(entry.estimated_time_to_regain_access);
    if (Number.isFinite(wait) && wait > regainAccessMinutes) regainAccessMinutes = wait;
  }

  return { percent, regainAccessMinutes };
};

/** Compact one-line description of a Graph failure, for logs. */
const describeGraphError = (error) => {
  const graph = graphError(error);
  if (!graph) return error?.message || String(error);
  const subcode = graph.error_subcode ? `/${graph.error_subcode}` : '';
  return `(#${graph.code}${subcode}) ${graph.message}`;
};

module.exports = {
  GRAPH_API_VERSION,
  GRAPH_BASE_URL,
  graphError,
  isMissingObjectError,
  isInvalidMetricError,
  isTransientError,
  isMediaContentError,
  isSpamBlockError,
  isAuthError,
  isScopeError,
  isPermissionError,
  isRateLimitError,
  isPublishLimitError,
  describeGraphError,
  readRateLimitUsage,
};
