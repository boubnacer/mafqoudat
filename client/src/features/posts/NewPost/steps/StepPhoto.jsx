import { useFormikContext } from "formik";
import {
  Box,
  FormLabel,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Chip,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useTranslation } from "../../../../utils/translations";

// Step 3 "Photo" (optional). The 6-second-countdown warning dialog has been
// removed (S3) - the same privacy copy now renders as an always-visible
// inline notice above the upload area instead of blocking the flow.
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
  const accentColor = theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32';

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Image Section */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: accentColor,
          fontSize: '1.4rem',
          mb: 1,
          textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
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
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            fontWeight: 500
          }}
        >
          {t('imageOptionalMessage')}
        </Typography>

        {/* Privacy notice - always visible, never blocking (S3) */}
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            borderRadius: 2,
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 152, 0, 0.1)'
              : 'rgba(255, 152, 0, 0.05)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)'}`,
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'dark' ? '#ff9800' : '#f57c00',
            },
          }}
        >
          <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
            {t('imageWarningTitle')}
          </Typography>
          {getFoundLostType(values.foundLost) === 'FOUND' ? (
            <>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, mb: 1 }}>
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
        </Alert>

        {imagePreview ? (
          /* Preview - rounded card with an overlay remove button */
          <Box sx={{ position: 'relative', maxWidth: 320, mb: 2 }}>
            <Card
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: theme.shadows[4],
                border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
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
          /* Dropzone - clicking anywhere on the card opens the file picker */
          <Box
            onClick={handleImageButtonClick}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleImageButtonClick();
              }
            }}
            sx={{
              mb: 2,
              p: 4,
              textAlign: 'center',
              cursor: isCompressing ? 'default' : 'pointer',
              borderRadius: 3,
              border: `2px dashed ${theme.palette.divider}`,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': isCompressing ? {} : {
                borderColor: accentColor,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.06)' : 'rgba(46,125,50,0.04)',
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
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
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
    </Box>
  );
};

export default StepPhoto;
