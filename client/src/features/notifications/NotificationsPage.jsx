import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  Pagination,
  Skeleton,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
import {
  DoneAllOutlined,
  ExpandMoreOutlined,
  NotificationsOffOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import useTitle from "../../hooks/useTitle";
import NotificationGroup from "./NotificationGroup";
import NotificationPreferences from "./NotificationPreferences";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDismissNotificationMutation,
} from "./notificationsApiSlice";

const PAGE_SIZE = 10;

/**
 * The full match-alert inbox at /dash/notifications.
 *
 * Uses the established paired-panel shell (blurred-gradient surfaceRaised,
 * radius.lg/xl, centered ink title) rather than inventing a new container, and
 * keeps the settings inline in a collapsed accordion so preferences live next
 * to the thing they control instead of on a separate page.
 */
const NotificationsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  useTitle(`${t('notifications')} | Mafqoudat`);

  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError } = useGetNotificationsQuery({
    page,
    pageSize: PAGE_SIZE,
    filter: tab,
    language: currentLanguage,
  });

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();
  const [dismissNotification, { isLoading: isDismissing }] = useDismissNotificationMutation();

  const groups = data?.groups || [];
  const unreadCount = data?.unreadCount || 0;
  const totalPages = data?.totalPages || 1;

  const handleTabChange = useCallback((event, value) => {
    setTab(value);
    // A filter change re-slices the whole list, so page 1 is the only page
    // guaranteed to exist afterwards.
    setPage(1);
  }, []);

  const handleOpenMatch = useCallback(async (match) => {
    if (!match.isRead) {
      try {
        await markRead(match.notificationId).unwrap();
      } catch (error) {
        /* opening the listing matters more than recording the read receipt */
      }
    }
    navigate(`/dash/posts/${match.matchedPost.id}`);
  }, [markRead, navigate]);

  const handleDismissMatch = useCallback(async (match) => {
    try {
      await dismissNotification(match.notificationId).unwrap();
    } catch (error) {
      /* the list refetches from the invalidated tag regardless */
    }
  }, [dismissNotification]);

  return (
    <Box
      sx={{
        padding: { xs: 2, md: 4 },
        maxWidth: 900,
        marginInline: "auto",
        width: "100%",
      }}
    >
      {/* Paired dashboard panel shell — see CLAUDE.md "Established component
          patterns"; reused here rather than restyled. */}
      <Box
        sx={{
          background: `linear-gradient(145deg, ${alpha(theme.custom.color.surfaceRaised, 0.96)}, ${alpha(theme.custom.color.surfaceRaised, 0.86)})`,
          backdropFilter: "blur(18px)",
          borderRadius: `${isDesktop ? theme.custom.radius.xl : theme.custom.radius.lg}px`,
          boxShadow: theme.custom.elevation.e2,
          padding: { xs: 2, md: 3 },
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            textAlign: "center",
            color: theme.custom.color.ink,
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          }}
        >
          {t('notifications')}
        </Typography>
        <Typography
          sx={{
            textAlign: "center",
            color: "text.secondary",
            fontSize: { xs: "0.85rem", md: "0.95rem" },
            mt: 0.5,
            mb: 2,
          }}
        >
          {t('notifPageSubtitle')}
        </Typography>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            backgroundColor: alpha(theme.custom.color.ink, 0.03),
            borderRadius: `${theme.custom.radius.md}px`,
            mb: 2,
            "&::before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SettingsOutlined sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />
              <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: theme.custom.color.ink }}>
                {t('notifSettingsTitle')}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ paddingTop: 0 }}>
            <NotificationPreferences />
          </AccordionDetails>
        </Accordion>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Tabs
            value={tab}
            onChange={handleTabChange}
            sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 700 } }}
          >
            <Tab value="all" label={t('notifTabAll')} />
            <Tab
              value="unread"
              label={(
                // No position override on the badge: MUI v5 already mirrors its
                // anchor for RTL, and forcing an inset here would fight that.
                // Room is made with padding on the label instead.
                <Badge
                  badgeContent={unreadCount}
                  max={99}
                  color="error"
                  sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem" } }}
                >
                  <Box component="span" sx={{ paddingInlineEnd: unreadCount > 0 ? 1.5 : 0 }}>
                    {t('notifTabUnread')}
                  </Box>
                </Badge>
              )}
            />
          </Tabs>

          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllOutlined sx={{ fontSize: 18 }} />}
              disabled={isMarkingAll}
              onClick={() => markAllRead()}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                color: theme.custom.color.brandPrimary,
                "& .MuiButton-startIcon": { marginInlineEnd: "6px", marginInlineStart: 0 },
              }}
            >
              {t('notifMarkAllRead')}
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {isError && (
          <Alert severity="error" sx={{ borderRadius: `${theme.custom.radius.md}px` }}>
            {t('notifLoadError')}
          </Alert>
        )}

        {isLoading && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} variant="rounded" height={128} />
            ))}
          </Box>
        )}

        {!isLoading && !isError && groups.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6, paddingInline: 2 }}>
            <NotificationsOffOutlined sx={{ fontSize: 44, color: theme.palette.text.disabled, mb: 1 }} />
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: theme.custom.color.ink }}>
              {tab === 'unread' ? t('notifEmptyUnreadTitle') : t('notifEmptyTitle')}
            </Typography>
            <Typography sx={{ fontSize: "0.88rem", color: "text.secondary", mt: 0.5, maxWidth: 420, marginInline: "auto" }}>
              {tab === 'unread' ? t('notifEmptyUnreadDescription') : t('notifEmptyDescription')}
            </Typography>
          </Box>
        )}

        {!isLoading && groups.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, opacity: isFetching ? 0.6 : 1, transition: "opacity 0.2s ease" }}>
            {groups.map((group) => (
              <NotificationGroup
                key={group.id}
                group={group}
                onOpenMatch={handleOpenMatch}
                onDismissMatch={handleDismissMatch}
                isDismissing={isDismissing}
              />
            ))}
          </Box>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2.5 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default NotificationsPage;
