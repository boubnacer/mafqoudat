import { Box, Typography, IconButton, Tooltip, useTheme, alpha } from "@mui/material";
import {
  CloseOutlined,
  TaskAltOutlined,
  SearchOffOutlined,
  ImageNotSupportedOutlined,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { formatRelativeTime, formatDaysApart } from "./matchDisplay";
import { ConfidenceBadge, MatchReasons } from "./MatchMeta";

/**
 * One counterpart listing inside a notification group.
 *
 * The group header already says which of the reader's own listings this is
 * about, so this row answers only the follow-up question: is *this* the item?
 * Photo first, then what it is and where, then the confidence and the reasons
 * behind the pairing.
 */
const NotificationItem = ({
  match,
  compact = false,
  onOpen,
  onDismiss,
  isDismissing = false,
}) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  const { matchedPost } = match;
  if (!matchedPost) return null;

  const matchedIsFound = String(matchedPost.foundLostCode).toUpperCase() === 'FOUND';
  const tone = matchedIsFound ? theme.custom.status.found : theme.custom.status.lost;
  const StatusIcon = matchedIsFound ? TaskAltOutlined : SearchOffOutlined;
  const daysApartLabel = formatDaysApart(match.daysApart, t, currentLanguage);

  const location = [matchedPost.cityLabel, matchedPost.exactLocation]
    .filter(Boolean)
    .join(' · ');

  return (
    <Box
      onClick={() => onOpen?.(match)}
      sx={{
        display: "flex",
        gap: 1.5,
        padding: compact ? 1 : 1.5,
        cursor: "pointer",
        borderRadius: `${theme.custom.radius.md}px`,
        // Unread reads as a tinted row plus the accent bar; no border, per the
        // platform's elevation-only container rule.
        backgroundColor: match.isRead
          ? "transparent"
          : alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.12 : 0.06),
        borderInlineStart: `3px solid ${match.isRead ? "transparent" : theme.custom.color.brandPrimary}`,
        transition: "background-color 0.2s ease",
        "&:hover": {
          backgroundColor: alpha(theme.custom.color.ink, 0.05),
        },
      }}
    >
      <Box
        sx={{
          width: compact ? 48 : 64,
          height: compact ? 48 : 64,
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
          <ImageNotSupportedOutlined sx={{ fontSize: 20, color: theme.palette.text.disabled }} />
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
          <StatusIcon sx={{ fontSize: 10, color: theme.palette.getContrastText(tone.main) }} />
          <Typography
            component="span"
            sx={{
              fontSize: "0.55rem",
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
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: compact ? "0.84rem" : "0.9rem",
              color: theme.custom.color.ink,
              lineHeight: 1.35,
              flex: 1,
              minWidth: 0,
            }}
          >
            {matchedPost.categoryLabel || t('unknownCategory')}
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
                    onDismiss(match);
                  }}
                  sx={{ padding: "2px", color: theme.palette.text.secondary }}
                >
                  <CloseOutlined sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        {location && (
          <Typography
            sx={{
              fontSize: compact ? "0.74rem" : "0.8rem",
              color: "text.secondary",
              mt: 0.25,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {location}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
          <ConfidenceBadge tier={match.tier} score={match.score} size="small" />
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
            {[daysApartLabel, formatRelativeTime(match.createdAt, currentLanguage)]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        </Box>

        {!compact && (
          <Box sx={{ mt: 0.75 }}>
            <MatchReasons reasons={match.reasons} max={4} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default NotificationItem;
