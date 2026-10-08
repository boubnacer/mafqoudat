import { buildAbsoluteUrl, normalizePath } from '../seoConfig';

describe('Canonical URL Normalization & Trailing-Slash Consistency', () => {
  describe('normalizePath', () => {
    test('normalizes root path to "/"', () => {
      expect(normalizePath('/')).toBe('/');
      expect(normalizePath('')).toBe('/');
      expect(normalizePath()).toBe('/');
    });

    test('strips trailing slashes from routes', () => {
      expect(normalizePath('/dash/posts/')).toBe('/dash/posts');
      expect(normalizePath('/about/')).toBe('/about');
      expect(normalizePath('/blog/my-post/')).toBe('/blog/my-post');
    });

    test('preserves routes that already have no trailing slash', () => {
      expect(normalizePath('/dash/posts')).toBe('/dash/posts');
      expect(normalizePath('/about')).toBe('/about');
    });

    test('strips query strings and hash fragments', () => {
      expect(normalizePath('/dash/posts?city=casablanca')).toBe('/dash/posts');
      expect(normalizePath('/dash/posts/?city=rabat#section')).toBe('/dash/posts');
      expect(normalizePath('/about?lang=ar')).toBe('/about');
      expect(normalizePath('/#top')).toBe('/');
    });

    test('handles paths without leading slash and collapses multiple slashes', () => {
      expect(normalizePath('dash/posts/')).toBe('/dash/posts');
      expect(normalizePath('//dash///posts//')).toBe('/dash/posts');
      expect(normalizePath('//')).toBe('/');
    });
  });

  describe('buildAbsoluteUrl', () => {
    test('enforces https://www.mafqoudat.com origin for root', () => {
      expect(buildAbsoluteUrl('/')).toBe('https://www.mafqoudat.com/');
      expect(buildAbsoluteUrl('')).toBe('https://www.mafqoudat.com/');
      expect(buildAbsoluteUrl()).toBe('https://www.mafqoudat.com/');
    });

    test('enforces canonical origin and strips trailing slash for non-root routes', () => {
      expect(buildAbsoluteUrl('/dash/posts/')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(buildAbsoluteUrl('/dash/posts')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(buildAbsoluteUrl('/about/')).toBe('https://www.mafqoudat.com/about');
    });

    test('strips query parameters and hash fragments', () => {
      expect(buildAbsoluteUrl('/dash/posts?city=rabat')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(buildAbsoluteUrl('/dash/posts/?city=rabat#details')).toBe('https://www.mafqoudat.com/dash/posts');
    });

    test('normalizes full URLs with localhost, non-www, http to https://www.mafqoudat.com', () => {
      expect(buildAbsoluteUrl('https://www.mafqoudat.com/dash/posts/')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(buildAbsoluteUrl('http://mafqoudat.com/dash/posts/?city=rabat')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(buildAbsoluteUrl('http://localhost:3000/dash/posts/')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(buildAbsoluteUrl('https://www.mafqoudat.com/')).toBe('https://www.mafqoudat.com/');
    });

    test('preserves third-party external URLs', () => {
      const cdnUrl = 'https://res.cloudinary.com/mafqoudat/image/upload/v1234/test.jpg';
      expect(buildAbsoluteUrl(cdnUrl)).toBe(cdnUrl);
    });
  });

  describe('inline script in index.html logic', () => {
    function computeCanonical(pathname) {
      let path = pathname || '/';
      path = path.split('?')[0].split('#')[0];
      if (path.length > 1 && path.charAt(path.length - 1) === '/') {
        path = path.replace(/\/+$/, '');
      }
      if (!path) {
        path = '/';
      }
      return 'https://www.mafqoudat.com' + path;
    }

    test('normalizes trailing slashes and query strings', () => {
      expect(computeCanonical('/dash/posts/')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(computeCanonical('/dash/posts')).toBe('https://www.mafqoudat.com/dash/posts');
      expect(computeCanonical('/')).toBe('https://www.mafqoudat.com/');
      expect(computeCanonical('/about/')).toBe('https://www.mafqoudat.com/about');
      expect(computeCanonical('/dash/posts/?city=rabat')).toBe('https://www.mafqoudat.com/dash/posts');
    });
  });
});
