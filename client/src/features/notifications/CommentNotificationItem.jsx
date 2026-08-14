import { Box, IconButton, Tooltip, Typography, useTheme, alpha } from "@mui/material";
import { ChatBubbleOutlineOutlined, CloseOutlined, ImageNotSupportedOutlined } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { formatRelativeTime } from "./matchDisplay";

/**
 * One "someone commented on your post" alert, as an inbox row.
 *
 * A comment notification isn't a counterpart listing the reader has to judge
 * (no found/lost tag, no confidence score) - it's one person's words about a
 * post the reader already owns, so the row leads with who said what rather
 * than with the match vocabulary the rest of this inbox uses.
 *
 * `asCard` wraps the row in the same surfaceRaised/radius.lg/elevation.e1
 * shell NotificationGroup uses for its own top-level entries - needed on the
 * inbox page, where this sits as a peer of match cards, but not in the bell
 * popover, where NotificationGroupPreview's rows are bare for the same reason.
 */
const CommentNotificationItem = ({ item, onOpen, onDismiss, isDismissing = false, asCard = false }) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  const { post, comment } = item;
  if (!post || !comment) return null;

  const username = comment.author?.username;
  const headline = username
    ? t('notifCommentHeadline', { username })
    : t('notifCommentHeadlineAnon');

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
          : alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.12 : 0.06),
        borderInlineStart: `4px solid ${item.isRead ? "transparent" : theme.custom.color.brandPrimary}`,
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
            backgroundColor: theme.custom.color.brandPrimary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 2px ${theme.custom.color.surfaceRaised}`,
          }}
        >
          <ChatBubbleOutlineOutlined sx={{ fontSize: 11, color: theme.palette.common.white }} />
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
          {comment.text}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.5 }}>
          {formatRelativeTime(comment.createdAt, currentLanguage)}
        </Typography>
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

export default CommentNotificationItem;
