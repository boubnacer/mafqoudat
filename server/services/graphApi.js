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

/** The token lacks the permission this edge needs (e.g. read_insights). */
const isPermissionError = (error) => {
  const graph = graphError(error);
  if (!graph) return false;
  return graph.code === 10 || graph.code === 200 || graph.type === 'OAuthException';
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
  isPermissionError,
  describeGraphError,
};
