import { Box, Typography, useTheme, alpha, lighten } from "@mui/material";
import {
  StackedBarChartOutlined as ReachIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  VisibilityOutlined as ViewsIcon,
  ThumbUpAltOutlined as ReactionsIcon,
  FavoriteBorder as LikesIcon,
  ChatBubbleOutline as CommentsIcon,
  ShareOutlined as SharesIcon,
  GroupsOutlined as EngagedIcon,
  TouchAppOutlined as ClicksIcon,
  BookmarkBorderOutlined as SavedIcon,
  OpenInNew as OpenIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import { useTranslation } from "../../../utils/translations";
import { summarizeSocialStats } from "../../../utils/socialStats";

/**
 * What the listing's auto-posted copies are doing on the Facebook Page and the
 * Instagram account.
 *
 * Every listing is mirrored to both on creation (server/services/
 * facebookService.js, instagramService.js) and, until now, that was the end of
 * it - whatever attention a post got there was invisible here. The numbers are
 * read back by server/services/socialStatsService.js and shown per platform
 * rather than as one pooled total, because they are not interchangeable: a
 * Facebook reaction, an Instagram like and a view are three different things
 * and pooling them would state a figure nobody measured.
 *
 * Each metric renders as a labelled row with a bar, the bar's fill relative to
 * the largest known metric on that same platform - a real comparison between
 * numbers we actually have, not an invented "score out of 100". The fill
 * gradient reuses Phase 17/19's brandPrimary -> lighten(brandPrimary) formula
 * rather than picking a new one.
 */

const MetricRow = ({ icon: Icon, label, value, max }) => {
  const theme = useTheme();
  if (value === null) return null;
  const fillPercent = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        py: 1,
        px: 1.25,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: alpha(theme.custom.color.ink, 0.04),
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: `${theme.custom.radius.sm}px`,
          backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 15, color: theme.custom.color.brandPrimary }} />
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: theme.custom.color.ink, fontWeight: 700 }}>
            {label}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.custom.color.brandPrimary, fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            height: 6,
            borderRadius: 999,
            backgroundColor: alpha(theme.custom.color.ink, 0.08),
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${fillPercent}%`,
              height: '100%',
              borderRadius: 999,
              backgroundImage: `linear-gradient(90deg, ${theme.custom.color.brandPrimary} 0%, ${lighten(theme.custom.color.brandPrimary, 0.45)} 100%)`,
              transition: 'width 0.4s ease',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

const PlatformCard = ({ icon: Icon, name, tint, permalink, linkLabel, metrics }) => {
  const theme = useTheme();
  const shown = metrics.filter((metric) => metric.value !== null);
  if (shown.length === 0) return null;
  const max = Math.max(1, ...shown.map((metric) => metric.value));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 1.5,
        borderRadius: `${theme.custom.radius.md}px`,
        backgroundColor: theme.custom.color.surfaceRaised,
        boxShadow: theme.custom.elevation.e1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, mb: 0.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: alpha(tint, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 19, color: tint }} />
        </Box>
        <Typography variant="body2" sx={{ color: theme.custom.color.ink, fontWeight: 700, flexGrow: 1 }}>
          {name}
        </Typography>
        {permalink && (
          <Box
            component="a"
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={linkLabel}
            sx={{
              width: 30,
              height: 30,
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: theme.custom.color.brandPrimary,
            }}
          >
            <OpenIcon sx={{ fontSize: 15 }} />
          </Box>
        )}
      </Box>
      {shown.map((metric) => (
        <MetricRow key={metric.key} icon={metric.icon} label={metric.label} value={metric.value} max={max} />
      ))}
    </Box>
  );
};

const SocialReach = ({ post }) => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const { facebook, instagram, hasStats, fetchedAt } = summarizeSocialStats(post);

  // Nothing has been read back yet - say nothing rather than render a row of
  // zeros that reads as "this listing is being ignored".
  if (!hasStats) return null;

  const locale = currentLanguage === 'ar' ? ar : currentLanguage === 'fr' ? fr : enUS;
  const updatedAgo = (() => {
    if (!fetchedAt) return null;
    try {
      return formatDistanceToNow(new Date(fetchedAt), { addSuffix: true, locale });
    } catch {
      return null;
    }
  })();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ReachIcon sx={{ fontSize: 18, color: theme.custom.color.brandPrimary }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: theme.custom.color.ink, fontSize: { xs: '1rem', md: '1.1rem' } }}
          >
            {t('socialReach')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('socialReachNote')}
          </Typography>
        </Box>
        {updatedAgo && (
          <Box
            sx={{
              px: 1.25,
              py: 0.375,
              borderRadius: 999,
              backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
              flexShrink: 0,
            }}
          >
            <Typography variant="caption" sx={{ color: theme.custom.color.brandPrimary, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {t('updated')} {updatedAgo}
            </Typography>
          </Box>
        )}
      </Box>

      <PlatformCard
        icon={FacebookIcon}
        name="Facebook"
        // Meta's own brand color: this row points at somewhere else, so it is
        // the one place the palette is not ours to choose.
        tint="#1877F2"
        permalink={facebook.unavailable ? null : facebook.permalink}
        linkLabel={t('viewOnFacebook')}
        metrics={[
          { key: 'views', icon: ViewsIcon, label: t('views'), value: facebook.views },
          { key: 'reactions', icon: ReactionsIcon, label: t('reactions'), value: facebook.reactions },
          { key: 'comments', icon: CommentsIcon, label: t('comments'), value: facebook.comments },
          { key: 'shares', icon: SharesIcon, label: t('shares'), value: facebook.shares },
          { key: 'engagedUsers', icon: EngagedIcon, label: t('engagedUsers'), value: facebook.engagedUsers },
          { key: 'clicks', icon: ClicksIcon, label: t('clicks'), value: facebook.clicks },
        ]}
      />

      <PlatformCard
        icon={InstagramIcon}
        name="Instagram"
        tint="#E1306C"
        permalink={instagram.unavailable ? null : instagram.permalink}
        linkLabel={t('viewOnInstagram')}
        metrics={[
          { key: 'views', icon: ViewsIcon, label: t('views'), value: instagram.views },
          { key: 'likes', icon: LikesIcon, label: t('likes'), value: instagram.likes },
          { key: 'comments', icon: CommentsIcon, label: t('comments'), value: instagram.comments },
          { key: 'saved', icon: SavedIcon, label: t('saved'), value: instagram.saved },
        ]}
      />
    </Box>
  );
};

export default SocialReach;
