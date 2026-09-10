import {
  DashboardOutlined,
  FlagOutlined,
  ArticleOutlined,
  PeopleAltOutlined,
  CampaignOutlined,
  SupportAgentOutlined,
  InsightsOutlined,
  PublicOutlined,
  TuneOutlined,
} from '@mui/icons-material';

/**
 * The panel's nine destinations, in five groups.
 *
 * The old panel had eight tabs held in a `useState` index, ordered by the order
 * someone happened to add them: reports, promotions, password resets, users,
 * posts, contacts, cities, database - with the maintenance-mode control and the
 * visitor statistics both rendered above and below *every* one of them. Nothing
 * could be linked to, the browser's back button did nothing, and a reload
 * always landed on reports.
 *
 * These are routes. The grouping is by what an admin is doing, not by which
 * collection the data lives in:
 *
 *   Overview     what needs attention right now
 *   Operations   work that arrives and has to be cleared: reports, promotion
 *                requests, support messages and password resets
 *   Catalog      the things the site is made of: listings, accounts, places
 *   Insights     what happened
 *   System       the switches
 *
 * Password reset requests are folded into Support rather than standing alone:
 * both are a person asking a human for something, and neither queue is busy
 * enough to earn its own destination.
 *
 * `badge` reads the overview payload, so a queue's count is on its own nav item
 * and an admin can see there is work waiting without opening the page.
 */
export const ADMIN_NAV_GROUPS = [
  {
    id: 'main',
    items: [
      {
        id: 'overview',
        path: '',
        icon: DashboardOutlined,
        labelKey: 'adminNavOverview',
        descriptionKey: 'adminNavOverviewDescription',
      },
    ],
  },
  {
    id: 'operations',
    labelKey: 'adminGroupOperations',
    items: [
      {
        id: 'moderation',
        path: 'moderation',
        icon: FlagOutlined,
        labelKey: 'adminNavModeration',
        descriptionKey: 'adminNavModerationDescription',
        badge: (overview) => overview?.queues?.reports || 0,
        badgeTone: 'critical',
      },
      {
        id: 'promotions',
        path: 'promotions',
        icon: CampaignOutlined,
        labelKey: 'adminNavPromotions',
        descriptionKey: 'adminNavPromotionsDescription',
        badge: (overview) => overview?.queues?.promotions || 0,
        badgeTone: 'attention',
      },
      {
        id: 'support',
        path: 'support',
        icon: SupportAgentOutlined,
        labelKey: 'adminNavSupport',
        descriptionKey: 'adminNavSupportDescription',
        badge: (overview) =>
          (overview?.queues?.contacts || 0) + (overview?.queues?.resetRequests || 0),
        badgeTone: 'attention',
      },
    ],
  },
  {
    id: 'catalog',
    labelKey: 'adminGroupCatalog',
    items: [
      {
        id: 'posts',
        path: 'posts',
        icon: ArticleOutlined,
        labelKey: 'adminNavPosts',
        descriptionKey: 'adminNavPostsDescription',
      },
      {
        id: 'users',
        path: 'users',
        icon: PeopleAltOutlined,
        labelKey: 'adminNavUsers',
        descriptionKey: 'adminNavUsersDescription',
      },
      {
        id: 'places',
        path: 'places',
        icon: PublicOutlined,
        labelKey: 'adminNavPlaces',
        descriptionKey: 'adminNavPlacesDescription',
      },
    ],
  },
  {
    id: 'insights',
    labelKey: 'adminGroupInsights',
    items: [
      {
        id: 'analytics',
        path: 'analytics',
        icon: InsightsOutlined,
        labelKey: 'adminNavAnalytics',
        descriptionKey: 'adminNavAnalyticsDescription',
      },
    ],
  },
  {
    id: 'system',
    labelKey: 'adminGroupSystem',
    items: [
      {
        id: 'system',
        path: 'system',
        icon: TuneOutlined,
        labelKey: 'adminNavSystem',
        descriptionKey: 'adminNavSystemDescription',
      },
    ],
  },
];

export const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

export const ADMIN_BASE_PATH = '/dash/admin';

export const adminItemPath = (item) =>
  item.path ? `${ADMIN_BASE_PATH}/${item.path}` : ADMIN_BASE_PATH;
