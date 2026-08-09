import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  Tooltip,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import {
  NotificationsNoneOutlined,
  NotificationsActiveOutlined,
  DoneAllOutlined,
  NotificationsOffOutlined,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import NotificationGroupPreview from "./NotificationGroupPreview";
import {
  useGetUnreadNotificationCountQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "./notificationsApiSlice";

// How often the badge re-checks for new matches. Matching runs on post
// creation, so a minute of latency is imperceptible while keeping this well
// clear of the API's rate limits.
const UNREAD_POLL_MS = 60000;

// The popover is a preview, not the inbox - the page handles paging. Counted
// in groups (one per listing of the reader's), not in individual matches.
const PREVIEW_SIZE = 6;

/**
 * Navbar notification bell: unread badge, and a popover previewing the most
 * recent match alerts.
 *
 * Only rendered for signed-in users (the endpoints are authenticated). The
 * unread count polls on an interval; the list itself is only fetched while the
 * popover is open, via RTK Query's `skip`.
 */
const NotificationBell = ({ variant = "desktop", onNavigate }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === 'ar';
  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);

  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: UNREAD_POLL_MS,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const unreadCount = unreadData?.unreadCount || 0;

  const { data, isFetching, isError } = useGetNotificationsQuery(
    { page: 1, pageSize: PREVIEW_SIZE, filter: 'all', language: currentLanguage },
    { skip: !isOpen, refetchOnMountOrArgChange: true }
  );

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const groups = data?.groups || [];

  const closePopover = useCallback(() => setAnchorEl(null), []);

  /**
   * A group with exactly one lead has an unambiguous destination, so it opens
   * that listing directly. A group with several does not - it opens the inbox,
   * where they can be compared side by side.
   */
  const handleOpenGroup = useCallback(async (group) => {
    closePopover();

    const onlyMatch = group.matches?.length === 1 ? group.matches[0] : null;
    if (!onlyMatch) {
      navigate('/dash/notifications');
      onNavigate?.();
      return;
    }

    if (!onlyMatch.isRead) {
      // Opening is the read receipt. Failing to record it must not block the
      // navigation the user actually asked for.
      try {
        await markRead(onlyMatch.notificationId).unwrap();
      } catch (error) {
        /* non-blocking */
      }
    }
    navigate(`/dash/posts/${onlyMatch.matchedPost.id}`);
    onNavigate?.();
  }, [closePopover, markRead, navigate, onNavigate]);

  const bellIcon = unreadCount > 0
    ? <NotificationsActiveOutlined sx={{ fontSize: variant === "desktop" ? 20 : 22 }} />
    : <NotificationsNoneOutlined sx={{ fontSize: variant === "desktop" ? 20 : 22 }} />;

  return (
    <>
      <Tooltip title={t('notifications')}>
        <IconButton
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label={t('notifications')}
          sx={{
            color: theme.custom.color.ink,
            padding: "10px",
            "&:hover": { backgroundColor: alpha(theme.custom.color.ink, 0.06) },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            max={99}
            color="error"
            overlap="circular"
            sx={{
              "& .MuiBadge-badge": {
                fontSize: "0.65rem",
                fontWeight: 700,
                minWidth: 18,
                height: 18,
              },
            }}
          >
            {bellIcon}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={closePopover}
        // Popover's horizontal anchors are physical, not logical, so the side
        // has to be picked from the document direction to keep the panel
        // hanging inward from the bell in both LTR and RTL.
        anchorOrigin={{ vertical: "bottom", horizontal: isRTL ? "left" : "right" }}
        transformOrigin={{ vertical: "top", horizontal: isRTL ? "left" : "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 400,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "70vh",
            borderRadius: `${theme.custom.radius.lg}px`,
            boxShadow: theme.custom.elevation.e3,
            backgroundColor: theme.custom.color.surfaceRaised,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            padding: 2,
            paddingBottom: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: theme.custom.color.ink }}>
            {t('notifications')}
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllOutlined sx={{ fontSize: 16 }} />}
              disabled={isMarkingAll}
              onClick={() => markAllRead()}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                color: theme.custom.color.brandPrimary,
                "& .MuiButton-startIcon": { marginInlineEnd: "4px", marginInlineStart: 0 },
              }}
            >
              {t('notifMarkAllRead')}
            </Button>
          )}
        </Box>
        <Divider />

        <Box sx={{ overflowY: "auto", padding: 1, flex: 1 }}>
          {isFetching && groups.length === 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {!isFetching && isError && (
            <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary", fontSize: "0.85rem" }}>
              {t('notifLoadError')}
            </Typography>
          )}

          {!isFetching && !isError && groups.length === 0 && (
            <Box sx={{ textAlign: "center", py: 4, paddingInline: 2 }}>
              <NotificationsOffOutlined sx={{ fontSize: 34, color: theme.palette.text.disabled, mb: 1 }} />
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme.custom.color.ink }}>
                {t('notifEmptyTitle')}
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.5 }}>
                {t('notifEmptyDescription')}
              </Typography>
            </Box>
          )}

          {groups.map((group) => (
            <NotificationGroupPreview key={group.id} group={group} onOpen={handleOpenGroup} />
          ))}
        </Box>

        <Divider />
        <Box sx={{ padding: 1.25 }}>
          <Button
            fullWidth
            onClick={() => {
              closePopover();
              navigate('/dash/notifications');
              onNavigate?.();
            }}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: theme.custom.color.brandPrimary,
              borderRadius: `${theme.custom.radius.md}px`,
            }}
          >
            {t('notifSeeAll')}
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
