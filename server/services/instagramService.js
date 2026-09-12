const axios = require('axios');
const { buildListingCaption, resolveListingImage } = require('./socialCaption');
const {
  GRAPH_BASE_URL,
  describeGraphError,
  graphError,
  isTransientError,
  readRateLimitUsage,
} = require('./graphApi');

// Instagram's limits on what a media container may carry. Every one of them
// is a refusal - the container fails and the listing never reaches the
// account - so they are enforced before the call rather than discovered from
// the error. The image side lives in services/imageWatermark.js; this is the
// caption: 2,200 characters, and a trilingual caption carrying a 2,000
// character description is well past it.
// https://developers.facebook.com/docs/instagram-platform/content-publishing
const CAPTION_MAX_LENGTH = 2200;

const readIntEnv = (name, fallback, { min, max }) => {
  const raw = Number.parseInt(process.env[name], 10);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(Math.max(raw, min), max);
};

// How long to wait for Meta to fetch and process the image after the
// container is created. This used to be ten polls two seconds apart - a
// twenty-second budget - which is the single most likely reason a listing
// "sometimes" did not reach Instagram: Meta downloads the photo from
// Cloudinary itself, and a multi-megabyte JPEG on a slow fetch routinely
// takes longer than that. Meta's own guidance is to poll for up to five
// minutes, which is what this is.
const CONTAINER_TIMEOUT_MS = readIntEnv('INSTAGRAM_CONTAINER_TIMEOUT_SECONDS', 300, { min: 30, max: 900 }) * 1000;

// The poll ramps rather than sitting at Meta's recommended one-minute
// cadence throughout: the overwhelming majority of containers are ready in
// the first few seconds, and waiting a full minute to notice would make
// every publish a minute long. It settles at POLL_MAX_INTERVAL_MS, so a slow
// container costs a handful of very cheap GETs rather than a hundred.
const POLL_FIRST_INTERVAL_MS = 2000;
const POLL_MAX_INTERVAL_MS = readIntEnv('INSTAGRAM_CONTAINER_POLL_MAX_SECONDS', 30, { min: 2, max: 120 }) * 1000;
const POLL_BACKOFF = 1.6;

// Meta fetches the image over the public internet before answering, so the
// container call is the slow one; publishing an already-processed container
// is fast but is also the call whose lost answer creates a duplicate post,
// so it is given room rather than being cut off early.
const CONTAINER_TIMEOUT_REQUEST_MS = 45000;
const PUBLISH_TIMEOUT_REQUEST_MS = 45000;
const READ_TIMEOUT_MS = 15000;

// How many recent media to look through when checking whether a listing is
// already on the account. One page, and only ever on a retry - see
// findPublishedListing.
const RECENT_MEDIA_LIMIT = 50;

// The real publishing quota is asked for rather than assumed, but not on
// every single publish: it is per-account and moves only when something is
// published, so a short cache keeps it one call per batch.
const QUOTA_CACHE_MS = 5 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Meta reports a failed container in a free-text `status` string that usually
 * ends with the subcode in parentheses - "The media could not be created.
 * (2207032)". Pulling it back out is what lets the queue tell a temporary
 * download failure from a file Instagram will never accept, which is the
 * difference between resubmitting the same image and regenerating it.
 *
 * Only Instagram's own content-publishing range is matched. Any other number
 * that happens to be in parentheses is not a subcode, and claiming one is
 * worse than admitting there is none: the caller's fallback is at least a
 * deliberate decision.
 */
const parseStatusSubcode = (status) => {
  const match = /\((2207\d{3})\)/.exec(status || '');
  return match ? Number(match[1]) : null;
};

// What a container failure with no subcode of its own is treated as:
// "only photo or video can be accepted as media type", which is the literal
// description of a container that could not be built from the URL it was
// given. The subcode has to be in Instagram's content-publishing range or the
// queue's classifier falls through to its OAuthException catch-all and reads
// a bad photo as a credentials problem - pausing a platform that is working.
const UNCLASSIFIED_CONTAINER_SUBCODE = 2207052;

/** A failure shaped like a Graph error, so the queue's classifiers see it. */
const containerError = (message, subcode = UNCLASSIFIED_CONTAINER_SUBCODE) => {
  const error = new Error(message);
  error.response = {
    status: 400,
    data: {
      error: {
        code: 9004,
        error_subcode: subcode ?? UNCLASSIFIED_CONTAINER_SUBCODE,
        message,
        type: 'OAuthException',
      },
    },
  };
  return error;
};

class InstagramService {
  /**
   * The timing knobs are constructor options rather than module constants so
   * scripts/testSocialPublishFlow.js can drive the container state machine in
   * milliseconds. A five-minute readiness budget is the right production
   * value and an untestable one.
   */
  constructor({
    containerTimeoutMs = CONTAINER_TIMEOUT_MS,
    pollFirstIntervalMs = POLL_FIRST_INTERVAL_MS,
    pollMaxIntervalMs = POLL_MAX_INTERVAL_MS,
    publishRetryDelayMs = 3000,
  } = {}) {
    this.igUserId = process.env.INSTAGRAM_ACCOUNT_ID;
    // Same System User token as facebookService - it was granted both
    // pages_* and instagram_* scopes, no separate IG token needed.
    this.accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.baseURL = GRAPH_BASE_URL;
    this.quotaCache = null;
    this.containerTimeoutMs = containerTimeoutMs;
    this.pollFirstIntervalMs = pollFirstIntervalMs;
    this.pollMaxIntervalMs = pollMaxIntervalMs;
    this.publishRetryDelayMs = publishRetryDelayMs;
  }

  isConfigured() {
    return !!(this.igUserId && this.accessToken);
  }

  /**
   * Every write goes in a form-encoded body, never the query string.
   *
   * A caption here is trilingual and up to 2,200 characters, most of them
   * Arabic - six bytes each once percent-encoded, so the same caption as a
   * query parameter is a URL of well over ten kilobytes. That is past the
   * point where gateways, proxies and Graph itself start refusing requests
   * outright, and it fails intermittently rather than always: a short listing
   * goes through and a long one does not, which is exactly the shape of "it
   * usually works". Bodies have no such ceiling.
   */
  async post(path, fields, timeout) {
    const body = new URLSearchParams({ ...fields, access_token: this.accessToken });
    return axios.post(`${this.baseURL}${path}`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout,
    });
  }

  async get(path, params, timeout = READ_TIMEOUT_MS) {
    return axios.get(`${this.baseURL}${path}`, {
      params: { ...params, access_token: this.accessToken },
      timeout,
    });
  }

  /**
   * What the account has published in its current rolling window, straight
   * from Meta, or null when it cannot be read.
   *
   * The queue counts its own publishes and can pace against that alone, but
   * that count only knows about posts *this app* made: anything published to
   * the account by hand spends quota nothing here ever saw, and the first
   * sign of it is a refused listing. This is the account's real number, and
   * `quota_total` is the account's real cap - which is not always the 25 that
   * gets quoted, so it is better asked for than hardcoded.
   */
  async publishingQuota() {
    if (!this.isConfigured()) return null;

    const cached = this.quotaCache;
    if (cached && Date.now() - cached.at < QUOTA_CACHE_MS) return cached.value;

    try {
      const response = await this.get(`/${this.igUserId}/content_publishing_limit`, {
        fields: 'config,quota_usage',
      });
      const entry = response.data?.data?.[0];
      if (!entry) return null;

      const value = {
        used: Number(entry.quota_usage) || 0,
        total: Number(entry.config?.quota_total) || null,
        windowSeconds: Number(entry.config?.quota_duration) || null,
        usage: readRateLimitUsage(response),
      };
      this.quotaCache = { at: Date.now(), value };
      return value;
    } catch (error) {
      // Never a reason to hold a publish: the queue's own count and Meta's
      // own refusal (error code 9) both still stand behind this.
      console.warn(`Instagram publishing quota lookup failed: ${describeGraphError(error)}`);
      return null;
    }
  }

  /** Forgets the cached quota, so the next publish decision re-reads it. */
  invalidateQuota() {
    this.quotaCache = null;
  }

  /**
   * Waits for Meta to finish fetching and processing the image behind a
   * container.
   *
   * `status` is asked for alongside `status_code` because the code alone says
   * only "ERROR" - the reason, and the subcode the queue classifies on, are
   * in the string.
   */
  async waitForContainerReady(containerId, { timeoutMs = this.containerTimeoutMs } = {}) {
    const deadline = Date.now() + timeoutMs;
    let interval = this.pollFirstIntervalMs;
    let lastStatus = null;

    for (;;) {
      let response;
      try {
        response = await this.get(`/${containerId}`, { fields: 'status_code,status' });
      } catch (error) {
        // A failed status read is not a failed container. Keep polling while
        // there is budget left; anything still broken at the deadline is
        // reported as the transient failure it is.
        if (!isTransientError(error) || Date.now() >= deadline) throw error;
        await sleep(interval);
        interval = Math.min(Math.round(interval * POLL_BACKOFF), this.pollMaxIntervalMs);
        continue;
      }

      const statusCode = response.data?.status_code;
      lastStatus = response.data?.status || lastStatus;

      // A container that reports PUBLISHED has already been turned into a
      // live post, so it must never be published again - the caller looks the
      // media id up instead. Not reachable from postNewListing, which always
      // starts from a container it just created, but this is the one status
      // where getting it wrong costs a duplicate post, and the method is
      // reachable with any container id.
      if (statusCode === 'FINISHED' || statusCode === 'PUBLISHED') return statusCode;

      if (statusCode === 'ERROR') {
        throw containerError(
          `Instagram could not process the media: ${lastStatus || 'no reason given'}`,
          parseStatusSubcode(lastStatus),
        );
      }

      if (statusCode === 'EXPIRED') {
        // A container lives 24 hours; reaching this means the job was stuck
        // far longer than any backoff here allows, so the container is gone
        // and a fresh one is the only way forward.
        throw containerError('The Instagram media container expired before it could be published', 2207020);
      }

      if (Date.now() + interval >= deadline) {
        throw containerError(
          `Instagram did not finish processing the media within ${Math.round(timeoutMs / 1000)}s `
          + `(last status: ${statusCode || 'unknown'}${lastStatus ? ` - ${lastStatus}` : ''}), please try again`,
          2207003,
        );
      }

      await sleep(interval);
      interval = Math.min(Math.round(interval * POLL_BACKOFF), this.pollMaxIntervalMs);
    }
  }

  /**
   * Publishes a ready container.
   *
   * Two different failures are retried here, and they are not the same thing:
   *
   *  - error_subcode 2207027 ("Media ID is not available") is Meta's known
   *    race where a container reports FINISHED slightly before media_publish's
   *    own readiness check agrees.
   *  - a lost answer - a timeout, a reset, a 5xx - says nothing about whether
   *    the publish happened. Retrying blind is how the same listing ends up on
   *    the account twice, so the container's own status is read first: once it
   *    says PUBLISHED, the post is live and the only thing missing is its id.
   */
  async publishWithRetry(creationId, { maxAttempts = 3, delayMs = this.publishRetryDelayMs } = {}) {
    let lastError;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.post(
          `/${this.igUserId}/media_publish`,
          { creation_id: creationId },
          PUBLISH_TIMEOUT_REQUEST_MS,
        );
        return { mediaId: response.data?.id || null, usage: readRateLimitUsage(response) };
      } catch (error) {
        lastError = error;

        const isMediaNotReady = graphError(error)?.error_subcode === 2207027;
        if (!isMediaNotReady && !isTransientError(error)) throw error;

        // Did it actually go through? Asked before every retry, not only the
        // last: a second publish of the same container is the one duplicate
        // this whole path exists to avoid.
        const published = await this.wasContainerPublished(creationId);
        if (published) return { mediaId: null, alreadyPublished: true, usage: null };

        if (attempt === maxAttempts - 1) throw error;
        await sleep(delayMs);
      }
    }

    throw lastError;
  }

  /** Whether a container has already been turned into a live post. */
  async wasContainerPublished(containerId) {
    try {
      const response = await this.get(`/${containerId}`, { fields: 'status_code' });
      return response.data?.status_code === 'PUBLISHED';
    } catch (error) {
      // Unknown is not "no": answering false here only means the caller
      // falls back to findPublishedListing, which checks the account itself.
      console.warn(`Instagram container status re-check failed for ${containerId}: ${describeGraphError(error)}`);
      return false;
    }
  }

  /**
   * The published copy of a listing, if the account already carries one.
   *
   * Every caption links back to the listing, and that URL is unique to it, so
   * the account's own recent media is an authoritative answer to "did this
   * already go up?" - which nothing else can give, since Graph has no
   * idempotency key and a lost answer is indistinguishable from a refusal.
   *
   * Only ever called before a *retry*: on the first attempt there is nothing
   * to have duplicated, and this would be one wasted call per listing.
   */
  async findPublishedListing(post) {
    if (!this.isConfigured() || !post?._id) return null;

    const marker = `/dash/posts/${post._id}`;
    try {
      const response = await this.get(`/${this.igUserId}/media`, {
        fields: 'id,caption,permalink',
        limit: RECENT_MEDIA_LIMIT,
      });
      const match = (response.data?.data || []).find((media) => String(media.caption || '').includes(marker));
      return match ? { mediaId: match.id, permalink: match.permalink || null } : null;
    } catch (error) {
      console.warn(`Instagram duplicate check failed for post ${post._id}: ${describeGraphError(error)}`);
      return null;
    }
  }

  /**
   * The public instagram.com URL of a published media. Only the opaque media
   * id comes back from media_publish, and an IG permalink cannot be derived
   * from it, so it has to be asked for.
   */
  async resolvePermalink(mediaId) {
    try {
      const response = await this.get(`/${mediaId}`, { fields: 'permalink' });
      return response.data?.permalink || null;
    } catch (error) {
      console.warn(`Instagram permalink lookup failed for ${mediaId}: ${describeGraphError(error)}`);
      return null;
    }
  }

  /**
   * Posts a newly created listing to the configured Instagram Business account.
   *
   * Resolves to `{ mediaId, permalink, usage }` (or null when unconfigured) so
   * the caller can store the handle this listing is reachable by on IG, and
   * slow down before Meta starts refusing calls.
   */
  async postNewListing(post) {
    if (!this.isConfigured()) {
      console.warn('Instagram posting skipped: INSTAGRAM_ACCOUNT_ID / FACEBOOK_PAGE_ACCESS_TOKEN not configured');
      return null;
    }

    const { imageUrl, isPlaceholder } = await resolveListingImage(post);
    const caption = await buildListingCaption(post, { isPlaceholder, maxLength: CAPTION_MAX_LENGTH });

    // Instagram publishing is a two-step Graph API flow: create a media
    // container from the image, then publish that container.
    const containerResponse = await this.post(
      `/${this.igUserId}/media`,
      { image_url: imageUrl, caption },
      CONTAINER_TIMEOUT_REQUEST_MS,
    );
    const containerId = containerResponse.data?.id;
    if (!containerId) {
      throw containerError('Instagram returned no media container id, please try again', 2207032);
    }

    const readyStatus = await this.waitForContainerReady(containerId);

    // The container was already published - only possible if a previous
    // attempt's answer was lost. Nothing more to publish; find the live post.
    if (readyStatus === 'PUBLISHED') {
      const existing = await this.findPublishedListing(post);
      if (existing) return { ...existing, usage: null };
      throw containerError(
        'The Instagram container reports it was already published but the media could not be found, please try again',
        2207003,
      );
    }

    const publishResult = await this.publishWithRetry(containerId);

    // Published, but the id came back on a call whose answer was lost. The
    // account itself is the source of truth for which media it is.
    if (publishResult.alreadyPublished || !publishResult.mediaId) {
      const existing = await this.findPublishedListing(post);
      if (existing) return { ...existing, usage: publishResult.usage || null };
      throw containerError(
        'Instagram accepted the publish but did not return a media id, please try again',
        2207003,
      );
    }

    // The account just spent a slot; the cached figure is now stale.
    this.invalidateQuota();

    return {
      mediaId: publishResult.mediaId,
      permalink: await this.resolvePermalink(publishResult.mediaId),
      usage: publishResult.usage,
    };
  }
}

module.exports = new InstagramService();
module.exports.InstagramService = InstagramService;
