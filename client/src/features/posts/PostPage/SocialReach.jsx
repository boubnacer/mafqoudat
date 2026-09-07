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
 * Facebook's numbers from Instagram's.
 */

// One count, as a chip — up to six per platform, and unseparated they wrap
// into a paragraph of numbers nobody can scan.
const Metric = ({ icon: Icon, value, label }) => {
  const theme = useTheme();
  if (value === null) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.625,
        px: 1.125,
        py: 0.625,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: theme.custom.color.surfaceRaised,
      }}
    >
      <Icon sx={{ fontSize: 15, color: alpha(theme.custom.color.ink, 0.6), flexShrink: 0 }} />
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
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        p: 1.5,
        borderRadius: `${theme.custom.radius.md}px`,
        backgroundColor: alpha(theme.custom.color.ink, 0.04),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: alpha(tint, 0.12),
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{children}</Box>
    </Box>
  );
};

const SocialReach = ({ post }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { facebook, instagram, hasStats } = summarizeSocialStats(post);

  // Nothing has been read back yet - say nothing rather than render a row of
  // zeros that reads as "this listing is being ignored".
  if (!hasStats) return null;

  const showFacebook = facebook.interactions !== null || facebook.views !== null;
  const showInstagram = instagram.interactions !== null || instagram.views !== null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReachIcon sx={{ fontSize: 20, color: theme.custom.color.ink }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: theme.custom.color.ink, fontSize: { xs: '1rem', md: '1.1rem' } }}
          >
            {t('socialReach')}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('socialReachNote')}
        </Typography>
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
          <Metric icon={ViewsIcon} value={facebook.views} label={t('views')} />
          <Metric icon={ReactionsIcon} value={facebook.reactions} label={t('reactions')} />
          <Metric icon={CommentsIcon} value={facebook.comments} label={t('comments')} />
          <Metric icon={SharesIcon} value={facebook.shares} label={t('shares')} />
          <Metric icon={EngagedIcon} value={facebook.engagedUsers} label={t('engagedUsers')} />
          <Metric icon={ClicksIcon} value={facebook.clicks} label={t('clicks')} />
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
          <Metric icon={ViewsIcon} value={instagram.views} label={t('views')} />
          <Metric icon={LikesIcon} value={instagram.likes} label={t('likes')} />
          <Metric icon={CommentsIcon} value={instagram.comments} label={t('comments')} />
          <Metric icon={SavedIcon} value={instagram.saved} label={t('saved')} />
        </PlatformBlock>
      )}
    </Box>
  );
};

export default SocialReach;
