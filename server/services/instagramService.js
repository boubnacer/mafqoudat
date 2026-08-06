const axios = require('axios');
const { buildListingCaption } = require('./socialCaption');

const GRAPH_API_VERSION = 'v26.0';

class InstagramService {
  constructor() {
    this.igUserId = process.env.INSTAGRAM_ACCOUNT_ID;
    // Same System User token as facebookService - it was granted both
    // pages_* and instagram_* scopes, no separate IG token needed.
    this.accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.baseURL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
  }

  isConfigured() {
    return !!(this.igUserId && this.accessToken);
  }

  /**
   * Posts a newly created listing to the configured Instagram Business account.
   * Never throws past this point in a way that should block post creation -
   * callers are expected to fire-and-forget and log/catch.
   */
  async postNewListing(post) {
    if (!this.isConfigured()) {
      console.warn('Instagram posting skipped: INSTAGRAM_ACCOUNT_ID / FACEBOOK_PAGE_ACCESS_TOKEN not configured');
      return null;
    }

    const imageUrl = post.cloudinaryUrl || post.image;
    if (!imageUrl) {
      console.warn(`Instagram posting skipped for post ${post._id}: no image`);
      return null;
    }

    const caption = await buildListingCaption(post);

    // Instagram publishing is a two-step Graph API flow: create a media
    // container from the image, then publish that container.
    const containerResponse = await axios.post(`${this.baseURL}/${this.igUserId}/media`, null, {
      params: {
        image_url: imageUrl,
        caption,
        access_token: this.accessToken,
      },
      timeout: 15000,
    });

    const publishResponse = await axios.post(`${this.baseURL}/${this.igUserId}/media_publish`, null, {
      params: {
        creation_id: containerResponse.data.id,
        access_token: this.accessToken,
      },
      timeout: 15000,
    });

    console.log(`✅ Instagram: posted post ${post._id} as IG media ${publishResponse.data.id}`);
    return publishResponse.data;
  }
}

module.exports = new InstagramService();
