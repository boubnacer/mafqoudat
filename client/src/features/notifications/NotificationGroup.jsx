import { useState } from "react";
import { Box, Button, Typography, useTheme, alpha } from "@mui/material";
import {
  ImageNotSupportedOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  LayersOutlined,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { getGroupHeadlineKey } from "./matchDisplay";
import { ConfidenceBadge } from "./MatchMeta";
import NotificationItem from "./NotificationItem";

// How many counterparts show before the group has to be expanded. Three is
// enough to judge whether the batch is worth opening without turning one
// listing's leads into a full page of scrolling.
const COLLAPSED_COUNT = 3;

/**
 * Every alert about one of the reader's listings, as a single inbox entry.
 *
 * A new lost-cat listing in a city that already holds several found-cat
 * listings produces one notification per pair, all at once. Shown flat, that
 * reads as a wall of near-identical rows; shown as a group it reads as what it
 * is - one listing of yours, with these candidates.
 *
 * Read and dismiss stay per-counterpart: accepting or rejecting one lead says
 * nothing about the others.
 */
const NotificationGroup = ({
  group,
  onOpenMatch,
  onDismissMatch,
  isDismissing = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const { post, matches = [] } = group;
  if (!post || matches.length === 0) return null;

  const visibleMatches = isExpanded ? matches : matches.slice(0, COLLAPSED_COUNT);
  const hiddenCount = matches.length - visibleMatches.length;
  const hasUnread = group.unreadCount > 0;

  const ownLocation = [post.cityLabel, post.exactLocation].filter(Boolean).join(' · ');

  return (
    <Box
      sx={{
        backgroundColor: theme.custom.color.surfaceRaised,
        borderRadius: `${theme.custom.radius.lg}px`,
        boxShadow: theme.custom.elevation.e1,
        overflow: "hidden",
      }}
    >
      {/* Header: which listing of mine is this about, and how strong is the
          best lead in the batch. */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          padding: 2,
          paddingBottom: 1.5,
          backgroundColor: hasUnread
            ? alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.1 : 0.05)
            : "transparent",
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.95rem",
                color: theme.custom.color.ink,
                lineHeight: 1.3,
              }}
            >
              {t(getGroupHeadlineKey(post.foundLostCode), {
                item: post.categoryLabel || t('unknownCategory'),
              })}
            </Typography>
            {hasUnread && (
              <Box
                component="span"
                sx={{
                  paddingInline: 0.75,
                  paddingBlock: 0.125,
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: theme.custom.color.brandPrimary,
                  color: theme.palette.common.white,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: 0.3,
                }}
              >
                {t('notifNewTag')}
              </Box>
            )}
          </Box>
          {ownLocation && (
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mt: 0.25 }}>
              {ownLocation}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {/* Count as a pill rather than inside the sentence: a bare number
              sidesteps the singular/dual/plural agreement that "{n} matches"
              would need in Arabic. */}
          <Box
            title={t('notifGroupMatchCountLabel')}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              paddingInline: 1,
              paddingBlock: 0.375,
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: alpha(theme.custom.color.ink, 0.06),
            }}
          >
            <LayersOutlined sx={{ fontSize: 15, color: theme.palette.text.secondary }} />
            <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: theme.custom.color.ink }}>
              {group.matchCount}
            </Typography>
          </Box>
          <ConfidenceBadge tier={group.topTier} score={group.topScore} size="small" />
        </Box>
      </Box>

      <Box sx={{ padding: 1, paddingTop: 0 }}>
        {visibleMatches.map((match) => (
          <NotificationItem
            key={match.notificationId}
            match={match}
            onOpen={onOpenMatch}
            onDismiss={onDismissMatch}
            isDismissing={isDismissing}
          />
        ))}

        {matches.length > COLLAPSED_COUNT && (
          <Button
            fullWidth
            size="small"
            onClick={() => setIsExpanded((current) => !current)}
            endIcon={isExpanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
            sx={{
              mt: 0.5,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              color: theme.custom.color.brandPrimary,
              borderRadius: `${theme.custom.radius.md}px`,
              "& .MuiButton-endIcon": { marginInlineStart: "4px", marginInlineEnd: 0 },
            }}
          >
            {isExpanded ? t('notifShowLess') : `${t('notifShowAll')} (${hiddenCount})`}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default NotificationGroup;
