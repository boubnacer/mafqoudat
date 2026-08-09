import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Divider,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
import {
  TravelExploreOutlined,
  TaskAltOutlined,
  SearchOffOutlined,
  ImageNotSupportedOutlined,
  ArrowForwardOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { formatDaysApart, formatRelativeTime } from "./matchDisplay";
import { ConfidenceBadge, MatchReasons } from "./MatchMeta";
import { useGetMatchesForPostQuery, useDismissMatchMutation } from "./notificationsApiSlice";

/**
 * "Possible matches" panel on a post's own detail page.
 *
 * Only rendered for the post's owner - the match list pairs their listing with
 * other people's, and the server rejects the request from anyone else anyway.
 *
 * This is the retroactive half of the feature: notifications only fire for
 * posts created or edited after the match engine landed, whereas opening this
 * panel scores the post on demand (throttled server-side), so listings that
 * predate the feature still get their leads.
 */
const PostMatchesPanel = ({ postId, isOwner, postReturned = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const shouldLoad = Boolean(isOwner && postId && !postReturned);

  const { data, isLoading, isError } = useGetMatchesForPostQuery(
    { postId, language: currentLanguage },
    { skip: !shouldLoad }
  );
  const [dismissMatch, { isLoading: isDismissing }] = useDismissMatchMutation();

  const handleDismiss = useCallback(async (matchId) => {
    try {
      await dismissMatch(matchId).unwrap();
    } catch (error) {
      /* the tag invalidation refetches the list either way */
    }
  }, [dismissMatch]);

  if (!shouldLoad) return null;

  const matches = data?.matches || [];

  return (
    <Box
      sx={{
        background: `linear-gradient(145deg, ${alpha(theme.custom.color.surfaceRaised, 0.96)}, ${alpha(theme.custom.color.surfaceRaised, 0.86)})`,
        backdropFilter: "blur(18px)",
        borderRadius: `${isDesktop ? theme.custom.radius.xl : theme.custom.radius.lg}px`,
        boxShadow: theme.custom.elevation.e2,
        padding: { xs: 2, md: 3 },
        mt: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.5 }}>
        <TravelExploreOutlined sx={{ fontSize: 24, color: theme.custom.color.brandPrimary }} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: theme.custom.color.ink,
            fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.65rem" },
          }}
        >
          {t('notifPossibleMatchesTitle')}
        </Typography>
      </Box>
      <Typography sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.88rem", mb: 2 }}>
        {t('notifPossibleMatchesSubtitle')}
      </Typography>

      {isLoading && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[0, 1].map((index) => <Skeleton key={index} variant="rounded" height={120} />)}
        </Box>
      )}

      {!isLoading && isError && (
        <Typography sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.88rem", py: 2 }}>
          {t('notifMatchesLoadError')}
        </Typography>
      )}

      {!isLoading && !isError && matches.length === 0 && (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: theme.custom.color.ink }}>
            {t('notifNoMatchesTitle')}
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mt: 0.5, maxWidth: 420, marginInline: "auto" }}>
            {t('notifNoMatchesDescription')}
          </Typography>
        </Box>
      )}

      {matches.map((match, index) => {
        const other = match.matchedPost;
        if (!other) return null;

        const otherIsFound = String(other.foundLostCode).toUpperCase() === 'FOUND';
        const tone = otherIsFound ? theme.custom.status.found : theme.custom.status.lost;
        const StatusIcon = otherIsFound ? TaskAltOutlined : SearchOffOutlined;
        const daysApartLabel = formatDaysApart(match.daysApart, t);
        const location = [other.cityLabel, other.exactLocation].filter(Boolean).join(' · ');

        return (
          <Box key={match.id}>
            {index > 0 && <Divider sx={{ my: 1.5 }} />}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                padding: 1.5,
                borderRadius: `${theme.custom.radius.md}px`,
                borderInlineStart: `6px solid ${tone.main}`,
                backgroundColor: alpha(theme.custom.color.ink, 0.03),
              }}
            >
              <Box
                onClick={() => navigate(`/dash/posts/${other.id}`)}
                sx={{
                  width: 84,
                  height: 84,
                  flexShrink: 0,
                  borderRadius: `${theme.custom.radius.md}px`,
                  overflow: "hidden",
                  cursor: "pointer",
                  backgroundColor: alpha(theme.custom.color.ink, 0.06),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {other.image ? (
                  <Box
                    component="img"
                    src={other.image}
                    alt=""
                    loading="lazy"
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <ImageNotSupportedOutlined sx={{ fontSize: 24, color: theme.palette.text.disabled }} />
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
                      lineHeight: 1,
                      color: theme.palette.getContrastText(tone.main),
                    }}
                  >
                    {otherIsFound ? t('found') : t('lost')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 0.5 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: theme.custom.color.ink,
                      minWidth: 0,
                    }}
                  >
                    {other.categoryLabel || t('unknownCategory')}
                  </Typography>
                  <ConfidenceBadge tier={match.tier} score={match.score} size="small" />
                </Box>

                {location && (
                  <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 0.75 }}>
                    {location}
                  </Typography>
                )}

                <Box sx={{ mb: 1 }}>
                  <MatchReasons reasons={match.reasons} />
                </Box>

                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                  {[daysApartLabel, formatRelativeTime(other.createdAt, currentLanguage)]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    variant="contained"
                    disableElevation
                    endIcon={<ArrowForwardOutlined data-directional="true" sx={{ fontSize: 16 }} />}
                    onClick={() => navigate(`/dash/posts/${other.id}`)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      borderRadius: `${theme.custom.radius.sm}px`,
                      backgroundColor: theme.custom.color.brandPrimary,
                      "& .MuiButton-endIcon": { marginInlineStart: "4px", marginInlineEnd: 0 },
                    }}
                  >
                    {t('notifViewMatch')}
                  </Button>
                  <Button
                    size="small"
                    disabled={isDismissing}
                    startIcon={<CloseOutlined sx={{ fontSize: 16 }} />}
                    onClick={() => handleDismiss(match.id)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      color: theme.palette.text.secondary,
                      "& .MuiButton-startIcon": { marginInlineEnd: "4px", marginInlineStart: 0 },
                    }}
                  >
                    {t('notifNotAMatch')}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default PostMatchesPanel;
