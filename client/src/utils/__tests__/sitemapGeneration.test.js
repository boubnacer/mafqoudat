const fs = require('fs');
const path = require('path');
const {
  generateSitemap,
  generateSitemapIndex,
  normalizeSitemapUrl,
  BASE_URL,
} = require('../../../scripts/generateSitemap');

describe('Sitemap URL Normalization & Non-Redirecting URLs Audit', () => {
  describe('normalizeSitemapUrl', () => {
    test('normalizes root path to canonical https://www.mafqoudat.com/', () => {
      expect(normalizeSitemapUrl('/')).toBe('https://www.mafqoudat.com/');
      expect(normalizeSitemapUrl('')).toBe('https://www.mafqoudat.com/');
      expect(normalizeSitemapUrl(null)).toBe('https://www.mafqoudat.com/');
    });

    test('strips trailing slashes from non-root routes to avoid 308 redirects', () => {
      expect(normalizeSitemapUrl('/about/')).toBe('https://www.mafqoudat.com/about');
      expect(normalizeSitemapUrl('/dash/posts/')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(normalizeSitemapUrl('/blog/my-post/')).toBe('https://www.mafqoudat.com/blog/my-post');
    });

    test('intercepts legacy /posts route and normalizes to /dash/posts', () => {
      expect(normalizeSitemapUrl('/posts')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(normalizeSitemapUrl('/posts/')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(normalizeSitemapUrl('posts')).toBe('https://www.mafqoudat.com/dash/posts');
    });

    test('strips query parameters and hash fragments', () => {
      expect(normalizeSitemapUrl('/dash/posts?city=rabat')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(normalizeSitemapUrl('/about?lang=ar#faq')).toBe('https://www.mafqoudat.com/about');
    });

    test('handles paths without leading slash and collapses multiple slashes', () => {
      expect(normalizeSitemapUrl('dash/posts/')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(normalizeSitemapUrl('//dash///posts//')).toBe('https://www.mafqoudat.com/dash/posts');
    });
  });

  describe('generateSitemap output audit', () => {
    const sitemapXml = generateSitemap();
    const locMatches = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

    test('generates a non-empty set of URLs', () => {
      expect(locMatches.length).toBeGreaterThan(10);
    });

    test('every URL uses the canonical protocol and domain (https://www.mafqoudat.com/)', () => {
      locMatches.forEach((url) => {
        expect(url.startsWith('https://www.mafqoudat.com/')).toBe(true);
      });
    });

    test('no non-root URL has a trailing slash (prevents HTTP 308 redirects)', () => {
      locMatches.forEach((url) => {
        if (url !== 'https://www.mafqoudat.com/') {
          expect(url.endsWith('/')).toBe(false);
        }
      });
    });

    test('no legacy redirecting routes exist (e.g., bare /posts)', () => {
      expect(locMatches).not.toContain('https://www.mafqoudat.com/posts');
      expect(locMatches).toContain('https://www.mafqoudat.com/dash/posts');
    });

    test('contains no duplicate URLs', () => {
      const uniqueUrls = new Set(locMatches);
      expect(uniqueUrls.size).toBe(locMatches.length);
    });
  });

  describe('sitemap-static.xml disk audit', () => {
    const staticSitemapPath = path.join(__dirname, '../../..', 'public', 'sitemap-static.xml');
    const content = fs.readFileSync(staticSitemapPath, 'utf8');
    const locMatches = [...content.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

    test('public/sitemap-static.xml exists and contains valid XML', () => {
      expect(content.startsWith('<?xml')).toBe(true);
      expect(locMatches.length).toBeGreaterThan(10);
    });

    test('all URLs in public/sitemap-static.xml are canonical and have no trailing slashes', () => {
      locMatches.forEach((url) => {
        expect(url.startsWith('https://www.mafqoudat.com/')).toBe(true);
        if (url !== 'https://www.mafqoudat.com/') {
          expect(url.endsWith('/')).toBe(false);
        }
      });
      expect(locMatches).not.toContain('https://www.mafqoudat.com/posts');
    });
  });

  describe('sitemap index audit', () => {
    const indexXml = generateSitemapIndex();
    const locMatches = [...indexXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

    test('index references canonical child sitemaps without trailing slashes', () => {
      expect(locMatches).toEqual([
        'https://www.mafqoudat.com/sitemap-static.xml',
        'https://www.mafqoudat.com/sitemap-posts.xml',
      ]);
    });
  });
});
