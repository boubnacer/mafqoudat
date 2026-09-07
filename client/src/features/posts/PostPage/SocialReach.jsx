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
 * Visual treatment: a glowing "product panel" look (gradient icon badge, a
 * status pill, metric rows with a gradient progress bar) rather than the flat
 * chip row this used before. The glow/gradient is built from
 * theme.custom.color.brandPrimary (Phase 17/19's brandPrimary ->
 * lighten(brandPrimary, 0.45) formula) so it still resolves correctly in both
 * light and dark mode, rather than a fixed dark-purple palette that would
 * ignore the theme toggle. Each bar's fill is relative to the largest known
 * metric on that same platform - a real comparison between numbers we
 * actually have, not an invented "score out of 100".
 */

const MetricRow = ({ icon: Icon, label, value, max }) => {
  const theme = useTheme();
  if (value === null) return null;
  const brand = theme.custom.color.brandPrimary;
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
          width: 30,
          height: 30,
          borderRadius: `${theme.custom.radius.sm}px`,
          backgroundColor: alpha(brand, 0.12),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 16, color: brand }} />
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: theme.custom.color.ink, fontWeight: 700, mb: 0.5 }}>
          {label}
        </Typography>
        <Box
          sx={{
            height: 8,
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
              backgroundImage: `linear-gradient(90deg, ${brand} 0%, ${lighten(brand, 0.45)} 100%)`,
              boxShadow: `0 0 8px ${alpha(brand, 0.55)}`,
              transition: 'width 0.4s ease',
            }}
          />
        </Box>
      </Box>
      <Typography
        variant="h6"
        sx={{ color: brand, fontWeight: 800, minWidth: 32, textAlign: 'end', flexShrink: 0 }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const PlatformCard = ({ icon: Icon, name, tint, permalink, linkLabel, statusLabel, metrics }) => {
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
        p: 1.75,
        borderRadius: `${theme.custom.radius.lg}px`,
        backgroundColor: theme.custom.color.surfaceRaised,
        boxShadow: `${theme.custom.elevation.e2}, 0 0 28px ${alpha(tint, 0.18)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, mb: 0.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: `${theme.custom.radius.md}px`,
            backgroundImage: `linear-gradient(135deg, ${tint} 0%, ${lighten(tint, 0.25)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 0 14px ${alpha(tint, 0.5)}`,
          }}
        >
          <Icon sx={{ fontSize: 21, color: '#fff' }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body1" sx={{ color: theme.custom.color.ink, fontWeight: 700 }}>
            {name}
          </Typography>
        </Box>
        {statusLabel && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.625,
              px: 1.125,
              py: 0.5,
              borderRadius: 999,
              backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
              flexShrink: 0,
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.custom.color.brandPrimary, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: theme.custom.color.brandPrimary, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {statusLabel}
            </Typography>
          </Box>
        )}
        {permalink && (
          <Box
            component="a"
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={linkLabel}
            sx={{
              width: 32,
              height: 32,
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: alpha(theme.custom.color.ink, 0.06),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: theme.custom.color.ink,
            }}
          >
            <OpenIcon sx={{ fontSize: 16 }} />
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: `${theme.custom.radius.md}px`,
            backgroundImage: `linear-gradient(135deg, ${theme.custom.color.brandPrimary} 0%, ${lighten(theme.custom.color.brandPrimary, 0.45)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 0 14px ${alpha(theme.custom.color.brandPrimary, 0.45)}`,
          }}
        >
          <ReachIcon sx={{ fontSize: 19, color: '#fff' }} />
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
      </Box>

      <PlatformCard
        icon={FacebookIcon}
        name="Facebook"
        // Meta's own brand color: this row points at somewhere else, so it is
        // the one place the palette is not ours to choose.
        tint="#1877F2"
        permalink={facebook.unavailable ? null : facebook.permalink}
        linkLabel={t('viewOnFacebook')}
        statusLabel={updatedAgo ? `${t('updated')} ${updatedAgo}` : null}
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
        statusLabel={updatedAgo ? `${t('updated')} ${updatedAgo}` : null}
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
