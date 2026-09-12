import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import { NotificationsActiveOutlined, TaskAltOutlined } from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";

/**
 * Offers browser notifications, immediately before a listing is published.
 *
 * The moment is the argument: someone who has just written down what they lost
 * is, right then, a person who wants to be told when it turns up — which is
 * exactly what the alert does, and a far better case than a prompt fired at
 * an anonymous visitor on arrival.
 *
 * It is an explainer, not the permission prompt itself: the browser's own
 * prompt is fired by the Enable button, so a reader who wants nothing to do
 * with it never sees one. That order matters, because a denial is permanent —
 * no click can re-open a prompt the browser has recorded a "no" for — so
 * spending it on someone who has not been told what it is for is spending it
 * badly.
 *
 * Declining does not hold up the listing. The New Post flow waits for an
 * answer and then submits either way; anything else would make posting
 * impossible for browsers that cannot ask (iOS Safari outside an installed
 * app) or can no longer ask (a previous denial).
 *
 * Uses the surfaceRaised/radius.lg dialog surface and the brand disc the rest
 * of the app uses for a positive lead action — no new card language.
 */
const EnablePushDialog = ({ open, onEnable, onSkip, isWorking = false }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const points = [t('pushOfferPointMatch'), t('pushOfferPointClosed'), t('pushOfferPointOff')];

  return (
    <Dialog
      open={open}
      // No onClose: dismissing by backdrop or Escape would leave the listing in
      // limbo with nothing on screen explaining why. The two buttons are the
      // only ways out, and both continue to the post.
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${theme.custom.radius.lg}px`,
          backgroundColor: theme.custom.color.surfaceRaised,
          boxShadow: theme.custom.elevation.e3,
          backgroundImage: 'none',
        },
      }}
    >
      <DialogContent sx={{ pt: 3, pb: 1.5, textAlign: 'center' }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            marginInline: 'auto',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.custom.color.brandPrimary,
          }}
        >
          <NotificationsActiveOutlined
            sx={{ fontSize: 28, color: theme.palette.getContrastText(theme.custom.color.brandPrimary) }}
          />
        </Box>

        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: theme.custom.color.ink, fontSize: { xs: '1.05rem', sm: '1.15rem' } }}
        >
          {t('pushOfferTitle')}
        </Typography>

        <Typography sx={{ mt: 1, fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.6 }}>
          {t('pushOfferBody')}
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {points.map((point) => (
            <Box
              key={point}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                textAlign: 'start',
                px: 1,
              }}
            >
              <TaskAltOutlined
                sx={{ fontSize: 17, color: theme.custom.status.found.main, flexShrink: 0, mt: '2px' }}
              />
              <Typography sx={{ fontSize: '0.84rem', color: theme.custom.color.ink }}>
                {point}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3, pt: 1 }}>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          disabled={isWorking}
          onClick={onEnable}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: `${theme.custom.radius.md}px`,
            py: 1.1,
            // Stated explicitly: theme.palette.primary.main is white in light
            // mode (the legacy palette documented in CLAUDE.md), so a contained
            // button with no colour of its own is a white block on a white card.
            backgroundColor: theme.custom.color.brandPrimary,
            color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
            '&:hover': { backgroundColor: alpha(theme.custom.color.brandPrimary, 0.88) },
          }}
        >
          {t('pushOfferEnable')}
        </Button>
        <Button
          fullWidth
          disabled={isWorking}
          onClick={onSkip}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: `${theme.custom.radius.md}px`,
            color: theme.palette.text.secondary,
          }}
        >
          {t('pushOfferSkip')}
        </Button>
        <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mt: 0.5 }}>
          {t('pushOfferFootnote')}
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

export default EnablePushDialog;
