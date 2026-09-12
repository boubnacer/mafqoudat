const axios = require('axios');
const { buildListingCaption, resolveListingImage } = require('./socialCaption');
const { GRAPH_BASE_URL, describeGraphError, readRateLimitUsage } = require('./graphApi');

// Meta fetches the photo from the URL it is given before answering, so the
// publish call waits on a download it does not control. Ten seconds was
// enough for a small file on a good day and is exactly the kind of margin
// that produces an intermittent failure - and, worse, a timeout here cannot
// tell a refused publish from a successful one whose answer was lost.
const PUBLISH_TIMEOUT_MS = 45000;
const READ_TIMEOUT_MS = 15000;

// How many recent Page stories to look through when checking whether a
// listing is already on the Page. One page, and only ever on a retry.
const RECENT_POST_LIMIT = 50;

class FacebookService {
  constructor() {
    this.pageId = process.env.FACEBOOK_PAGE_ID;
    this.pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.baseURL = GRAPH_BASE_URL;
  }

  isConfigured() {
    return !!(this.pageId && this.pageAccessToken);
  }

  /**
   * Writes go in a form-encoded body rather than the query string, for the
   * same reason as Instagram's (see instagramService.post): a trilingual
   * Arabic caption percent-encodes to several times its character count, and
   * a URL that long is refused by gateways well before Graph ever sees it -
   * intermittently, since it depends on how long this particular listing's
   * city and category names are.
   */
  async post(path, fields, timeout = PUBLISH_TIMEOUT_MS) {
    const body = new URLSearchParams({ ...fields, access_token: this.pageAccessToken });
    return axios.post(`${this.baseURL}${path}`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout,
    });
  }

  async get(path, params, timeout = READ_TIMEOUT_MS) {
    return axios.get(`${this.baseURL}${path}`, {
      params: { ...params, access_token: this.pageAccessToken },
      timeout,
    });
  }

  /**
   * The public URL of a Page post. Asked for rather than assembled, because
   * the shape of a Page post URL is not ours to guess; `https://facebook.com/
   * {page-id}_{post-id}` happens to redirect today and is kept only as the
   * fallback for when the lookup itself fails.
   */
  async resolvePermalink(fbPostId) {
    try {
      const response = await this.get(`/${fbPostId}`, { fields: 'permalink_url' });
      if (response.data?.permalink_url) return response.data.permalink_url;
    } catch (error) {
      console.warn(`Facebook permalink lookup failed for ${fbPostId}: ${describeGraphError(error)}`);
    }
    return `https://www.facebook.com/${fbPostId}`;
  }

  /**
   * The published copy of a listing, if the Page already carries one.
   *
   * Graph has no idempotency key, so a publish whose answer was lost - a
   * timeout, a reset, a process that died between the call and the write -
   * is indistinguishable from one that was refused. The caption carries the
   * listing's own URL, which nothing else on the Page does, so the Page
   * itself can answer the question.
   *
   * Two edges, because a photo published through /photos surfaces as a Page
   * story whose `message` is the caption, but an unusual privacy or
   * publishing setting can leave it out of /feed; /photos indexes the same
   * upload under `name`, and `page_story_id` is the id of the story wrapping
   * it - which is the id engagement lives on, and the one stored on the post.
   *
   * Answers null on any failure: a duplicate check that cannot be made must
   * never block a publish, and falling through leaves exactly the behaviour
   * that was there before it existed.
   */
  async findPublishedListing(post) {
    if (!this.isConfigured() || !post?._id) return null;

    const marker = `/dash/posts/${post._id}`;
    const carriesMarker = (text) => String(text || '').includes(marker);

    try {
      const feed = await this.get(`/${this.pageId}/feed`, {
        fields: 'id,message,permalink_url',
        limit: RECENT_POST_LIMIT,
      });
      const story = (feed.data?.data || []).find((item) => carriesMarker(item.message));
      if (story) return { postId: story.id, permalink: story.permalink_url || null };
    } catch (error) {
      console.warn(`Facebook duplicate check (feed) failed for post ${post._id}: ${describeGraphError(error)}`);
    }

    try {
      const photos = await this.get(`/${this.pageId}/photos`, {
        type: 'uploaded',
        fields: 'id,name,page_story_id',
        limit: RECENT_POST_LIMIT,
      });
      const photo = (photos.data?.data || []).find((item) => carriesMarker(item.name));
      if (photo) {
        const postId = photo.page_story_id || photo.id;
        return { postId, permalink: await this.resolvePermalink(postId) };
      }
    } catch (error) {
      console.warn(`Facebook duplicate check (photos) failed for post ${post._id}: ${describeGraphError(error)}`);
    }

    return null;
  }

  /**
   * Posts a newly created listing to the configured Facebook Page.
   *
   * Resolves to `{ postId, permalink, usage }` (or null when unconfigured):
   * the caller stores the ids on the post, which is what later makes it
   * possible to ask the Graph API how the listing is doing on the Page, and
   * reads `usage` to slow down before Meta starts refusing calls.
   */
  async postNewListing(post) {
    if (!this.isConfigured()) {
      console.warn('Facebook posting skipped: FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN not configured');
      return null;
    }

    const { imageUrl, isPlaceholder } = await resolveListingImage(post);
    const caption = await buildListingCaption(post, { isPlaceholder });

    const response = await this.post(`/${this.pageId}/photos`, { url: imageUrl, caption });

    // A /photos publish answers with the photo id and, separately, the id of
    // the Page post wrapping it. Engagement lives on the post, not the photo.
    const postId = response.data?.post_id || response.data?.id;
    if (!postId) return { postId: null, permalink: null, usage: readRateLimitUsage(response) };

    return {
      postId,
      permalink: await this.resolvePermalink(postId),
      usage: readRateLimitUsage(response),
    };
  }
}

module.exports = new FacebookService();
module.exports.FacebookService = FacebookService;
