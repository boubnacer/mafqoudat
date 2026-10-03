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
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  FaceRetouchingOffOutlined as FaceRedactedIcon,
  LockOutlined,
} from '@mui/icons-material';
import { useTranslation } from "../../../../utils/translations";

const WARNING_COUNTDOWN_SECONDS = 6;

// Step 3 "Photo" (optional). Clicking the empty dropzone opens a privacy
// warning dialog gated behind a 6-second countdown - the "Continue" action
// only enables once the countdown reaches zero - before it hands off to the
// existing file-picker flow (handleImageButtonClick/fileInputRef).
// Arabic distinguishes a dual from a plural, so the count picks between three
// strings rather than being interpolated into one - en/fr repeat their plural.
const faceCountKey = (count) => {
  if (count === 1) return 'faceBlurFoundOne';
  if (count === 2) return 'faceBlurFoundTwo';
  return 'faceBlurFoundMany';
};

const StepPhoto = ({
  getFoundLostType,
  // Set when the listing also carries DOCUMENTS: the photo is of the other
  // thing (the wallet, the bag), and the papers have to stay out of the frame.
  documentsMode,
  photoSubjectLabels,
  imagePreview,
  selectedFileName,
  compressionInfo,
  isCompressing,
  isScanningFaces,
  faceRedaction,
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

  // Found means the item is in the reporter's hands right now, so the camera
  // opens directly - that's what proves they actually have it. Lost means
  // they no longer have the item, so this can only ever be a photo they
  // already had - the ordinary gallery/file picker.
  const isFoundItem = getFoundLostType(values.foundLost) === 'FOUND';

  // The lead clause ("Photograph only the bag") is bolded so the one
  // instruction that actually matters here doesn't read as one more line of
  // fine print; the rest (why, and how to cover the documents) stays regular
  // weight. Split on the em dash both translations use to separate the two.
  const documentsMixedNoticeText = photoSubjectLabels?.length
    ? t('photoDocumentsMixedNotice', {
        categories: photoSubjectLabels.join(currentLanguage === 'ar' ? '، ' : ', '),
      })
    : t('photoDocumentsMixedNoticeGeneric');
  const documentsMixedNoticeDashIndex = documentsMixedNoticeText.indexOf('—');
  const documentsMixedNoticeLead = documentsMixedNoticeDashIndex >= 0
    ? documentsMixedNoticeText.slice(0, documentsMixedNoticeDashIndex).trimEnd()
    : documentsMixedNoticeText;
  const documentsMixedNoticeRest = documentsMixedNoticeDashIndex >= 0
    ? documentsMixedNoticeText.slice(documentsMixedNoticeDashIndex)
    : '';

  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!showWarningDialog || documentsMode) return undefined;

    setCountdown(WARNING_COUNTDOWN_SECONDS);
    const intervalId = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [showWarningDialog, documentsMode]);

  const handleDropzoneClick = () => {
    if (isCompressing || isScanningFaces) return;
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
          {t('uploadPhotoLabel')}
        </FormLabel>


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
              cursor: isCompressing || isScanningFaces ? 'default' : 'pointer',
              borderRadius: 3,
              border: `2px dashed ${theme.palette.divider}`,
              backgroundColor: alpha(theme.custom.color.ink, 0.02),
              transition: 'all 0.2s ease-in-out',
              '&:hover': isCompressing || isScanningFaces ? {} : {
                borderColor: accentColor,
                backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.08 : 0.05),
              },
            }}
          >
            {isCompressing || isScanningFaces ? (
              <CircularProgress size={32} sx={{ color: accentColor }} />
            ) : isFoundItem ? (
              <PhotoCameraIcon sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
            ) : (
              <CloudUploadIcon sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
            )}
            <Typography sx={{ fontWeight: 600, mt: 1, color: theme.palette.text.primary }}>
              {isCompressing
                ? t('compressingImage')
                : isScanningFaces
                  ? t('faceBlurScanning')
                  : t(isFoundItem ? 'chooseFileFound' : 'chooseFile')}
            </Typography>
            {!isCompressing && !isScanningFaces && (
              <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, mt: 0.5 }}>
                {t(isFoundItem ? 'wizardDropzoneHintFound' : 'wizardDropzoneHint')}
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
          // FOUND: force the camera open directly (the reporter has the item
          // in hand right now, so proof is a fresh photo, not a pick from an
          // old gallery). LOST: no capture attribute, so this stays the
          // ordinary picker - the reporter no longer has the item, so any
          // photo has to already exist somewhere on their device.
          capture={isFoundItem ? 'environment' : undefined}
          hidden
          onChange={handleImageSelect}
        />

        {/* Eye redaction notice. When faces are detected, eyes are automatically
            covered for privacy without user toggle. */}
        {faceRedaction && (
          <Box
            sx={{
              mt: 1,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              px: 2,
              py: 1.75,
              borderRadius: `${theme.custom.radius.md}px`,
              backgroundColor: alpha(accentColor, theme.palette.mode === 'dark' ? 0.16 : 0.08),
              transition: 'background-color 0.2s ease-in-out',
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(accentColor, 0.18),
                color: accentColor,
              }}
            >
              <FaceRedactedIcon fontSize="small" />
            </Box>

            <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                {t(faceCountKey(faceRedaction.count), { count: faceRedaction.count })}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 0.25, color: theme.palette.text.secondary }}
              >
                {t('faceBlurOnHint')}
              </Typography>
            </Box>
          </Box>
        )}

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
            aria-label={t('close')}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {documentsMode ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.16 : 0.08),
                border: `1px solid ${alpha(theme.custom.color.brandPrimary, 0.2)}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
              }}
            >
              <LockOutlined sx={{ color: theme.custom.color.brandPrimary, mt: 0.25, flexShrink: 0 }} />
              <Typography variant="body1" sx={{ color: theme.palette.text.primary, lineHeight: 1.6 }}>
                <Box component="span" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                  {documentsMixedNoticeLead}
                </Box>
                {documentsMixedNoticeRest && (
                  <Box component="span" sx={{ fontWeight: 400, color: theme.palette.text.secondary }}>
                    {` ${documentsMixedNoticeRest}`}
                  </Box>
                )}
              </Typography>
            </Box>
          ) : getFoundLostType(values.foundLost) === 'FOUND' ? (
            <>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, mb: 1.5 }}>
                {t('imageWarningDescriptionFound')}
              </Typography>
              <Box
                component="ul"
                sx={{
                  paddingInlineStart: 2.5,
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
            disabled={!documentsMode && countdown > 0}
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
            {!documentsMode && countdown > 0
              ? t('imageWarningProceedCountdown', { seconds: countdown })
              : t('imageWarningProceed')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StepPhoto;
