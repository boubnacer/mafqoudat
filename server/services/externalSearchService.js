// Manual test: hit GET /external-search?q=iphone&countryCode=MA&language=en
// (No automated test suite in this codebase — see PROJECT_DESCRIPTION.md §5.)
const axios = require('axios');

// Sites to scope the external web search to, per the platform's target markets.
// Keep this list in one place so it's easy to extend as new marketplaces/groups
// become relevant.
const SEARCH_SITES = [
  'facebook.com',
  'avito.ma',
  'marocannonces.com'
];

// Lost/found intent terms, per language, OR'd together in the built query.
const INTENT_TERMS = {
  en: ['lost', 'found'],
  fr: ['perdu', 'trouvé'],
  ar: ['مفقود', 'ضائع', 'وجدت']
};

const SERPER_URL = 'https://google.serper.dev/search';

class ExternalSearchError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ExternalSearchError';
    this.code = code;
  }
}

class ExternalSearchService {
  constructor() {
    this.dailyCount = 0;
    this.resetDate = this.getTodayDateString();
    this.limitHitLogged = false;
  }

  getTodayDateString() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  getDailyLimit() {
    const configured = parseInt(process.env.SERPER_DAILY_LIMIT, 10);
    return Number.isFinite(configured) && configured > 0 ? configured : 500;
  }

  /**
   * Check if we can make API requests (daily quota), resetting the
   * counter if the calendar day has rolled over.
   */
  canMakeRequest() {
    const today = this.getTodayDateString();

    if (today !== this.resetDate) {
      this.dailyCount = 0;
      this.resetDate = today;
      this.limitHitLogged = false;
    }

    const withinLimit = this.dailyCount < this.getDailyLimit();

    if (!withinLimit && !this.limitHitLogged) {
      console.error(`❌ Serper daily quota exceeded: ${this.dailyCount}/${this.getDailyLimit()} requests used on ${this.resetDate}`);
      this.limitHitLogged = true;
    }

    return withinLimit;
  }

  incrementRequestCounter() {
    this.dailyCount++;

    if (this.dailyCount % 50 === 0) {
      console.warn(`⚠️ Serper usage climbing: ${this.dailyCount}/${this.getDailyLimit()} requests used on ${this.resetDate}`);
    }
  }

  getStats() {
    return {
      dailyCount: this.dailyCount,
      dailyLimit: this.getDailyLimit(),
      canMakeRequest: this.canMakeRequest(),
      resetDate: this.resetDate
    };
  }

  /**
   * Build the actual Serper query string: user query plus lost/found intent
   * terms and a site: scope, localized by language.
   */
  buildQuery(userQuery, language) {
    const terms = INTENT_TERMS[language] || INTENT_TERMS.en;
    const intentClause = `(${terms.map(term => `"${term}"`).join(' OR ')})`;
    const siteClause = SEARCH_SITES.map(site => `site:${site}`).join(' OR ');

    return `${intentClause} ${userQuery} ${siteClause}`;
  }

  /**
   * Normalize a single Serper organic result to our shape.
   */
  formatResult(item, position) {
    let source = '';
    try {
      source = new URL(item.link).hostname.replace(/^www\./, '');
    } catch (error) {
      source = '';
    }

    return {
      title: item.title || '',
      snippet: item.snippet || '',
      link: item.link || '',
      source,
      position: item.position || position
    };
  }

  /**
   * Query Serper.dev for lost/found related public web results.
   * @param {Object} params
   * @param {string} params.q - user search query
   * @param {string} [params.countryCode] - ISO 2-letter country code
   * @param {string} [params.language] - 'en' | 'fr' | 'ar'
   * @param {number} [params.limit] - max number of results
   */
  async searchExternal({ q, countryCode, language = 'en', limit = 6 }) {
    if (!process.env.SERPER_API_KEY) {
      throw new ExternalSearchError('Serper API key not configured', 'MISSING_API_KEY');
    }

    if (!this.canMakeRequest()) {
      throw new ExternalSearchError('Serper daily quota exceeded', 'QUOTA_EXCEEDED');
    }

    const builtQuery = this.buildQuery(q, language);

    const body = {
      q: builtQuery,
      hl: language,
      num: limit
    };

    if (countryCode) {
      body.gl = countryCode.toLowerCase();
    }

    try {
      const response = await axios.post(SERPER_URL, body, {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      this.incrementRequestCounter();

      const organic = (response.data && response.data.organic) || [];
      const results = organic
        .slice(0, limit)
        .map((item, index) => this.formatResult(item, index + 1));

      return {
        results,
        stats: this.getStats()
      };
    } catch (error) {
      if (error instanceof ExternalSearchError) {
        throw error;
      }
      throw new ExternalSearchError(`Serper API error: ${error.message}`, 'PROVIDER_ERROR');
    }
  }
}

module.exports = new ExternalSearchService();
module.exports.ExternalSearchError = ExternalSearchError;
