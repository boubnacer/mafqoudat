import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from "@mui/material";
import {
  ChatBubbleOutline as CommentsIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  MoreVert as MoreIcon,
  DeleteOutline as DeleteIcon,
  FlagOutlined as ReportIcon,
  SendOutlined as SendIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import { useTranslation } from "../../../utils/translations";
import useAuth from "../../../hooks/useAuth";
import {
  useGetPostCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useReportCommentMutation,
} from "../postsApiSlice";

/**
 * The post's comment thread: comments written here, interleaved by time with
 * the ones left on the auto-posted Facebook/Instagram copies.
 *
 * The merge happens server-side (server/controllers/commentsController.js);
 * this renders it. The one rule that shapes the whole component is that the
 * two kinds never blur together: a site comment comes from an account that
 * can be moderated and replied to, a Facebook comment comes from a stranger
 * on someone else's platform. A reader deciding whether to trust a lead about
 * their lost property needs to know which one they are looking at, so the
 * source stays visible on every borrowed comment.
 *
 * Replying to a social comment is deliberately not offered: the only way to
 * post one would be through the Page token, which would publish the user's
 * words as the Mafqoudat Page itself.
 */

// Meta's own brand colors - same exception to the token rule as SocialReach,
// for the same reason: these mark content that belongs to their platforms.
const SOURCE_META = {
  facebook: { icon: FacebookIcon, tint: "#1877F2", labelKey: "commentFromFacebook" },
  instagram: { icon: InstagramIcon, tint: "#E1306C", labelKey: "commentFromInstagram" },
};

// How many more comments each "load more" reveals. Matches the server's
// default page size; its ceiling (MAX_PAGE_SIZE) caps how far this can grow.
const PAGE_STEP = 20;

const CommentItem = ({ comment, postId, onError }) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();
  const [reportComment] = useReportCommentMutation();

  const locale = currentLanguage === "ar" ? ar : currentLanguage === "fr" ? fr : enUS;
  const source = SOURCE_META[comment.source];
  const hasActions = comment.canDelete || comment.canReport;

  const when = (() => {
    if (!comment.createdAt) return null;
    try {
      return formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale });
    } catch {
      return null;
    }
  })();

  const handleDelete = async () => {
    setMenuAnchor(null);
    if (!window.confirm(t("deleteCommentConfirm"))) return;
    try {
      await deleteComment({ postId, commentId: comment.id }).unwrap();
    } catch {
      onError(t("commentFailed"));
    }
  };

  const handleReport = async () => {
    setMenuAnchor(null);
    try {
      await reportComment({
        postId,
        commentId: comment.id,
        reasonType: "inappropriate_content",
        reason: "Reported from the post page",
      }).unwrap();
      onError(t("commentReported"), "success");
    } catch {
      onError(t("commentFailed"));
    }
  };

  // A borrowed comment with no readable author name still says something
  // worth showing - it just cannot say who said it.
  const displayName = comment.author?.username || (source ? t("unknownCommenter") : t("unknownUser"));

  return (
    <Box sx={{ display: "flex", gap: 1.5, py: 2 }}>
      <Avatar
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          fontSize: "0.9rem",
          fontWeight: 700,
          backgroundColor: source
            ? alpha(source.tint, 0.12)
            : alpha(theme.custom.color.brandPrimary, 0.12),
          color: source ? source.tint : theme.custom.color.brandPrimary,
        }}
      >
        {displayName.charAt(0).toUpperCase()}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.custom.color.ink }}>
            {displayName}
          </Typography>

          {source && (
            <Tooltip title={t("socialCommentNote")}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.375,
                  px: 0.75,
                  py: 0.125,
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: alpha(source.tint, 0.1),
                }}
              >
                <source.icon sx={{ fontSize: 12, color: source.tint }} />
                <Typography variant="caption" sx={{ color: source.tint, fontWeight: 600, fontSize: "0.68rem" }}>
                  {t(source.labelKey)}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {when && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {when}
            </Typography>
          )}

          {hasActions && (
            <>
              <IconButton
                size="small"
                onClick={(event) => setMenuAnchor(event.currentTarget)}
                disabled={isDeleting}
                sx={{ marginInlineStart: "auto", p: 0.25 }}
              >
                <MoreIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
                {comment.canDelete && (
                  <MenuItem onClick={handleDelete} sx={{ gap: 1, fontSize: "0.875rem" }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                    {t("deleteComment")}
                  </MenuItem>
                )}
                {comment.canReport && (
                  <MenuItem onClick={handleReport} sx={{ gap: 1, fontSize: "0.875rem" }}>
                    <ReportIcon sx={{ fontSize: 18 }} />
                    {t("reportComment")}
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Box>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: theme.palette.text.secondary,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {comment.text}
        </Typography>
      </Box>
    </Box>
  );
};

const CommentsSection = ({ postId }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  // "Load more" grows the first page rather than walking page numbers: the
  // thread is one merged, re-sorted list, so a comment arriving between two
  // requests shifts every later page down by one and appending would
  // duplicate or skip entries.
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState(null);

  const { data, isLoading, isError } = useGetPostCommentsQuery({ postId, page: 1, pageSize: visibleCount });
  const [addComment, { isLoading: isPosting }] = useAddCommentMutation();

  const comments = data?.comments || [];
  const total = data?.total || 0;
  const hasMore = comments.length < total;

  const showNotice = (message, severity = "error") => setNotice({ message, severity });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await addComment({ postId, text: trimmed }).unwrap();
      setText("");
    } catch {
      showNotice(t("commentFailed"));
    }
  };

  // Everything below — header, composer, comment list — shares one tinted
  // panel so the section reads as a single block instead of a composer
  // floating above bare comment rows. Mirrors mobile CommentsSection.js's
  // `panel` (Phase 14).
  return (
    <Box
      sx={{
        p: { xs: 1.75, md: 2.25 },
        borderRadius: `${theme.custom.radius.lg}px`,
        backgroundColor: alpha(theme.custom.color.ink, 0.04),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <CommentsIcon sx={{ fontSize: 20, color: theme.custom.color.ink }} />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: theme.custom.color.ink, fontSize: { xs: "1rem", md: "1.1rem" } }}
        >
          {t("commentsTitle")}
        </Typography>
        {total > 0 && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("commentsCount", { count: total })}
          </Typography>
        )}
      </Box>

      {notice && (
        <Alert
          severity={notice.severity}
          onClose={() => setNotice(null)}
          sx={{ mb: 2, borderRadius: `${theme.custom.radius.md}px` }}
        >
          {notice.message}
        </Alert>
      )}

      {isAuthenticated ? (
        // Field on its own row, action + counter beneath it — a side-by-side
        // field+button squeezed the input too narrow for its own placeholder
        // and gave the primary action no label. Mirrors mobile's stacked
        // composer (Phase 14) instead of this page's old inline form.
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("commentPlaceholder")}
            inputProps={{ maxLength: 1000 }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: theme.custom.color.surfaceRaised,
              },
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            }}
          />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mt: 1.25 }}>
            <Typography variant="caption" sx={{ color: alpha(theme.custom.color.ink, 0.5) }}>
              {text.length > 0 ? `${text.length}/1000` : ""}
            </Typography>
            <Button
              type="submit"
              variant="contained"
              disabled={!text.trim() || isPosting}
              startIcon={isPosting ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
              sx={{
                flexShrink: 0,
                borderRadius: `${theme.custom.radius.md}px`,
                backgroundColor: theme.custom.color.brandPrimary,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8125rem",
                px: 2,
              }}
            >
              {isPosting ? t("posting") : t("postComment")}
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
          {t("signInToComment")}
        </Typography>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={22} />
        </Box>
      ) : isError ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 2, mt: 1 }}>
          {t("commentFailed")}
        </Typography>
      ) : comments.length === 0 ? (
        <Box sx={{ py: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.custom.color.ink }}>
            {t("noCommentsYet")}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("beFirstToComment")}
          </Typography>
        </Box>
      ) : (
        <>
          {comments.map((comment, index) => (
            <Box key={comment.id}>
              {index > 0 && <Divider sx={{ borderColor: alpha(theme.custom.color.ink, 0.08) }} />}
              <CommentItem comment={comment} postId={postId} onError={showNotice} />
            </Box>
          ))}

          {hasMore && (
            <Button
              onClick={() => setVisibleCount((current) => current + PAGE_STEP)}
              sx={{ textTransform: "none", color: theme.custom.color.brandPrimary, fontWeight: 600 }}
            >
              {t("loadMoreComments")}
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

export default CommentsSection;
