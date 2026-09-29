import { Box, Typography, Tooltip, useTheme } from "@mui/material";
import {
  VisibilityOutlined as ViewsIcon,
  ThumbUpAltOutlined as InteractionsIcon,
} from "@mui/icons-material";
import { useTranslation } from "../utils/translations";
import { summarizeSocialStats, readSiteViews, readTotalViews } from "../utils/socialStats";

/**
 * How much attention a listing has had, in the space a card can spare: visits
 * to its page and social platforms, and the interactions its auto-posted copies
 * picked up on the Facebook Page / Instagram account (see utils/socialStats.js).
 *
 * Renders nothing when neither number is known, so listings that predate view
 * tracking look exactly as they did before.
 */
const ReachRow = ({ post, sx }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const totalViews = readTotalViews(post);
  const { interactions } = summarizeSocialStats(post);

  if (totalViews === null && interactions === null) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 1, ...sx }}>
      {totalViews !== null && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ViewsIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {t('postViews', { count: totalViews })}
          </Typography>
        </Box>
      )}
      {interactions !== null && (
        <Tooltip title={t('socialReach')}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <InteractionsIcon sx={{ fontSize: 15, color: theme.custom.color.brandPrimary }} />
            <Typography variant="caption" sx={{ color: theme.custom.color.brandPrimary, fontWeight: 600 }}>
              {t('socialInteractions', { count: interactions })}
            </Typography>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

export default ReachRow;
