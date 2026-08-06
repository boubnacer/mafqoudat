const axios = require('axios');
const { buildListingCaption, resolveListingImage } = require('./socialCaption');

const GRAPH_API_VERSION = 'v26.0';

class FacebookService {
  constructor() {
    this.pageId = process.env.FACEBOOK_PAGE_ID;
    this.pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.baseURL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
  }

  isConfigured() {
    return !!(this.pageId && this.pageAccessToken);
  }

  /**
   * Posts a newly created listing to the configured Facebook Page.
   * Never throws past this point in a way that should block post creation -
   * callers are expected to fire-and-forget and log/catch.
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

    console.log(`✅ Facebook: posted post ${post._id} as FB post ${response.data.post_id || response.data.id}`);
    return response.data;
  }
}

module.exports = new FacebookService();
