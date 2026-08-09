import { Box, Typography, IconButton, Tooltip, Button, useTheme, alpha } from "@mui/material";
import {
  CloseOutlined,
  TaskAltOutlined,
  SearchOffOutlined,
  ImageNotSupportedOutlined,
  ArrowForwardOutlined,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { formatRelativeTime, formatDaysApart, getMatchHeadlineKey } from "./matchDisplay";
import { ConfidenceBadge, MatchReasons } from "./MatchMeta";

/**
 * One match alert, rendered identically in the navbar popover (`compact`) and
 * on the notifications page.
 *
 * The row is built around a single question: is the listing on the other side
 * mine? So it leads with the other listing's photo and description, states the
 * confidence, and explains the pairing - with the reader's own listing shown
 * underneath as context rather than as the subject.
 */
const NotificationItem = ({
  notification,
  compact = false,
  onOpen,
  onDismiss,
  isDismissing = false,
}) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  const { post, matchedPost } = notification;
  if (!post || !matchedPost) return null;

  const matchedIsFound = String(matchedPost.foundLostCode).toUpperCase() === 'FOUND';
  const tone = matchedIsFound ? theme.custom.status.found : theme.custom.status.lost;
  const StatusIcon = matchedIsFound ? TaskAltOutlined : SearchOffOutlined;
  const daysApartLabel = formatDaysApart(notification.daysApart, t, currentLanguage);

  const location = [matchedPost.cityLabel, matchedPost.exactLocation]
    .filter(Boolean)
    .join(' · ');

  return (
    <Box
      onClick={() => onOpen?.(notification)}
      sx={{
        display: "flex",
        gap: 1.5,
        padding: compact ? 1.5 : 2,
        cursor: "pointer",
        borderRadius: `${theme.custom.radius.md}px`,
        // Unread reads as a tinted row plus the accent bar below; no border,
        // per the platform's elevation-only container rule.
        backgroundColor: notification.isRead
          ? "transparent"
          : alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.12 : 0.06),
        borderInlineStart: `4px solid ${notification.isRead ? "transparent" : theme.custom.color.brandPrimary}`,
        transition: "background-color 0.2s ease",
        "&:hover": {
          backgroundColor: alpha(theme.custom.color.ink, 0.05),
        },
      }}
    >
      {/* Thumbnail of the other listing - the thing the reader is being asked
          to recognise. */}
      <Box
        sx={{
          width: compact ? 56 : 76,
          height: compact ? 56 : 76,
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
        {matchedPost.image ? (
          <Box
            component="img"
            src={matchedPost.image}
            alt=""
            loading="lazy"
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <ImageNotSupportedOutlined sx={{ fontSize: 22, color: theme.palette.text.disabled }} />
        )}
        <Box
          sx={{
            position: "absolute",
            insetBlockEnd: 0,
            insetInlineStart: 0,
            insetInlineEnd: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.25,
            paddingBlock: "2px",
            backgroundColor: tone.main,
          }}
        >
          <StatusIcon sx={{ fontSize: 11, color: theme.palette.getContrastText(tone.main) }} />
          <Typography
            component="span"
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: 0.3,
              lineHeight: 1,
              color: theme.palette.getContrastText(tone.main),
            }}
          >
            {matchedIsFound ? t('found') : t('lost')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: compact ? "0.86rem" : "0.95rem",
              color: theme.custom.color.ink,
              lineHeight: 1.35,
              flex: 1,
              minWidth: 0,
            }}
          >
            {t(getMatchHeadlineKey(post.foundLostCode), {
              item: matchedPost.categoryLabel || t('unknownCategory'),
            })}
          </Typography>

          {onDismiss && (
            <Tooltip title={t('notifDismiss')}>
              <span>
                <IconButton
                  size="small"
                  disabled={isDismissing}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDismiss(notification);
                  }}
                  sx={{ padding: "2px", color: theme.palette.text.secondary }}
                >
                  <CloseOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        {location && (
          <Typography
            sx={{
              fontSize: compact ? "0.76rem" : "0.82rem",
              color: "text.secondary",
              mb: 0.75,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {location}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, mb: compact ? 0.5 : 1 }}>
          <ConfidenceBadge tier={notification.tier} score={notification.score} size={compact ? "small" : "medium"} />
          {daysApartLabel && (
            <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
              {daysApartLabel}
            </Typography>
          )}
        </Box>

        {!compact && (
          <Box sx={{ mb: 1.25 }}>
            <MatchReasons reasons={notification.reasons} />
          </Box>
        )}

        {/* The reader's own listing, stated plainly so the pairing is never
            ambiguous when they have several open listings. */}
        <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
          {t('notifAgainstYourListing', { item: post.categoryLabel || t('unknownCategory') })}
          {' · '}
          {formatRelativeTime(notification.createdAt, currentLanguage)}
        </Typography>

        {/* data-directional below is the theme's convention for arrows that
            must mirror in RTL (see the MuiSvgIcon override in theme.js). */}
        {!compact && (
          <Button
            size="small"
            endIcon={<ArrowForwardOutlined data-directional="true" sx={{ fontSize: 16 }} />}
            onClick={(event) => {
              event.stopPropagation();
              onOpen?.(notification);
            }}
            sx={{
              mt: 1,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              color: theme.custom.color.brandPrimary,
              paddingInline: 0,
              "& .MuiButton-endIcon": {
                marginInlineStart: "4px",
                marginInlineEnd: 0,
              },
            }}
          >
            {t('notifViewMatch')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default NotificationItem;
