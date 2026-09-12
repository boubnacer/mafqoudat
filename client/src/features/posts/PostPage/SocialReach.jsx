import { Box, Typography, useTheme, alpha } from "@mui/material";
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
 * Card treatment mirrors mobile SocialReach.js's SocialReachSection (Phase
 * 14): each platform is its own tinted block with its counts as surfaceRaised
 * chips inside, rather than the eyebrow + loose icon-and-text row this page
 * used before — two headings and two metric runs stacked on a flat surface
 * read as one undifferentiated block of text, so the fill is what tells
 * Facebook's numbers from Instagram's. The whole section (heading + both
 * platform blocks) is wrapped in one outlined card, at request, rather than
 * reading as three separate pieces stacked on the page.
 *
 * Colors only (web, this page): reskinned to a glowing "SaaS panel" look —
 * a violet-tinted glass card, a gradient icon badge and platform blocks/chips
 * tinted from each platform's own color instead of a flat neutral fill. Same
 * exception this file already documents for the Facebook/Instagram brand
 * colors: the header badge's violet-to-pink gradient is a one-off decorative
 * accent (built from theme.custom.color.brandPrimary, not a bare hex, so it
 * still tracks the brand in both modes) rather than a token, scoped to this
 * card only. No progress bars/percentages were added on the metric chips —
 * these counts (views, reactions...) have no natural maximum, and a bar
 * implies a proportion nobody measured (see "Data integrity" in CLAUDE.md).
 */

// One count, as a chip — up to six per platform, and unseparated they wrap
// into a paragraph of numbers nobody can scan.
const Metric = ({ icon: Icon, value, label, tint }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (value === null) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.625,
        px: 1.125,
        py: 0.625,
        borderRadius: '999px',
        backgroundColor: alpha(tint, isDark ? 0.16 : 0.08),
        border: `1px solid ${alpha(tint, isDark ? 0.35 : 0.22)}`,
      }}
    >
      <Icon sx={{ fontSize: 15, color: tint, flexShrink: 0 }} />
      <Typography variant="caption" sx={{ color: theme.custom.color.ink, fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: alpha(theme.custom.color.ink, 0.6) }}>
        {label}
      </Typography>
    </Box>
  );
};

const PlatformBlock = ({ icon: Icon, name, tint, permalink, linkLabel, children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        p: 1.5,
        borderRadius: `${theme.custom.radius.md}px`,
        backgroundColor: alpha(tint, isDark ? 0.10 : 0.05),
        border: `1px solid ${alpha(tint, isDark ? 0.3 : 0.18)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: alpha(tint, 0.16),
            boxShadow: `0 0 12px ${alpha(tint, isDark ? 0.45 : 0.3)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 16, color: tint }} />
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
              backgroundColor: alpha(theme.custom.color.brandPrimary, 0.14),
              border: `1px solid ${alpha(theme.custom.color.brandPrimary, 0.3)}`,
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{children}</Box>
    </Box>
  );
};

/**
 * Whether a platform has anything to show here.
 *
 * A copy that exists counts, even with no numbers on it yet: engagement is read
 * back on a schedule (server/services/socialStatsService.js), so a listing
 * published moments ago has a live page copy and nothing to say about it - and
 * that is exactly when its author arrives, from the "your listing is live on
 * our Facebook page" notification. Showing the platform and its permalink
 * answers them; showing nothing reads as if the listing was never shared. What
 * is still never rendered is a *count* nobody measured - every Metric below
 * drops itself when its value is null.
 */
const showsPlatform = (platform) => (
  platform.interactions !== null || platform.views !== null || !!platform.permalink
);

/**
 * Whether this section will render anything at all for a listing. Exported so
 * a caller can decide whether to mount it - SinglePostPage uses it to avoid
 * leaving an empty deep-link target behind for a listing whose copies never
 * went up.
 */
export const hasSocialReach = (post) => {
  const { facebook, instagram } = summarizeSocialStats(post);
  return showsPlatform(facebook) || showsPlatform(instagram);
};

const SocialReach = ({ post }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { facebook, instagram, hasStats } = summarizeSocialStats(post);
  const isDark = theme.palette.mode === 'dark';

  const showFacebook = showsPlatform(facebook);
  const showInstagram = showsPlatform(instagram);

  if (!showFacebook && !showInstagram) return null;

  const awaitingNumbers = !hasStats;
  const brand = theme.custom.color.brandPrimary;
  // radial-gradient has no logical-property equivalent, so the glow's start
  // corner is picked from theme.direction instead of a fixed 0% 0%.
  const glowOrigin = theme.direction === 'rtl' ? '100% 0%' : '0% 0%';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${theme.custom.radius.lg}px`,
        border: `1px solid ${alpha(brand, isDark ? 0.35 : 0.18)}`,
        backgroundColor: theme.custom.color.surfaceRaised,
        backgroundImage: `radial-gradient(120% 100% at ${glowOrigin}, ${alpha(brand, isDark ? 0.16 : 0.07)} 0%, transparent 55%)`,
        boxShadow: `${theme.custom.elevation.e2}, 0 0 32px ${alpha(brand, isDark ? 0.16 : 0.08)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundImage: `linear-gradient(135deg, ${brand}, #EC4899)`,
            boxShadow: `0 0 16px ${alpha(brand, 0.45)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ReachIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: theme.custom.color.ink, fontSize: { xs: '1rem', md: '1.1rem' } }}
          >
            {t('socialReach')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {t('socialReachNote')}
          </Typography>
          {awaitingNumbers && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {t('socialReachPending')}
            </Typography>
          )}
        </Box>
      </Box>

      {showFacebook && (
        <PlatformBlock
          icon={FacebookIcon}
          name="Facebook"
          // Meta's own brand colors: these rows point at somewhere else, so
          // they are the one place the palette is not ours to choose.
          tint="#1877F2"
          permalink={facebook.unavailable ? null : facebook.permalink}
          linkLabel={t('viewOnFacebook')}
        >
          <Metric icon={ViewsIcon} value={facebook.views} label={t('views')} tint="#1877F2" />
          <Metric icon={ReactionsIcon} value={facebook.reactions} label={t('reactions')} tint="#1877F2" />
          <Metric icon={CommentsIcon} value={facebook.comments} label={t('comments')} tint="#1877F2" />
          <Metric icon={SharesIcon} value={facebook.shares} label={t('shares')} tint="#1877F2" />
          <Metric icon={EngagedIcon} value={facebook.engagedUsers} label={t('engagedUsers')} tint="#1877F2" />
          <Metric icon={ClicksIcon} value={facebook.clicks} label={t('clicks')} tint="#1877F2" />
        </PlatformBlock>
      )}

      {showInstagram && (
        <PlatformBlock
          icon={InstagramIcon}
          name="Instagram"
          tint="#E1306C"
          permalink={instagram.unavailable ? null : instagram.permalink}
          linkLabel={t('viewOnInstagram')}
        >
          <Metric icon={ViewsIcon} value={instagram.views} label={t('views')} tint="#E1306C" />
          <Metric icon={LikesIcon} value={instagram.likes} label={t('likes')} tint="#E1306C" />
          <Metric icon={CommentsIcon} value={instagram.comments} label={t('comments')} tint="#E1306C" />
          <Metric icon={SavedIcon} value={instagram.saved} label={t('saved')} tint="#E1306C" />
        </PlatformBlock>
      )}
    </Box>
  );
};

export default SocialReach;
