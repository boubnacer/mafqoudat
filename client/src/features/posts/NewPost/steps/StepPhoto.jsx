import { useEffect, useState } from "react";
import { useFormikContext } from "formik";
import {
  Box,
  FormLabel,
  Typography,
  CircularProgress,
  Card,
  CardMedia,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from "../../../../utils/translations";

const WARNING_COUNTDOWN_SECONDS = 6;

// Step 3 "Photo" (optional). Clicking the empty dropzone opens a privacy
// warning dialog gated behind a 6-second countdown - the "Continue" action
// only enables once the countdown reaches zero - before it hands off to the
// existing file-picker flow (handleImageButtonClick/fileInputRef).
const StepPhoto = ({
  getFoundLostType,
  imagePreview,
  selectedFileName,
  compressionInfo,
  isCompressing,
  fileInputRef,
  handleImageButtonClick,
  handleImageSelect,
  handleImageRemove,
  handleImageDialogOpen,
}) => {
  const { values } = useFormikContext();
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const accentColor = theme.custom.color.brandPrimary;

  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!showWarningDialog) return undefined;

    setCountdown(WARNING_COUNTDOWN_SECONDS);
    const intervalId = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [showWarningDialog]);

  const handleDropzoneClick = () => {
    if (isCompressing) return;
    setShowWarningDialog(true);
  };

  const handleWarningDialogClose = () => {
    setShowWarningDialog(false);
  };

  const handleWarningDialogConfirm = () => {
    setShowWarningDialog(false);
    handleImageButtonClick();
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Image Section */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: accentColor,
          fontSize: '1.4rem',
          mb: 1
        }}
      >
        {t('itemImage')}
      </Typography>

      <Box>
        <FormLabel
          htmlFor="image"
          sx={{
            mb: 1,
            display: "block",
            fontWeight: 600,
            fontSize: '1.15rem',
            color: theme.palette.text.primary
          }}
        >
          {t('itemImage')} ({t('optional')})
        </FormLabel>
        <Typography
          variant="caption"
          sx={{
            mb: 1,
            display: "block",
            fontSize: '1rem',
            color: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.7 : 0.6),
            fontWeight: 500
          }}
        >
          {t('imageOptionalMessage')}
        </Typography>

        {imagePreview ? (
          /* Preview - rounded card with an overlay remove button */
          <Box sx={{ position: 'relative', maxWidth: 320, mb: 2 }}>
            <Card
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: theme.shadows[4],
                border: `2px solid ${alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.1 : 0.1)}`,
              }}
            >
              <CardMedia
                component="img"
                height="220"
                image={imagePreview}
                alt="Selected item image"
                sx={{ objectFit: 'cover', cursor: 'pointer' }}
                onClick={handleImageDialogOpen}
              />
            </Card>
            <IconButton
              onClick={handleImageRemove}
              aria-label={t('close')}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                insetInlineEnd: 8,
                backgroundColor: 'rgba(0,0,0,0.55)',
                color: '#fff',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            {compressionInfo && (
              <Chip
                label={`${compressionInfo.compressedSize}MB`}
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  insetInlineStart: 8,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
        ) : (
          /* Dropzone - clicking anywhere on the card opens the privacy warning dialog first */
          <Box
            onClick={handleDropzoneClick}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleDropzoneClick();
              }
            }}
            sx={{
              mb: 2,
              p: 4,
              textAlign: 'center',
              cursor: isCompressing ? 'default' : 'pointer',
              borderRadius: 3,
              border: `2px dashed ${theme.palette.divider}`,
              backgroundColor: alpha(theme.custom.color.ink, 0.02),
              transition: 'all 0.2s ease-in-out',
              '&:hover': isCompressing ? {} : {
                borderColor: accentColor,
                backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.08 : 0.05),
              },
            }}
          >
            {isCompressing ? (
              <CircularProgress size={32} sx={{ color: accentColor }} />
            ) : (
              <CloudUploadIcon sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
            )}
            <Typography sx={{ fontWeight: 600, mt: 1, color: theme.palette.text.primary }}>
              {isCompressing ? t('compressingImage') : t('chooseFile')}
            </Typography>
            {!isCompressing && (
              <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, mt: 0.5 }}>
                {t('wizardDropzoneHint')}
              </Typography>
            )}
          </Box>
        )}

        <input
          ref={fileInputRef}
          id="image"
          name="image"
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageSelect}
        />

        {selectedFileName && (
          <Typography
            variant="body2"
            sx={{
              color: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.8 : 0.7),
              fontWeight: 500
            }}
          >
            {selectedFileName}
          </Typography>
        )}

        {compressionInfo && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 1,
              color: accentColor,
              fontWeight: 500
            }}
          >
            {t('compressionSuccess')}
          </Typography>
        )}
      </Box>

      {/* Mandatory privacy warning - gated behind a 6-second countdown before Continue enables */}
      <Dialog
        open={showWarningDialog}
        onClose={handleWarningDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: theme.custom.color.surfaceRaised,
            boxShadow: theme.shadows[12],
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            {t('imageWarningTitle')}
          </Typography>
          <IconButton
            onClick={handleWarningDialogClose}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {getFoundLostType(values.foundLost) === 'FOUND' ? (
            <>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, mb: 1.5 }}>
                {t('imageWarningDescriptionFound')}
              </Typography>
              <Box
                component="ul"
                sx={{
                  pl: 2.5,
                  m: 0,
                  display: 'grid',
                  gap: 0.75,
                  color: theme.palette.text.secondary
                }}
              >
                <Typography component="li" variant="body2">
                  {t('imageWarningBulletProtectDetails')}
                </Typography>
                <Typography component="li" variant="body2">
                  {t('imageWarningBulletUseNeutralBackground')}
                </Typography>
              </Box>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
              {t('imageWarningDescriptionLost')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleWarningDialogClose}
            sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={countdown > 0}
            onClick={handleWarningDialogConfirm}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              backgroundColor: accentColor,
              color: `${theme.palette.getContrastText(accentColor)} !important`,
              '&:hover': { backgroundColor: accentColor },
            }}
          >
            {countdown > 0
              ? t('imageWarningProceedCountdown', { seconds: countdown })
              : t('imageWarningProceed')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StepPhoto;
