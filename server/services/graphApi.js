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
 * Instagram's media container refused the *content* it was given - wrong
 * format, unfetchable URL, a caption it did not accept - rather than
 * anything about who is asking. Meta nests these under `type: "OAuthException"`
 * exactly like a real permission problem (see isPermissionError below), so
 * this has to be checked first or a bad photo gets misreported as a bad
 * token, which sends whoever reads the log looking in the wrong place.
 *
 * Not an exhaustive registry of Instagram's 220700x content codes - just the
 * ones this app has actually hit. 2207052 is "Only photo or video can be
 * accepted as media type" (the fetched URL was not usable as either), 2207010
 * is caption-too-long (buildListingCaption caps for this, but a future
 * regression should say what it is rather than "check your token scopes"),
 * and 2207020 is an unreachable/invalid image_url. Extend this set rather
 * than isPermissionError's catch-all if another one turns up.
 */
const isMediaContentError = (error) => {
  const graph = graphError(error);
  if (!graph) return false;
  return [2207052, 2207010, 2207020].includes(graph.error_subcode);
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
  isMediaContentError,
  isPermissionError,
  isRateLimitError,
  isPublishLimitError,
  describeGraphError,
};
