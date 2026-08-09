import { Box, Typography, useTheme, alpha } from "@mui/material";
import { ImageNotSupportedOutlined, LayersOutlined } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { formatRelativeTime, getGroupHeadlineKey } from "./matchDisplay";
import { ConfidenceBadge } from "./MatchMeta";

/**
 * A notification group as one line in the navbar popover.
 *
 * The popover is a glance, not a workspace: it says which listing picked up
 * leads, how many, and how strong the best one is. Comparing the candidates
 * themselves is what the inbox page is for, so this deliberately shows none of
 * them - unwinding a group here would reproduce the wall of rows that grouping
 * exists to prevent.
 */
const NotificationGroupPreview = ({ group, onOpen }) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  const { post } = group;
  if (!post) return null;

  const hasUnread = group.unreadCount > 0;
  const ownLocation = [post.cityLabel, post.exactLocation].filter(Boolean).join(' · ');

  return (
    <Box
      onClick={() => onOpen?.(group)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        padding: 1.5,
        cursor: "pointer",
        borderRadius: `${theme.custom.radius.md}px`,
        backgroundColor: hasUnread
          ? alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.12 : 0.06)
          : "transparent",
        borderInlineStart: `4px solid ${hasUnread ? theme.custom.color.brandPrimary : "transparent"}`,
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
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "0.86rem",
            color: theme.custom.color.ink,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {t(getGroupHeadlineKey(post.foundLostCode), {
            item: post.categoryLabel || t('unknownCategory'),
          })}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
          <ConfidenceBadge tier={group.topTier} score={group.topScore} size="small" />
          <Box
            title={t('notifGroupMatchCountLabel')}
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.375 }}
          >
            <LayersOutlined sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
            <Typography sx={{ fontSize: "0.74rem", fontWeight: 700, color: "text.secondary" }}>
              {group.matchCount}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
            {formatRelativeTime(group.latestAt, currentLanguage)}
          </Typography>
        </Box>

        {ownLocation && (
          <Typography
            sx={{
              fontSize: "0.72rem",
              color: "text.secondary",
              mt: 0.25,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {ownLocation}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default NotificationGroupPreview;
