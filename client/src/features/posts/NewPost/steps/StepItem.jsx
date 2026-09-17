import { useFormikContext } from "formik";
import {
  Box,
  FormLabel,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  TextField,
  useTheme,
  alpha,
} from "@mui/material";
import { TaskAltOutlined, SearchOffOutlined, LockOutlined } from "@mui/icons-material";
import Textfield from "../../../../components/Textfield";
import CategoryPickerField from "../../../../components/CategoryPickerField";
import DocumentTypePickerField from "../../../../components/DocumentTypePickerField";
import { useTranslation } from "../../../../utils/translations";
import { isDocumentsListing } from "../documentCategory";
import RequiredMark from "./RequiredMark";

// Labeling helper mirrors the one SelectOption used internally, so the
// displayed text is identical to before the toggle replaced it.
const getFlOptionLabel = (option, currentLanguage) => {
  if (option.labels && option.labels[currentLanguage]) {
    return option.labels[currentLanguage];
  }
  return option.label || option.code;
};

// Step 1 "What happened": foundLost, categories, description
const StepItem = ({ flOptions, categories, fieldErrors, clearFieldError, getFoundLostType }) => {
  const { values, setFieldValue } = useFormikContext();
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();

  // Documents are the one category that changes what this step asks for: no
  // photo later on, and the document's own title here instead.
  const documentsSelected = isDocumentsListing(categories, values);

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Basic Information Section */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: theme.custom.color.brandPrimary,
          fontSize: '1.4rem',
          mb: 1
        }}
      >
        {t('basicInformation')}
      </Typography>

      <Box>
        <FormLabel
          htmlFor="foundLost"
          sx={{
            mb: 1,
            display: "block",
            fontWeight: 600,
            fontSize: '1.15rem',
            color: theme.palette.text.primary
          }}
        >
          {t('haveYouLostOrFoundSomething')}<RequiredMark />
        </FormLabel>
        <FormControl fullWidth error={!!fieldErrors.foundLost}>
          <Select
            value={values.foundLost || ''}
            onChange={(event) => {
              setFieldValue('foundLost', event.target.value);
              clearFieldError('foundLost');
            }}
            displayEmpty
            data-testid="foundLost"
            renderValue={(selected) => {
              const option = flOptions.find((opt) => opt.id === selected);
              if (!option) {
                return (
                  <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                    {t('haveYouLostOrFoundSomething')}
                  </Typography>
                );
              }
              const isLost = option.code === 'LOST';
              const tone = isLost ? theme.custom.status.lost : theme.custom.status.found;
              const Icon = isLost ? SearchOffOutlined : TaskAltOutlined;
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: tone.main, fontWeight: 700 }}>
                  <Icon fontSize="small" />
                  {getFlOptionLabel(option, currentLanguage)}
                </Box>
              );
            }}
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: fieldErrors.foundLost
                  ? theme.palette.error.main
                  : alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.3 : 0.2),
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: fieldErrors.foundLost
                  ? theme.palette.error.main
                  : alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.5 : 0.4),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.custom.color.brandPrimary,
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: { borderRadius: 2, mt: 0.5 },
              },
            }}
          >
            {flOptions.map((option) => {
              const isLost = option.code === 'LOST';
              const tone = isLost ? theme.custom.status.lost : theme.custom.status.found;
              const Icon = isLost ? SearchOffOutlined : TaskAltOutlined;
              return (
                <MenuItem
                  key={option.id}
                  value={option.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 600,
                    py: 1.25,
                    color: theme.palette.text.primary,
                    '&.Mui-selected': {
                      backgroundColor: tone.bg,
                      color: tone.main,
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: tone.bg,
                    },
                  }}
                >
                  <Icon fontSize="small" sx={{ color: tone.main }} />
                  {getFlOptionLabel(option, currentLanguage)}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        {fieldErrors.foundLost && (
          <Typography
            variant="caption"
            sx={{ mt: 1, display: 'block', color: theme.palette.error.main, fontWeight: 500 }}
          >
            {fieldErrors.foundLost}
          </Typography>
        )}
      </Box>

      <Box>
        <FormLabel
          htmlFor="categories"
          sx={{
            mb: 1,
            display: "block",
            fontWeight: 600,
            fontSize: '1.15rem',
            color: theme.palette.text.primary
          }}
        >
          {getFoundLostType(values.foundLost) === 'LOST'
            ? t('specifyItemTypeLost')
            : t('specifyItemTypeFound')
          }<RequiredMark />
        </FormLabel>
        <CategoryPickerField
          categories={categories}
          value={values.categories && Array.isArray(values.categories) && values.categories.length > 0
            ? values.categories
            : (values.category ? [values.category] : [])
          }
          onChange={(categoryIds) => {
            setFieldValue('categories', categoryIds);
            // Also set legacy category field for backward compatibility
            if (categoryIds.length > 0) {
              setFieldValue('category', categoryIds[0]);
            } else {
              setFieldValue('category', '');
            }
            clearFieldError('category');
          }}
          error={!!fieldErrors.category}
          errorText={fieldErrors.category}
          dataTestId="category"
        />
      </Box>

      {documentsSelected && (
        <Box data-testid="documentTypesBlock">
          {/* Why there is no photo on these listings, said once, where the
              reader is making the choice that replaces it. */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.16 : 0.08),
            }}
          >
            <LockOutlined fontSize="small" sx={{ color: theme.custom.color.brandPrimary, mt: 0.25 }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              {t('documentPrivacyNotice')}
            </Typography>
          </Box>

          <FormLabel
            htmlFor="documentTypes"
            sx={{
              mb: 1,
              display: "block",
              fontWeight: 600,
              fontSize: '1.15rem',
              color: theme.palette.text.primary
            }}
          >
            {t('documentTitleFieldLabel')}<RequiredMark />
          </FormLabel>
          <DocumentTypePickerField
            value={values.documentTypes || []}
            onChange={(documentTypeIds) => {
              setFieldValue('documentTypes', documentTypeIds);
              clearFieldError('documentTypes');
            }}
            error={!!fieldErrors.documentTypes}
            errorText={fieldErrors.documentTypes}
            dataTestId="documentTypes"
          />

          {/* The name on the paper. With no photo published, this is the
              field that lets an owner recognise their own document in a list
              of otherwise identical "national identity card" listings - and
              the field a searcher types their own name into. Both scripts,
              because Moroccan papers carry both and a reader may know only
              one of them. */}
          <Box sx={{ mt: 3 }} data-testid="documentOwnerNameBlock">
            <FormLabel
              htmlFor="documentOwnerNameAr"
              sx={{
                mb: 1,
                display: "block",
                fontWeight: 600,
                fontSize: '1.15rem',
                color: theme.palette.text.primary
              }}
            >
              {t('documentOwnerSectionTitle')}<RequiredMark />
            </FormLabel>
            <Typography
              variant="caption"
              sx={{
                mb: 1.5,
                display: "block",
                fontSize: '1rem',
                color: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.7 : 0.6),
                fontWeight: 500
              }}
            >
              {t('documentOwnerSectionHint')}
            </Typography>

            <TextField
              fullWidth
              id="documentOwnerNameAr"
              data-testid="documentOwnerName"
              label={t('documentOwnerNameArabic')}
              placeholder={t('documentOwnerNameArabicPlaceholder')}
              value={values.documentOwnerName?.ar || ''}
              onChange={(event) => {
                setFieldValue('documentOwnerName', {
                  ...(values.documentOwnerName || {}),
                  ar: event.target.value,
                });
                clearFieldError('documentOwnerName');
              }}
              error={!!fieldErrors.documentOwnerName}
              inputProps={{ dir: 'rtl', maxLength: 100 }}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              id="documentOwnerNameLatin"
              label={t('documentOwnerNameLatin')}
              placeholder={t('documentOwnerNameLatinPlaceholder')}
              value={values.documentOwnerName?.latin || ''}
              onChange={(event) => {
                setFieldValue('documentOwnerName', {
                  ...(values.documentOwnerName || {}),
                  latin: event.target.value,
                });
                clearFieldError('documentOwnerName');
              }}
              error={!!fieldErrors.documentOwnerName}
              helperText={fieldErrors.documentOwnerName || ''}
              inputProps={{ dir: 'ltr', maxLength: 100 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </Box>
      )}

      {/* Item Details Section */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: theme.custom.color.brandPrimary,
          fontSize: '1.4rem',
          mb: 1
        }}
      >
        {t('itemDetails')}
      </Typography>

      <Box>
        <FormLabel
          htmlFor="description"
          sx={{
            mb: 1,
            display: "block",
            fontWeight: 600,
            fontSize: '1.15rem',
            color: theme.palette.text.primary
          }}
        >
          {t('description')} ({t('optional')})
        </FormLabel>

        {/* Sensitive Information Warning */}
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
            '& .MuiAlert-message': {
              color: theme.palette.text.primary,
              fontSize: '0.9rem',
              fontWeight: 500,
            }
          }}
        >
          {t('descriptionSensitiveInfoWarning')}
        </Alert>

        <Textfield
          name="description"
          variant="outlined"
          multiline
          rows={4}
          placeholder={getFoundLostType(values.foundLost) === 'LOST'
            ? t('descriptionPlaceholderLost')
            : t('descriptionPlaceholderFound')
          }
          data-testid="description"
        />
      </Box>
    </Box>
  );
};

export default StepItem;
