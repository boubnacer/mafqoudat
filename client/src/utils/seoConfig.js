const BASE_URL = 'https://www.mafqoudat.com';

export const SUPPORTED_LANGUAGES = ['en', 'ar', 'fr'];

export const LOCALE_MAP = {
  en: 'en_US',
  ar: 'ar_AR',
  fr: 'fr_FR',
};

export const defaultKeywords = [
  'mafqoudat',
  'mafqudat',
  'mafqodat',
  'mafqud',
  'mafqod',
  'mafkoudat',
  'mafkudat',
  'mafkodat',
  'mafkoud',
  'mafkod',
  'mafqoudat.com',
  'مفقودات',
  'مفقود',
  'موجودات',
  'فقد',
  'فقدان',
  'ضياع',
  'وجدت',
  'وجد',
  'منصة مفقودات',
  'lost and found',
  'lost and found Morocco',
  'lost and found platform',
  'lost items',
  'found items',
  'community lost and found',
  'Morocco lost and found',
  'Arab world lost and found',
];

export const defaultSeo = {
  siteName: 'Mafqoudat',
  title: 'Mafqoudat - Lost and Found Platform | Morocco',
  description:
    'Mafqoudat is the leading lost and found platform in Morocco and the Arab world. Report lost items, share found items, and reunite communities with their belongings.',
  keywords: defaultKeywords,
  path: '/',
  image: `${BASE_URL}/maflogo1200-630.png`,
  structuredData: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Mafqoudat',
      description: 'Lost and found platform for Morocco and the Arab world',
      url: BASE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${BASE_URL}/dash/posts?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

const createBreadcrumbSchema = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: buildAbsoluteUrl(item.path),
  })),
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

const sharedPageKeywords = [
  'mafqoudat community',
  'lost and found support',
  'mafqoudat help',
  'مفقودات المغرب',
  'منصة مفقودات المغرب',
  'mafqoudat platform',
];

export const pageSeoConfig = {
  home: {
    path: '/',
    title: 'Mafqoudat - Lost and Found Platform | Morocco',
    description:
      'Reconnect with your belongings through Mafqoudat. Report lost items, browse found items, and collaborate with your community across Morocco and the Arab region.',
    keywords: defaultKeywords,
    structuredData: defaultSeo.structuredData,
  },
  posts: {
    path: '/posts',
    title: 'Explore Lost and Found Posts | Mafqoudat',
    description:
      'Browse the latest lost and found posts on Mafqoudat. Filter by category, location, and status to help reunite items with their owners across Morocco.',
    keywords: [...defaultKeywords, 'lost and found posts', 'lost items Morocco', 'found items Morocco'],
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Posts', path: '/posts' },
      ]),
    ],
  },
  about: {
    path: '/about',
    title: 'About Mafqoudat | Lost and Found Community',
    description:
      'Learn about Mafqoudat’s mission to connect communities across Morocco and the Arab world to reunite lost items with their owners through a trusted platform.',
    keywords: [...defaultKeywords, 'about Mafqoudat', 'mafqoudat mission', 'lost and found community'],
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
    keywords: [...defaultKeywords, 'contact mafqoudat', 'mafqoudat support', 'lost and found contact'],
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
    keywords: [...defaultKeywords, 'mafqoudat help center', 'lost and found faq', 'mafqoudat support center'],
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
    keywords: [...defaultKeywords, 'mafqoudat privacy policy', 'lost and found privacy', 'data protection mafqoudat'],
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Privacy Policy', path: '/privacy' },
      ]),
    ],
  },
  terms: {
    path: '/terms',
    title: 'Terms of Use | Mafqoudat',
    description:
      'Review the Mafqoudat terms of use for our lost and found services. Learn about user responsibilities, acceptable use, and platform guidelines.',
    keywords: [...defaultKeywords, 'mafqoudat terms', 'lost and found terms', 'mafqoudat guidelines'],
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
    keywords: [...defaultKeywords, 'mafqoudat cookies', 'cookie policy', 'tracking consent'],
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
    keywords: [...defaultKeywords, 'mafqoudat guidelines', 'lost and found rules', 'community safety mafqoudat'],
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
    keywords: [...defaultKeywords, 'mafqoudat safety tips', 'lost and found safety', 'safe meetups'],
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
    keywords: [...defaultKeywords, 'mafqoudat blog', 'lost and found tips', 'success stories Mafqoudat'],
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
      ]),
    ],
  },
};

Object.keys(pageSeoConfig).forEach((key) => {
  pageSeoConfig[key].keywords = Array.from(
    new Set([...(pageSeoConfig[key].keywords || []), ...sharedPageKeywords])
  );
});

export default pageSeoConfig;
