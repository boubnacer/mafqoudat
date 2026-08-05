const axios = require('axios');
const FoundLost = require('../models/FoundLost');
const City = require('../models/City');

const GRAPH_API_VERSION = 'v19.0';

class FacebookService {
  constructor() {
    this.pageId = process.env.FACEBOOK_PAGE_ID;
    this.pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.baseURL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
  }

  isConfigured() {
    return !!(this.pageId && this.pageAccessToken);
  }

  buildCaption(post, foundLostLabel, cityLabel) {
    const lines = [];
    const heading = cityLabel ? `${foundLostLabel} — ${cityLabel}` : foundLostLabel;
    lines.push(heading);
    if (post.description) lines.push(post.description);
    if (post.exactLocation) lines.push(post.exactLocation);
    return lines.join('\n\n');
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

    const imageUrl = post.cloudinaryUrl || post.image;
    if (!imageUrl) {
      console.warn(`Facebook posting skipped for post ${post._id}: no image`);
      return null;
    }

    const [foundLost, city] = await Promise.all([
      FoundLost.findById(post.foundLost).select('labels').lean(),
      post.city ? City.findById(post.city).select('labels').lean() : Promise.resolve(null),
    ]);

    const caption = this.buildCaption(
      post,
      foundLost?.labels?.en || '',
      city?.labels?.en || ''
    );

    const response = await axios.post(`${this.baseURL}/${this.pageId}/photos`, null, {
      params: {
        url: imageUrl,
        caption,
        access_token: this.pageAccessToken,
      },
      timeout: 10000,
    });

    console.log(`✅ Facebook: posted post ${post._id} as FB post ${response.data.post_id || response.data.id}`);
    return response.data;
  }
}

module.exports = new FacebookService();
