const axios = require('axios');
const { buildListingCaption, resolveListingImage } = require('./socialCaption');
const { GRAPH_BASE_URL, describeGraphError } = require('./graphApi');

class InstagramService {
  constructor() {
    this.igUserId = process.env.INSTAGRAM_ACCOUNT_ID;
    // Same System User token as facebookService - it was granted both
    // pages_* and instagram_* scopes, no separate IG token needed.
    this.accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.baseURL = GRAPH_BASE_URL;
  }

  isConfigured() {
    return !!(this.igUserId && this.accessToken);
  }

  /**
   * IG needs time to fetch/process the image after container creation -
   * publishing immediately can fail with "Media ID is not available"
   * (error_subcode 2207027). Poll status_code until it's FINISHED.
   */
  async waitForContainerReady(containerId, { maxAttempts = 10, delayMs = 2000 } = {}) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await axios.get(`${this.baseURL}/${containerId}`, {
        params: { fields: 'status_code', access_token: this.accessToken },
        timeout: 10000,
      });

      const status = statusResponse.data.status_code;
      if (status === 'FINISHED') return;
      if (status === 'ERROR') {
        throw new Error('Instagram media container failed processing (status: ERROR)');
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error('Instagram media container not ready after polling timeout');
  }

  /**
   * Meta has a known race where status_code reports FINISHED slightly
   * before media_publish's own readiness check catches up, failing with
   * error_subcode 2207027 ("Media ID is not available") even though
   * waitForContainerReady just confirmed FINISHED. Retry on that specific
   * error instead of treating it as final.
   */
  async publishWithRetry(creationId, { maxAttempts = 3, delayMs = 3000 } = {}) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const publishResponse = await axios.post(`${this.baseURL}/${this.igUserId}/media_publish`, null, {
          params: { creation_id: creationId, access_token: this.accessToken },
          timeout: 15000,
        });
        return publishResponse.data;
      } catch (error) {
        const isMediaNotReady = error.response?.data?.error?.error_subcode === 2207027;
        const isLastAttempt = attempt === maxAttempts - 1;
        if (!isMediaNotReady || isLastAttempt) throw error;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * The public instagram.com URL of a published media. Only the opaque media
   * id comes back from media_publish, and an IG permalink cannot be derived
   * from it, so it has to be asked for.
   */
  async resolvePermalink(mediaId) {
    try {
      const response = await axios.get(`${this.baseURL}/${mediaId}`, {
        params: { fields: 'permalink', access_token: this.accessToken },
        timeout: 10000,
      });
      return response.data?.permalink || null;
    } catch (error) {
      console.warn(`Instagram permalink lookup failed for ${mediaId}: ${describeGraphError(error)}`);
      return null;
    }
  }

  /**
   * Posts a newly created listing to the configured Instagram Business account.
   * Never throws past this point in a way that should block post creation -
   * callers are expected to fire-and-forget and log/catch.
   *
   * Resolves to `{ mediaId, permalink }` (or null when unconfigured) so the
   * caller can store the handle this listing is reachable by on IG.
   */
  async postNewListing(post) {
    if (!this.isConfigured()) {
      console.warn('Instagram posting skipped: INSTAGRAM_ACCOUNT_ID / FACEBOOK_PAGE_ACCESS_TOKEN not configured');
      return null;
    }

    const { imageUrl, isPlaceholder } = resolveListingImage(post);
    const caption = await buildListingCaption(post, { isPlaceholder });

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

    await this.waitForContainerReady(containerResponse.data.id);

    const publishData = await this.publishWithRetry(containerResponse.data.id);

    return { mediaId: publishData.id, permalink: await this.resolvePermalink(publishData.id) };
  }
}

module.exports = new InstagramService();
