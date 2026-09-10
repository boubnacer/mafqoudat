import React, { useState } from 'react';
import { Box, Grid, Skeleton, Typography, useTheme } from '@mui/material';
import {
  VisibilityOutlined,
  ArticleOutlined,
  PeopleAltOutlined,
  TaskAltOutlined,
  PublicOutlined,
  LocationCityOutlined,
  LinkOutlined,
  InsightsOutlined,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from '../../../utils/translations';
import { useGetAdminAnalyticsQuery } from '../adminApiSlice';
import {
  AdminCard,
  EmptyState,
  PageHeader,
  Section,
  SegmentedControl,
  StatTile,
  StatusPill,
} from '../ui';
import { TrendChart, RankBars, chartPalette } from '../charts';
import { formatNumber, truncate } from '../adminFormat';

/**
 * What happened, over a window the admin picks.
 *
 * The old panel's analytics was three numbers - total, today, "this month" -
 * sitting under every tab, and the third was wrong: its date range ran from the
 * very first visit ever recorded to the end of the selected month, so a figure
 * labelled as one month was in fact a running total up to that month, and it
 * only ever went up.
 *
 * This asks for one honest window (7 / 30 / 90 days), compares it against the
 * window immediately before it, and plots the days inside it. It also finally
 * renders what the Visitor collection has always stored and nothing ever read:
 * where visitors are, and which page they arrived on.
 *
 * Visitors and listings are never plotted on one pair of axes. They are
 * different units on wildly different scales, and a shared y axis would invent
 * a relationship between them.
 */
const AnalyticsPage = () => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const palette = chartPalette(theme);
  const [days, setDays] = useState(30);

  const { data, isFetching, error } = useGetAdminAnalyticsQuery({ days });
  const analytics = data?.data;
  const series = analytics?.series || [];

  const rangeLabel = t('vsPreviousPeriod', { days });

  if (error) {
    return (
      <>
        <PageHeader
          eyebrow={t('adminGroupInsights')}
          title={t('adminNavAnalytics')}
          description={t('adminNavAnalyticsDescription')}
        />
        <AdminCard>
          <EmptyState
            icon={InsightsOutlined}
            title={t('genericLoadError')}
            description={error?.data?.message || error?.message}
          />
        </AdminCard>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t('adminGroupInsights')}
        title={t('adminNavAnalytics')}
        description={t('adminNavAnalyticsDescription')}
        actions={
          <SegmentedControl
            size="sm"
            ariaLabel={t('dateRange')}
            value={days}
            onChange={setDays}
            options={[
              { value: 7, label: t('rangeDays', { days: 7 }) },
              { value: 30, label: t('rangeDays', { days: 30 }) },
              { value: 90, label: t('rangeDays', { days: 90 }) },
            ]}
          />
        }
      />

      <Section title={t('inThisPeriod')}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <StatTile
              label={t('visitors')}
              value={analytics?.visitors?.window}
              icon={VisibilityOutlined}
              tone="brand"
              delta={analytics?.visitors?.change}
              deltaLabel={rangeLabel}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatTile
              label={t('newListings')}
              value={analytics?.posts?.window}
              icon={ArticleOutlined}
              tone="positive"
              delta={analytics?.posts?.change}
              deltaLabel={rangeLabel}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatTile
              label={t('newMembers')}
              value={analytics?.users?.window}
              icon={PeopleAltOutlined}
              tone="brand"
              delta={analytics?.users?.change}
              deltaLabel={rangeLabel}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatTile
              label={t('listingViewsTotal')}
              value={analytics?.posts?.totalViews}
              icon={VisibilityOutlined}
              tone="neutral"
              hint={t('allTime')}
            />
          </Grid>
        </Grid>
      </Section>

      <Section title={t('overTime')}>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={6}>
            <AdminCard sx={{ height: '100%' }}>
              <Typography
                sx={(t2) => ({
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: t2.custom.color.ink,
                  mb: 1.5,
                })}
              >
                {t('visitorsPerDay')}
              </Typography>
              {isFetching ? (
                <Skeleton variant="rounded" height={200} />
              ) : (
                <TrendChart
                  data={series}
                  series={[{ key: 'visitors', label: t('visitors'), color: palette.brand }]}
                  variant="area"
                  emptyLabel={t('noDataYet')}
                />
              )}
            </AdminCard>
          </Grid>

          <Grid item xs={12} lg={6}>
            <AdminCard sx={{ height: '100%' }}>
              <Typography
                sx={(t2) => ({
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: t2.custom.color.ink,
                  mb: 1.5,
                })}
              >
                {t('newListingsPerDay')}
              </Typography>
              {isFetching ? (
                <Skeleton variant="rounded" height={200} />
              ) : (
                <TrendChart
                  data={series}
                  series={[
                    { key: 'found', label: t('found'), color: palette.found },
                    { key: 'lost', label: t('lost'), color: palette.lost },
                  ]}
                  variant="stack"
                  emptyLabel={t('noDataYet')}
                />
              )}
            </AdminCard>
          </Grid>

          <Grid item xs={12} lg={6}>
            <AdminCard>
              <Typography
                sx={(t2) => ({
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: t2.custom.color.ink,
                  mb: 0.25,
                })}
              >
                {t('itemsReturnedPerDay')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                {t('itemsReturnedPerDayHint')}
              </Typography>
              {isFetching ? (
                <Skeleton variant="rounded" height={160} />
              ) : (
                <TrendChart
                  data={series}
                  series={[{ key: 'resolved', label: t('itemsReturned'), color: palette.found }]}
                  variant="area"
                  height={170}
                  emptyLabel={t('noDataYet')}
                />
              )}
            </AdminCard>
          </Grid>

          <Grid item xs={12} lg={6}>
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
              {isFetching ? (
                <Skeleton variant="rounded" height={160} />
              ) : (
                <TrendChart
                  data={series}
                  series={[{ key: 'users', label: t('newMembers'), color: palette.brand }]}
                  variant="area"
                  height={170}
                  emptyLabel={t('noDataYet')}
                />
              )}
            </AdminCard>
          </Grid>
        </Grid>
      </Section>

      <Section title={t('whereVisitorsCameFrom')} description={t('visitorGeographyHint')}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <AdminCard sx={{ height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <PublicOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography
                  sx={(t2) => ({ fontWeight: 700, fontSize: '0.92rem', color: t2.custom.color.ink })}
                >
                  {t('countries')}
                </Typography>
              </Box>
              {isFetching ? (
                <Skeleton variant="rounded" height={160} />
              ) : (
                <RankBars
                  items={(analytics?.geography?.countries || []).map((row) => ({
                    id: row.label,
                    label: row.label,
                    count: row.count,
                  }))}
                  color={palette.brand}
                  emptyLabel={t('noDataYet')}
                />
              )}
            </AdminCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <AdminCard sx={{ height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <LocationCityOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography
                  sx={(t2) => ({ fontWeight: 700, fontSize: '0.92rem', color: t2.custom.color.ink })}
                >
                  {t('cities')}
                </Typography>
              </Box>
              {isFetching ? (
                <Skeleton variant="rounded" height={160} />
              ) : (
                <RankBars
                  items={(analytics?.geography?.cities || []).map((row) => ({
                    id: row.label,
                    label: row.label,
                    count: row.count,
                  }))}
                  color={palette.found}
                  emptyLabel={t('noDataYet')}
                />
              )}
            </AdminCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <AdminCard sx={{ height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <LinkOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography
                  sx={(t2) => ({ fontWeight: 700, fontSize: '0.92rem', color: t2.custom.color.ink })}
                >
                  {t('landingPages')}
                </Typography>
              </Box>
              {isFetching ? (
                <Skeleton variant="rounded" height={160} />
              ) : (
                <RankBars
                  items={(analytics?.landings || []).map((row) => ({
                    id: row.label,
                    label: truncate(row.label, 34),
                    count: row.count,
                  }))}
                  color={palette.attention}
                  emptyLabel={t('noDataYet')}
                />
              )}
            </AdminCard>
          </Grid>
        </Grid>
      </Section>

      <Section title={t('mostViewedListings')}>
        <AdminCard>
          {isFetching ? (
            <Skeleton variant="rounded" height={180} />
          ) : analytics?.mostViewed?.length ? (
            analytics.mostViewed.map((post) => (
              <Box
                key={post.id}
                component={RouterLink}
                to={`/dash/posts/${post.id}`}
                sx={(t2) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.15,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${t2.palette.divider}`,
                  '&:last-of-type': { borderBottom: 'none' },
                })}
              >
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
                    {post.description || t('noDescription')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {post.city?.[currentLanguage] || post.city?.en || ''}
                  </Typography>
                </Box>
                <StatusPill
                  size="sm"
                  tone={post.type === 'LOST' ? 'critical' : 'positive'}
                  label={post.type === 'LOST' ? t('lost') : t('found')}
                  icon={post.type === 'LOST' ? undefined : TaskAltOutlined}
                />
                <Typography
                  variant="body2"
                  sx={(t2) => ({
                    fontWeight: 700,
                    color: t2.custom.color.ink,
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                    minWidth: 52,
                    textAlign: 'end',
                  })}
                >
                  {formatNumber(post.views, currentLanguage)}
                </Typography>
              </Box>
            ))
          ) : (
            <EmptyState icon={VisibilityOutlined} title={t('noDataYet')} />
          )}
        </AdminCard>
      </Section>
    </>
  );
};

export default AnalyticsPage;
