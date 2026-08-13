import { Box, Typography, Link, useTheme } from "@mui/material";
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  VisibilityOutlined as ViewsIcon,
  ThumbUpAltOutlined as ReactionsIcon,
  FavoriteBorder as LikesIcon,
  ChatBubbleOutline as CommentsIcon,
  ShareOutlined as SharesIcon,
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
 * Uses the eyebrow + icon-and-text vocabulary the rest of the page already
 * speaks; no new card treatment.
 */

const Metric = ({ icon: Icon, value, label }) => {
  if (value === null) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      <Icon sx={{ fontSize: 15, color: 'text.secondary', flexShrink: 0 }} />
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {value} {label}
      </Typography>
    </Box>
  );
};

const PlatformRow = ({ icon: Icon, name, tint, permalink, linkLabel, children }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 1.5, rowGap: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <Icon sx={{ fontSize: 18, color: tint }} />
        <Typography variant="body2" sx={{ color: theme.custom.color.ink, fontWeight: 700 }}>
          {name}
        </Typography>
      </Box>
      {children}
      {permalink && (
        <Link
          href={permalink}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.375,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: theme.custom.color.brandPrimary,
            marginInlineStart: 'auto',
          }}
        >
          {linkLabel}
          <OpenIcon sx={{ fontSize: 13 }} />
        </Link>
      )}
    </Box>
  );
};

const SocialReach = ({ post }) => {
  const { t } = useTranslation();
  const { facebook, instagram, hasStats } = summarizeSocialStats(post);

  // Nothing has been read back yet - say nothing rather than render a row of
  // zeros that reads as "this listing is being ignored".
  if (!hasStats) return null;

  const showFacebook = facebook.interactions !== null || facebook.views !== null;
  const showInstagram = instagram.interactions !== null || instagram.views !== null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box>
        <Typography
          variant="overline"
          sx={{ fontWeight: 600, letterSpacing: 1, color: 'text.secondary', display: 'block', lineHeight: 1.6 }}
        >
          {t('socialReach')}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('socialReachNote')}
        </Typography>
      </Box>

      {showFacebook && (
        <PlatformRow
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
        </PlatformRow>
      )}

      {showInstagram && (
        <PlatformRow
          icon={InstagramIcon}
          name="Instagram"
          tint="#E1306C"
          permalink={instagram.unavailable ? null : instagram.permalink}
          linkLabel={t('viewOnInstagram')}
        >
          <Metric icon={ViewsIcon} value={instagram.views} label={t('views')} />
          <Metric icon={LikesIcon} value={instagram.likes} label={t('likes')} />
          <Metric icon={CommentsIcon} value={instagram.comments} label={t('comments')} />
        </PlatformRow>
      )}
    </Box>
  );
};

export default SocialReach;
