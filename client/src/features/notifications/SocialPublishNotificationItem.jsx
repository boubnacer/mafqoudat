import { Box, IconButton, Tooltip, Typography, useTheme, alpha } from "@mui/material";
import {
  CloseOutlined,
  ImageNotSupportedOutlined,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  ErrorOutlineOutlined,
  ArrowForwardOutlined,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { formatRelativeTime } from "./matchDisplay";

/**
 * One "your listing is now on our Facebook page / Instagram account" alert.
 *
 * Not a lead to judge and not someone else's words - it reports on what the
 * platform itself did with the reader's own listing, so the row leads with the
 * page it reached and points at the one screen that answers the obvious next
 * question ("how is it doing?"): the listing's reach section.
 *
 * The platform's own brand color is the badge's fill - the same documented
 * exception SocialReach.jsx and ReachRow.jsx already carry for these two, since
 * a row pointing at Facebook or Instagram is naming somewhere else, whose
 * palette is not ours to pick. A failed publish drops that for the lost/found
 * `status.lost` tone, which is this design system's own "something went wrong"
 * color rather than a fourth one invented here.
 *
 * `asCard` wraps the row in the surfaceRaised/radius.lg/elevation.e1 shell the
 * inbox page's top-level entries use, and is left off in the bell popover where
 * rows are bare - exactly as CommentNotificationItem does.
 */

const PLATFORM_ICONS = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

// Meta's brand colors, same values SocialReach.jsx uses.
const PLATFORM_COLORS = {
  facebook: '#1877F2',
  instagram: '#E1306C',
};

const SocialPublishNotificationItem = ({ item, onOpen, onDismiss, isDismissing = false, asCard = false }) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  const { post, platform, platformName, status } = item;
  if (!post) return null;

  const failed = status === 'failed';
  const PlatformIcon = PLATFORM_ICONS[platform] || FacebookIcon;
  const BadgeIcon = failed ? ErrorOutlineOutlined : PlatformIcon;
  const accent = failed ? theme.custom.status.lost.main : (PLATFORM_COLORS[platform] || theme.custom.color.brandPrimary);
  const name = platformName || platform;

  const headline = failed
    ? t('notifSocialFailedHeadline', { platform: name })
    : t('notifSocialPublishedHeadline', { platform: name });
  const body = failed
    ? t('notifSocialFailedBody', { platform: name })
    : t('notifSocialPublishedBody', { platform: name });

  const row = (
    <Box
      onClick={() => onOpen?.(item)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        padding: 1.5,
        cursor: "pointer",
        borderRadius: asCard ? 0 : `${theme.custom.radius.md}px`,
        backgroundColor: item.isRead
          ? "transparent"
          : alpha(accent, theme.palette.mode === 'dark' ? 0.14 : 0.07),
        borderInlineStart: `4px solid ${item.isRead ? "transparent" : accent}`,
        transition: "background-color 0.2s ease",
        "&:hover": { backgroundColor: alpha(theme.custom.color.ink, 0.05) },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: `${theme.custom.radius.md}px`,
          overflow: "hidden",
          backgroundColor: alpha(theme.custom.color.ink, 0.06),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {post.image ? (
          <Box
            component="img"
            src={post.image}
            alt=""
            loading="lazy"
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <ImageNotSupportedOutlined sx={{ fontSize: 18, color: theme.palette.text.disabled }} />
        )}
        <Box
          sx={{
            position: "absolute",
            insetBlockEnd: -2,
            insetInlineEnd: -2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 2px ${theme.custom.color.surfaceRaised}`,
          }}
        >
          <BadgeIcon sx={{ fontSize: 12, color: theme.palette.getContrastText(accent) }} />
        </Box>
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Typography
            sx={{
              flex: 1,
              minWidth: 0,
              fontWeight: 700,
              fontSize: "0.88rem",
              color: theme.custom.color.ink,
              lineHeight: 1.3,
            }}
          >
            {headline}
          </Typography>
          {onDismiss && (
            <Tooltip title={t('notifDismiss')}>
              <span>
                <IconButton
                  size="small"
                  aria-label={t('notifDismiss')}
                  disabled={isDismissing}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDismiss(item);
                  }}
                  sx={{ padding: "2px", color: theme.palette.text.secondary }}
                >
                  <CloseOutlined sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        <Typography
          sx={{
            fontSize: "0.82rem",
            color: "text.secondary",
            mt: 0.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {body}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
          {/* The whole row opens the listing's reach section; this says so,
              rather than being a second control beside it. The arrow is the
              only physical-direction glyph here, so it mirrors with the
              document. */}
          <Typography
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.375,
              fontSize: "0.74rem",
              fontWeight: 700,
              color: theme.custom.color.brandPrimary,
            }}
          >
            {t('notifSocialSeeReach')}
            <ArrowForwardOutlined
              sx={{ fontSize: 13, transform: theme.direction === 'rtl' ? 'scaleX(-1)' : 'none' }}
            />
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
            {formatRelativeTime(item.createdAt, currentLanguage)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  if (!asCard) return row;

  return (
    <Box
      sx={{
        backgroundColor: theme.custom.color.surfaceRaised,
        borderRadius: `${theme.custom.radius.lg}px`,
        boxShadow: theme.custom.elevation.e1,
        overflow: "hidden",
      }}
    >
      {row}
    </Box>
  );
};

export default SocialPublishNotificationItem;
