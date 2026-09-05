const axios = require('axios');
const { buildListingCaption, resolveListingImage } = require('./socialCaption');
const { GRAPH_BASE_URL, describeGraphError } = require('./graphApi');

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
   * The public URL of a Page post. Asked for rather than assembled, because
   * the shape of a Page post URL is not ours to guess; `https://facebook.com/
   * {page-id}_{post-id}` happens to redirect today and is kept only as the
   * fallback for when the lookup itself fails.
   */
  async resolvePermalink(fbPostId) {
    try {
      const response = await axios.get(`${this.baseURL}/${fbPostId}`, {
        params: { fields: 'permalink_url', access_token: this.pageAccessToken },
        timeout: 10000,
      });
      if (response.data?.permalink_url) return response.data.permalink_url;
    } catch (error) {
      console.warn(`Facebook permalink lookup failed for ${fbPostId}: ${describeGraphError(error)}`);
    }
    return `https://www.facebook.com/${fbPostId}`;
  }

  /**
   * Posts a newly created listing to the configured Facebook Page.
   * Never throws past this point in a way that should block post creation -
   * callers are expected to fire-and-forget and log/catch.
   *
   * Resolves to `{ postId, permalink }` (or null when unconfigured): the
   * caller stores those on the post, which is what later makes it possible to
   * ask the Graph API how the listing is doing on the Page.
   */
  async postNewListing(post) {
    if (!this.isConfigured()) {
      console.warn('Facebook posting skipped: FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN not configured');
      return null;
    }

    const { imageUrl, isPlaceholder } = resolveListingImage(post);
    const caption = await buildListingCaption(post, { isPlaceholder });

    const response = await axios.post(`${this.baseURL}/${this.pageId}/photos`, null, {
      params: { url: imageUrl, caption, access_token: this.pageAccessToken },
      timeout: 10000,
    });

    // A /photos publish answers with the photo id and, separately, the id of
    // the Page post wrapping it. Engagement lives on the post, not the photo.
    const postId = response.data.post_id || response.data.id;

    return { postId, permalink: await this.resolvePermalink(postId) };
  }
}

module.exports = new FacebookService();
