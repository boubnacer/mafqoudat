/**
 * Shared state for OAuth flow
 * Used to communicate between deep link handler and OAuth flow
 */

let oauthCallbackPromise = null;
let oauthResolve = null;

export const oauthState = {
  /**
   * Wait for OAuth callback
   * @returns {Promise<Object>} OAuth result
   */
  waitForCallback: () => {
    if (!oauthCallbackPromise) {
      oauthCallbackPromise = new Promise((resolve) => {
        oauthResolve = resolve;
      });
    }
    return oauthCallbackPromise;
  },

  /**
   * Resolve OAuth callback
   * @param {Object} result - OAuth result
   */
  resolveCallback: (result) => {
    if (oauthResolve) {
      oauthResolve(result);
      oauthResolve = null;
      oauthCallbackPromise = null;
    }
  },

  /**
   * Clear OAuth state
   */
  clear: () => {
    oauthResolve = null;
    oauthCallbackPromise = null;
  },
};

