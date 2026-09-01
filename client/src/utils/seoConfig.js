const BASE_URL = 'https://www.mafqoudat.com';

export const SUPPORTED_LANGUAGES = ['en', 'ar', 'fr'];

export const LOCALE_MAP = {
  en: 'en_US',
  ar: 'ar_AR',
  fr: 'fr_FR',
};

export const defaultSeo = {
  siteName: 'Mafqoudat',
  title: 'Mafqoudat - Lost and Found Platform | Morocco',
  description:
    'Mafqoudat is the leading lost and found platform in Morocco and the Arab world. Report lost items, share found items, and reunite communities with their belongings.',
  path: '/',
  image: `${BASE_URL}/maflogo1200-630.png`,
  // Intentionally empty. The site-wide WebSite and Organization schemas live in
  // public/index.html, which is the only place that reaches crawlers that don't
  // run JavaScript. Emitting a WebSite schema here too put two of them on every
  // page that falls back to this default (the homepage among them). SeoMeta is
  // for page-specific schema - breadcrumbs, articles, ItemPage - and pages with
  // none simply add nothing on top of the shell's.
  structuredData: [],
};

export const createBreadcrumbSchema = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: buildAbsoluteUrl(item.path),
  })),
});

export const createArticleSchema = ({
  title,
  description,
  image,
  path,
  datePublished,
  authorName,
  inLanguage,
}) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description,
  image: image ? buildAbsoluteUrl(image) : defaultSeo.image,
  url: buildAbsoluteUrl(path),
  mainEntityOfPage: buildAbsoluteUrl(path),
  datePublished,
  dateModified: datePublished,
  inLanguage: inLanguage || 'en',
  author: {
    '@type': 'Organization',
    name: authorName || defaultSeo.siteName,
  },
  publisher: {
    '@type': 'Organization',
    name: defaultSeo.siteName,
    logo: {
      '@type': 'ImageObject',
      url: defaultSeo.image,
    },
  },
});

export const buildAbsoluteUrl = (path = '/') => {
  if (!path) return BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('/')) {
    return `${BASE_URL}${path}`;
  }
  return `${BASE_URL}/${path}`;
};

// Per-page path + structured data.
//
// The title/description here are a FALLBACK only. The copy SeoMeta actually
// renders lives in translations.js's `seoPages` block, keyed by the same page
// keys used below, so a page gets its title in the language it is displaying -
// these English strings are what a key with no entry there falls back to. The
// structured data stays here because it is language-independent.
export const pageSeoConfig = {
  home: {
    path: '/',
    title: 'Mafqoudat - Lost and Found Platform | Morocco',
    description:
      'Reconnect with your belongings through Mafqoudat. Report lost items, browse found items, and collaborate with your community across Morocco and the Arab region.',
    // No breadcrumbs on the homepage (it is the root), and the site-wide
    // WebSite/Organization schemas come from the shell - so nothing to add.
    structuredData: [],
  },
  // No "posts" key: the /posts listing page is gone (see App.js). Anything
  // describing the listing belongs under dashPosts, the surviving route.
  about: {
    path: '/about',
    title: 'About Mafqoudat | Lost and Found Community',
    description:
      'Learn about Mafqoudat’s mission to connect communities across Morocco and the Arab world to reunite lost items with their owners through a trusted platform.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
      ]),
    ],
  },
  contact: {
    path: '/contact',
    title: 'Contact Mafqoudat | Support & Partnerships',
    description:
      'Need help with a lost or found item? Contact Mafqoudat for support, media inquiries, and partnership opportunities. We are here to help 24/7.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Contact', path: '/contact' },
      ]),
    ],
  },
  help: {
    path: '/help',
    title: 'Help Center | Mafqoudat Lost and Found',
    description:
      'Get answers to common questions about Mafqoudat. Learn how to report lost items, verify found items, and stay safe while using our platform.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Help Center', path: '/help' },
      ]),
    ],
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy Policy | Mafqoudat',
    description:
      'Read the Mafqoudat privacy policy to understand how we protect your personal data and ensure security for everyone using our lost and found platform.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Privacy Policy', path: '/privacy' },
      ]),
    ],
  },
  deleteAccount: {
    path: '/delete-account',
    title: 'Delete Your Account | Mafqoudat',
    description:
      'Permanently delete your Mafqoudat account and all of the data stored with it, from the web or from inside the mobile app.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Delete Account', path: '/delete-account' },
      ]),
    ],
  },
  terms: {
    path: '/terms',
    title: 'Terms of Use | Mafqoudat',
    description:
      'Review the Mafqoudat terms of use for our lost and found services. Learn about user responsibilities, acceptable use, and platform guidelines.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Terms of Use', path: '/terms' },
      ]),
    ],
  },
  cookies: {
    path: '/cookies',
    title: 'Cookie Notice | Mafqoudat',
    description:
      'Understand how Mafqoudat uses cookies to improve your experience on our lost and found platform. Learn about your options and privacy settings.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Cookie Notice', path: '/cookies' },
      ]),
    ],
  },
  guidelines: {
    path: '/guidelines',
    title: 'Community Guidelines | Mafqoudat',
    description:
      'Read the Mafqoudat community guidelines to ensure a respectful and safe environment while helping people recover lost items across the region.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Community Guidelines', path: '/guidelines' },
      ]),
    ],
  },
  safety: {
    path: '/safety',
    title: 'Safety Tips | Mafqoudat',
    description:
      'Stay safe while meeting to exchange lost and found items. Mafqoudat shares best practices to protect yourself and ensure trustworthy interactions.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Safety Tips', path: '/safety' },
      ]),
    ],
  },
  blog: {
    path: '/blog',
    title: 'Mafqoudat Blog | Lost and Found Stories & Tips',
    description:
      'Explore Mafqoudat blog articles featuring success stories, prevention tips, and community updates about lost and found efforts in Morocco and beyond.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
      ]),
    ],
  },
  dash: {
    path: '/dash',
    title: 'Dashboard | Mafqoudat Lost and Found',
    description:
      'Browse lost and found items on Mafqoudat dashboard. View trending posts, recent items, and help reunite belongings with their owners across Morocco.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Dashboard', path: '/dash' },
      ]),
    ],
  },
  dashPosts: {
    path: '/dash/posts',
    title: 'Lost and Found Posts | Mafqoudat',
    description:
      'Explore all lost and found posts on Mafqoudat. Search and filter by category, location, and status to find or report lost items across Morocco and the Arab world.',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Dashboard', path: '/dash' },
        { name: 'Posts', path: '/dash/posts' },
      ]),
    ],
  },
};

export default pageSeoConfig;
