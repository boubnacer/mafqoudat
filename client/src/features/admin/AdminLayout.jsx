import React, { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import { AdminPanelSettingsOutlined } from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import { useGetAdminOverviewQuery } from './adminApiSlice';
import { ADMIN_NAV_GROUPS, adminItemPath } from './adminNav';
import { AdminToastProvider, adminTone } from './ui';

/**
 * The panel's shell: the brand line, the navigation, and an outlet.
 *
 * Two shapes, chosen by width rather than by a hamburger:
 *
 *   lg and up   a sticky rail on the inline-start, grouped, with each queue's
 *               count on its own item
 *   below lg    the same items as a horizontally scrolling pill row under the
 *               header, with the active pill scrolled into view on arrival
 *
 * A drawer was the other option for narrow screens and was not taken: nine
 * destinations that an admin switches between constantly should cost one tap,
 * not two, and a scroller shows the counts without being opened.
 *
 * The overview query lives here rather than on the Overview page, because the
 * badge counts belong to the navigation - and it is the ONE request the panel
 * makes on arrival. Every list is fetched by its own page. The old panel fired
 * fourteen on mount and kept them all subscribed while seven eighths of them
 * were behind a hidden tab.
 */

const NavBadge = ({ count, tone }) => {
  if (!count) return null;
  return (
    <Box
      component="span"
      sx={(theme) => {
        const resolved = adminTone(theme, tone || 'attention');
        return {
          marginInlineStart: 'auto',
          minWidth: 20,
          px: 0.6,
          borderRadius: `${theme.custom.radius.sm}px`,
          backgroundColor: resolved.bg,
          color: resolved.main,
          fontSize: '0.68rem',
          fontWeight: 800,
          lineHeight: '18px',
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        };
      }}
    >
      {count > 99 ? '99+' : count}
    </Box>
  );
};

const RailLink = ({ item, overview, t }) => {
  const Icon = item.icon;
  const count = item.badge ? item.badge(overview) : 0;

  return (
    <NavLink
      to={adminItemPath(item)}
      end={!item.path}
      style={{ textDecoration: 'none' }}
      // The rail's own active styling; NavLink's className callback is what
      // keeps it in step with the router rather than with a state variable.
      className={({ isActive }) => (isActive ? 'admin-rail-active' : '')}
    >
      {({ isActive }) => (
        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.5,
            py: 1.1,
            borderRadius: `${theme.custom.radius.md}px`,
            color: isActive ? theme.custom.color.brandPrimary : theme.palette.text.secondary,
            backgroundColor: isActive
              ? alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.16 : 0.08)
              : 'transparent',
            transition: 'background-color 0.18s ease, color 0.18s ease',
            '&:hover': {
              backgroundColor: isActive
                ? alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                : alpha(theme.custom.color.ink, 0.04),
              color: isActive ? theme.custom.color.brandPrimary : theme.custom.color.ink,
            },
          })}
        >
          <Icon sx={{ fontSize: 20, flexShrink: 0 }} />
          <Typography
            sx={{ fontWeight: isActive ? 700 : 600, fontSize: '0.9rem', minWidth: 0 }}
          >
            {t(item.labelKey)}
          </Typography>
          <NavBadge count={count} tone={item.badgeTone} />
        </Box>
      )}
    </NavLink>
  );
};

const PillLink = ({ item, overview, t }) => {
  const Icon = item.icon;
  const count = item.badge ? item.badge(overview) : 0;

  return (
    <NavLink to={adminItemPath(item)} end={!item.path} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <Box
          data-admin-pill-active={isActive ? 'true' : undefined}
          sx={(theme) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.9,
            flexShrink: 0,
            scrollSnapAlign: 'center',
            borderRadius: `${theme.custom.radius.md}px`,
            backgroundColor: isActive
              ? theme.custom.color.brandPrimary
              : theme.custom.color.surfaceRaised,
            color: isActive
              ? theme.palette.getContrastText(theme.custom.color.brandPrimary)
              : theme.palette.text.secondary,
            boxShadow: isActive ? theme.custom.elevation.e2 : theme.custom.elevation.e1,
            whiteSpace: 'nowrap',
          })}
        >
          <Icon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
            {t(item.labelKey)}
          </Typography>
          {count ? (
            <Box
              component="span"
              sx={(theme) => ({
                minWidth: 18,
                px: 0.5,
                borderRadius: `${theme.custom.radius.sm}px`,
                fontSize: '0.66rem',
                fontWeight: 800,
                lineHeight: '17px',
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
                backgroundColor: isActive
                  ? alpha(theme.palette.getContrastText(theme.custom.color.brandPrimary), 0.24)
                  : adminTone(theme, item.badgeTone || 'attention').bg,
                color: isActive
                  ? theme.palette.getContrastText(theme.custom.color.brandPrimary)
                  : adminTone(theme, item.badgeTone || 'attention').main,
              })}
            >
              {count > 99 ? '99+' : count}
            </Box>
          ) : null}
        </Box>
      )}
    </NavLink>
  );
};

const AdminLayout = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const location = useLocation();
  const pillRowRef = useRef(null);

  const { data, isLoading, error, refetch } = useGetAdminOverviewQuery(undefined, {
    // The queue counts are the reason an admin has the panel open; a poll keeps
    // them honest without anyone reloading. Long enough not to be a cost on a
    // free-tier cluster, short enough that a new report shows up while you are
    // still looking at the screen.
    pollingInterval: 120000,
    refetchOnMountOrArgChange: true,
  });
  const overview = data?.data;

  // The active pill can start off-screen in the scroller - scroll it into view
  // on arrival so an admin can always see where they are.
  useEffect(() => {
    if (isWide) return;
    const row = pillRowRef.current;
    const active = row?.querySelector('[data-admin-pill-active="true"]');
    if (active && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }, [location.pathname, isWide]);

  const context = { overview, overviewLoading: isLoading, overviewError: error, refetchOverview: refetch };

  return (
    <AdminToastProvider>
      <Box
        sx={(t2) => ({
          backgroundColor: t2.custom.color.surfaceBase,
          minHeight: '100%',
          pb: { xs: 4, sm: 6 },
        })}
      >
        {/* The dashboard navbar is `position: fixed` and DashLayout adds no
            spacer, so every /dash page clears it itself. 5.5rem is what the
            dashboard home uses; without it the panel's first 88px sat behind
            the navbar. */}
        <Container maxWidth="xl" sx={{ pt: { xs: '5.5rem', sm: '5.5rem' } }}>
          {/* Brand line. Says which product this is a panel FOR, which the old
              one never did - it opened straight onto a table of reports. */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: { xs: 2, sm: 2.5 } }}>
            <Box
              sx={(t2) => ({
                width: 34,
                height: 34,
                borderRadius: `${t2.custom.radius.sm}px`,
                backgroundColor: alpha(t2.custom.color.brandPrimary, 0.12),
                color: t2.custom.color.brandPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              })}
            >
              <AdminPanelSettingsOutlined sx={{ fontSize: 20 }} />
            </Box>
            <Typography
              sx={(t2) => ({
                fontFamily: t2.custom.font.display,
                fontWeight: 800,
                fontSize: '1.05rem',
                color: t2.custom.color.ink,
                letterSpacing: 0.2,
              })}
            >
              {t('adminConsole')}
            </Typography>
          </Box>

          {!isWide ? (
            <Box
              ref={pillRowRef}
              component="nav"
              aria-label={t('adminConsole')}
              sx={{
                display: 'flex',
                gap: 1,
                overflowX: 'auto',
                scrollSnapType: 'x proximity',
                pb: 1.5,
                mb: 2,
                // The row is allowed to bleed to the container's edge so the
                // last pill does not look cut off by padding.
                mx: { xs: -2, sm: -3 },
                px: { xs: 2, sm: 3 },
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
              }}
            >
              {ADMIN_NAV_GROUPS.flatMap((group) => group.items).map((item) => (
                <PillLink key={item.id} item={item} overview={overview} t={t} />
              ))}
            </Box>
          ) : null}

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            {isWide ? (
              <Box
                component="nav"
                aria-label={t('adminConsole')}
                sx={(t2) => ({
                  width: 244,
                  flexShrink: 0,
                  position: 'sticky',
                  // Clears the fixed navbar, which is the only other piece of
                  // fixed chrome on /dash.
                  top: 88,
                  p: 1,
                  borderRadius: `${t2.custom.radius.xl}px`,
                  backgroundColor: t2.custom.color.surfaceRaised,
                  boxShadow: t2.custom.elevation.e1,
                })}
              >
                {ADMIN_NAV_GROUPS.map((group) => (
                  <Box key={group.id} sx={{ mb: 1 }}>
                    {group.labelKey ? (
                      <Typography
                        variant="overline"
                        sx={{
                          display: 'block',
                          px: 1.5,
                          pt: 1.25,
                          pb: 0.5,
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          letterSpacing: 1,
                          color: 'text.disabled',
                        }}
                      >
                        {t(group.labelKey)}
                      </Typography>
                    ) : null}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      {group.items.map((item) => (
                        <RailLink key={item.id} item={item} overview={overview} t={t} />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : null}

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Outlet context={context} />
            </Box>
          </Box>
        </Container>
      </Box>
    </AdminToastProvider>
  );
};

/** Every admin page reads the shared overview from here rather than re-fetching it. */
export const useAdminOverview = () => useOutletContext();

export default AdminLayout;
