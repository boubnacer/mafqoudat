import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArticleOutlined,
  PeopleAltOutlined,
  VisibilityOutlined,
  TaskAltOutlined,
  SearchOffOutlined,
  RefreshOutlined,
  BuildOutlined,
  ArrowForward,
  ArrowBack,
  CheckCircleOutline,
  ChatBubbleOutlineOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { useGetSystemSettingsQuery } from '../systemSettingsApiSlice';
import { useAdminOverview } from '../AdminLayout';
import { ADMIN_NAV_ITEMS, adminItemPath } from '../adminNav';
import {
  AdminCard,
  EmptyState,
  PageHeader,
  Section,
  StatTile,
  StatusPill,
  actionButtonSx,
  adminTone,
  containedButtonSx,
} from '../ui';
import { TrendChart, SplitBar, RankBars, Sparkline, chartPalette } from '../charts';
import { formatNumber, formatRelative, labelOf, postTitle } from '../adminFormat';

/**
 * What needs attention right now, then what happened.
 *
 * The page the panel never had. `/admin/dashboard` already sent recent reports,
 * recent promotions and recent password-reset requests; the client destructured
 * two of the three and rendered none of them, so the payload was dead on
 * arrival and the "dashboard" was a tab strip over a table.
 *
 * Order is deliberate: queues first (the only thing on the page that is asking
 * for an action), then the four numbers that describe the site, then the shape
 * of the last thirty days, then the newest listings and members - which is the
 * "see the new posts as they come in" this page exists for.
 */

const QueueCard = ({ item, count, t }) => {
  const Icon = item.icon;
  const navigate = useNavigate();
  const tone = count > 0 ? item.badgeTone || 'attention' : 'positive';

  return (
    <AdminCard
      interactive
      onClick={() => navigate(adminItemPath(item))}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(adminItemPath(item));
        }
      }}
      sx={{ height: '100%', display: 'flex', alignItems: 'center', gap: 1.5 }}
    >
      <Box
        sx={(theme) => {
          const resolved = adminTone(theme, tone);
          return {
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: resolved.bg,
            color: resolved.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          };
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={(theme) => ({
            fontFamily: theme.custom.font.display,
            fontWeight: 800,
            fontSize: '1.35rem',
            lineHeight: 1.1,
            color: count > 0 ? adminTone(theme, tone).main : theme.custom.color.ink,
          })}
        >
          {formatNumber(count)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {t(item.labelKey)}
        </Typography>
      </Box>
    </AdminCard>
  );
};

const RecentPostRow = ({ post, t, currentLanguage }) => {
  const theme = useTheme();
  const isLost = post.foundLost?.code === 'LOST';
  const tone = isLost ? theme.custom.status.lost : theme.custom.status.found;

  return (
    <Box
      component={RouterLink}
      to={`/dash/posts/${post._id}`}
      sx={(t2) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.25,
        textDecoration: 'none',
        borderBottom: `1px solid ${alpha(t2.custom.color.ink, 0.06)}`,
        '&:last-of-type': { borderBottom: 'none' },
        '&:hover .admin-recent-title': { color: t2.custom.color.brandPrimary },
      })}
    >
      <Box
        sx={(t2) => ({
          width: 42,
          height: 42,
          flexShrink: 0,
          borderRadius: `${t2.custom.radius.sm}px`,
          overflow: 'hidden',
          backgroundColor: tone.bg,
          color: tone.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        {post.cloudinaryUrl ? (
          <Box
            component="img"
            src={post.cloudinaryUrl}
            alt=""
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : isLost ? (
          <SearchOffOutlined sx={{ fontSize: 19 }} />
        ) : (
          <TaskAltOutlined sx={{ fontSize: 19 }} />
        )}
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          className="admin-recent-title"
          variant="body2"
          sx={(t2) => ({
            fontWeight: 600,
            color: t2.custom.color.ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s ease',
          })}
        >
          {postTitle(post, t('noDescription'))}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {[
            labelOf(post.city, currentLanguage),
            labelOf(post.category, currentLanguage),
            post.user?.username,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
      </Box>

      <Box sx={{ flexShrink: 0, textAlign: 'end' }}>
        <StatusPill
          size="sm"
          label={isLost ? t('lost') : t('found')}
          tone={isLost ? 'critical' : 'positive'}
          icon={isLost ? SearchOffOutlined : TaskAltOutlined}
        />
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.35 }}>
          {formatRelative(post.createdAt, currentLanguage, t)}
        </Typography>
      </Box>
    </Box>
  );
};

const OverviewPage = () => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { overview, overviewLoading, overviewError, refetchOverview } = useAdminOverview();
  const { data: settingsData } = useGetSystemSettingsQuery();
  const maintenance = settingsData?.data?.maintenanceMode;
  const palette = chartPalette(theme);
  const isRtl = theme.direction === 'rtl';
  const ForwardIcon = isRtl ? ArrowBack : ArrowForward;

  const queues = overview?.queues || {};
  const totals = overview?.totals || {};
  const growth = overview?.growth || {};
  const content = overview?.content || {};
  const series = overview?.series || [];

  const queueItems = ADMIN_NAV_ITEMS.filter((item) => item.badge);
  const queueTotal = queueItems.reduce((sum, item) => sum + (item.badge(overview) || 0), 0);

  const postSeries = [
    { key: 'found', label: t('found'), color: palette.found },
    { key: 'lost', label: t('lost'), color: palette.lost },
  ];

  if (overviewError) {
    return (
      <>
        <PageHeader title={t('adminNavOverview')} description={t('adminNavOverviewDescription')} />
        <AdminCard>
          <EmptyState
            icon={BuildOutlined}
            title={t('errorLoadingDashboard')}
            description={overviewError?.data?.message || overviewError?.message}
            action={
              <Button
                variant="contained"
                disableElevation
                onClick={refetchOverview}
                startIcon={<RefreshOutlined />}
                sx={containedButtonSx('brand')}
              >
                {t('refresh')}
              </Button>
            }
          />
        </AdminCard>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('adminNavOverview')}
        description={t('adminNavOverviewDescription')}
        actions={
          <Tooltip title={t('refresh')}>
            <IconButton
              onClick={refetchOverview}
              sx={(t2) => ({
                backgroundColor: t2.custom.color.surfaceRaised,
                boxShadow: t2.custom.elevation.e1,
                '&:hover': { boxShadow: t2.custom.elevation.e2 },
              })}
              aria-label={t('refresh')}
            >
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      />

      {/* Maintenance is site-wide and invisible from anywhere else in the
          panel; if it is on, that is the first thing an admin should read. */}
      {maintenance?.isActive ? (
        <AdminCard
          accent={theme.custom.status.pending.main}
          sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}
        >
          <BuildOutlined
            sx={(t2) => ({ color: t2.custom.status.pending.main, fontSize: 22 })}
          />
          <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
            <Typography
              variant="body2"
              sx={(t2) => ({ fontWeight: 700, color: t2.custom.color.ink })}
            >
              {t('maintenanceActiveTitle')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('maintenanceActiveBody')}
            </Typography>
          </Box>
          <Button
            onClick={() => navigate('/dash/admin/system')}
            endIcon={<ForwardIcon />}
            sx={actionButtonSx('attention')}
          >
            {t('adminNavSystem')}
          </Button>
        </AdminCard>
      ) : null}

      {/* ------------------------------------------------------------ queues */}
      <Section
        title={t('needsAttention')}
        description={queueTotal ? t('needsAttentionBody') : undefined}
      >
        {overviewLoading ? (
          <Grid container spacing={2}>
            {[0, 1, 2].map((key) => (
              <Grid item xs={12} sm={4} key={key}>
                <Skeleton variant="rounded" height={86} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : queueTotal === 0 ? (
          <AdminCard padding={false}>
            <EmptyState
              tone="positive"
              icon={CheckCircleOutline}
              title={t('queuesClearTitle')}
              description={t('queuesClearBody')}
            />
          </AdminCard>
        ) : (
          <Grid container spacing={2}>
            {queueItems.map((item) => (
              <Grid item xs={12} sm={4} key={item.id}>
                <QueueCard item={item} count={item.badge(overview) || 0} t={t} />
              </Grid>
            ))}
          </Grid>
        )}
      </Section>

      {/* -------------------------------------------------------------- KPIs */}
      <Section title={t('atAGlance')}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <StatTile
              label={t('adminNavPosts')}
              value={totals.posts}
              icon={ArticleOutlined}
              tone="brand"
              delta={growth.posts?.change7}
              deltaLabel={t('vsPrevious7Days')}
              trend={
                series.length ? (
                  <Sparkline
                    values={series.map((row) => (row.lost || 0) + (row.found || 0))}
                    color={palette.brand}
                  />
                ) : null
              }
              onClick={() => navigate('/dash/admin/posts')}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatTile
              label={t('adminNavUsers')}
              value={totals.users}
              icon={PeopleAltOutlined}
              tone="positive"
              delta={growth.users?.change7}
              deltaLabel={t('vsPrevious7Days')}
              trend={
                series.length ? (
                  <Sparkline values={series.map((row) => row.users || 0)} color={palette.found} />
                ) : null
              }
              onClick={() => navigate('/dash/admin/users')}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatTile
              label={t('visitorsToday')}
              value={growth.visitors?.today}
              icon={VisibilityOutlined}
              tone="brand"
              hint={t('sessionsAllTime', { count: formatNumber(totals.visitors) })}
              onClick={() => navigate('/dash/admin/analytics')}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatTile
              label={t('itemsReturned')}
              value={content.returned}
              icon={TaskAltOutlined}
              tone="positive"
              hint={
                totals.posts
                  ? t('shareOfAllListings', {
                      value: Math.round(((content.returned || 0) / totals.posts) * 100),
                    })
                  : undefined
              }
            />
          </Grid>
        </Grid>
      </Section>

      {/* ------------------------------------------------------------ trends */}
      <Section title={t('last30Days')}>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={7}>
            <AdminCard sx={{ height: '100%' }}>
              <Typography
                sx={(t2) => ({
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: t2.custom.color.ink,
                  mb: 0.25,
                })}
              >
                {t('newListingsPerDay')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                {t('newListingsPerDayHint')}
              </Typography>
              {overviewLoading ? (
                <Skeleton variant="rounded" height={210} />
              ) : (
                <TrendChart
                  data={series}
                  series={postSeries}
                  variant="stack"
                  emptyLabel={t('noDataYet')}
                />
              )}
            </AdminCard>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              <AdminCard>
                <Typography
                  sx={(t2) => ({
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: t2.custom.color.ink,
                    mb: 1.5,
                  })}
                >
                  {t('lostVsFound')}
                </Typography>
                {overviewLoading ? (
                  <Skeleton variant="rounded" height={54} />
                ) : (
                  <SplitBar
                    segments={[
                      {
                        key: 'found',
                        label: t('found'),
                        value: content.byType?.found || 0,
                        color: palette.found,
                      },
                      {
                        key: 'lost',
                        label: t('lost'),
                        value: content.byType?.lost || 0,
                        color: palette.lost,
                      },
                    ]}
                  />
                )}
              </AdminCard>

              <AdminCard sx={{ flex: 1 }}>
                <Typography
                  sx={(t2) => ({
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: t2.custom.color.ink,
                    mb: 1.5,
                  })}
                >
                  {t('listingStatusBreakdown')}
                </Typography>
                {overviewLoading ? (
                  <Skeleton variant="rounded" height={54} />
                ) : (
                  <SplitBar
                    segments={[
                      {
                        key: 'active',
                        label: t('active'),
                        value: content.byStatus?.active || 0,
                        color: palette.found,
                      },
                      {
                        key: 'resolved',
                        label: t('resolved'),
                        value: content.byStatus?.resolved || 0,
                        color: palette.brand,
                      },
                      {
                        key: 'expired',
                        label: t('expired'),
                        value: content.byStatus?.expired || 0,
                        color: palette.muted,
                      },
                      {
                        key: 'suspended',
                        label: t('suspended'),
                        value: content.byStatus?.suspended || 0,
                        color: palette.lost,
                      },
                    ]}
                  />
                )}
              </AdminCard>
            </Box>
          </Grid>
        </Grid>
      </Section>

      {/* ------------------------------------------------------- new arrivals */}
      <Section
        title={t('latestListings')}
        actions={
          <Button
            component={RouterLink}
            to="/dash/admin/posts"
            endIcon={<ForwardIcon />}
            sx={actionButtonSx('brand')}
          >
            {t('viewAll')}
          </Button>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12} lg={7}>
            <AdminCard sx={{ height: '100%' }}>
              {overviewLoading ? (
                [0, 1, 2, 3].map((key) => (
                  <Skeleton key={key} variant="rounded" height={52} sx={{ mb: 1 }} />
                ))
              ) : overview?.recent?.posts?.length ? (
                overview.recent.posts.map((post) => (
                  <RecentPostRow
                    key={post._id}
                    post={post}
                    t={t}
                    currentLanguage={currentLanguage}
                  />
                ))
              ) : (
                <EmptyState icon={ArticleOutlined} title={t('noPostsFound')} />
              )}
            </AdminCard>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              <AdminCard>
                <Typography
                  sx={(t2) => ({
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: t2.custom.color.ink,
                    mb: 1.5,
                  })}
                >
                  {t('newestMembers')}
                </Typography>
                {overviewLoading ? (
                  <Skeleton variant="rounded" height={120} />
                ) : overview?.recent?.users?.length ? (
                  overview.recent.users.slice(0, 5).map((user) => (
                    <Box
                      key={user._id}
                      sx={(t2) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        py: 0.9,
                        borderBottom: `1px solid ${alpha(t2.custom.color.ink, 0.06)}`,
                        '&:last-of-type': { borderBottom: 'none' },
                      })}
                    >
                      <Box
                        sx={(t2) => ({
                          width: 30,
                          height: 30,
                          flexShrink: 0,
                          borderRadius: '50%',
                          backgroundColor: alpha(t2.custom.color.brandPrimary, 0.12),
                          color: t2.custom.color.brandPrimary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                        })}
                      >
                        {(user.username || '?').charAt(0).toUpperCase()}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={(t2) => ({
                            fontWeight: 600,
                            color: t2.custom.color.ink,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          })}
                        >
                          {user.username}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {labelOf(user.country, currentLanguage, t('unknown'))}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0 }}>
                        {formatRelative(user.createdAt, currentLanguage, t)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('noDataYet')}
                  </Typography>
                )}
              </AdminCard>

              <AdminCard sx={{ flex: 1 }}>
                <Typography
                  sx={(t2) => ({
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: t2.custom.color.ink,
                    mb: 1.5,
                  })}
                >
                  {t('topCategories')}
                </Typography>
                {overviewLoading ? (
                  <Skeleton variant="rounded" height={120} />
                ) : (
                  <RankBars
                    items={(overview?.top?.categories || []).map((row) => ({
                      id: row.id,
                      label: row.labels?.[currentLanguage] || row.labels?.en || row.code,
                      count: row.count,
                    }))}
                    color={palette.brand}
                    emptyLabel={t('noDataYet')}
                  />
                )}
              </AdminCard>
            </Box>
          </Grid>
        </Grid>
      </Section>

      {/* ------------------------------------------------------------- extras */}
      <Section title={t('community')}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <AdminCard sx={{ height: '100%' }}>
              <Typography
                sx={(t2) => ({
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: t2.custom.color.ink,
                  mb: 1.5,
                })}
              >
                {t('topCities')}
              </Typography>
              {overviewLoading ? (
                <Skeleton variant="rounded" height={140} />
              ) : (
                <RankBars
                  items={(overview?.top?.cities || []).map((row) => ({
                    id: row.id,
                    label: row.labels?.[currentLanguage] || row.labels?.en || row.code,
                    count: row.count,
                  }))}
                  color={palette.found}
                  emptyLabel={t('noDataYet')}
                />
              )}
            </AdminCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <StatTile
                  label={t('siteComments')}
                  value={totals.comments}
                  icon={ChatBubbleOutlineOutlined}
                  tone="brand"
                  onClick={() => navigate('/dash/admin/moderation?view=comments')}
                />
              </Grid>
              <Grid item xs={6}>
                <StatTile
                  label={t('listingsWithPhoto')}
                  value={content.withPhoto}
                  icon={ArticleOutlined}
                  tone="neutral"
                  hint={
                    totals.posts
                      ? t('shareOfAllListings', {
                          value: Math.round(((content.withPhoto || 0) / totals.posts) * 100),
                        })
                      : undefined
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <AdminCard>
                  <Typography
                    sx={(t2) => ({
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: t2.custom.color.ink,
                      mb: 1.5,
                    })}
                  >
                    {t('signupsPerDay')}
                  </Typography>
                  {overviewLoading ? (
                    <Skeleton variant="rounded" height={140} />
                  ) : (
                    <TrendChart
                      data={series}
                      series={[{ key: 'users', label: t('adminNavUsers'), color: palette.brand }]}
                      variant="area"
                      height={150}
                      emptyLabel={t('noDataYet')}
                    />
                  )}
                </AdminCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Section>

      {overview?.generatedAt ? (
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
          {t('lastUpdatedAt', {
            time: formatRelative(overview.generatedAt, currentLanguage, t),
          })}
        </Typography>
      ) : null}
    </>
  );
};

export default OverviewPage;
