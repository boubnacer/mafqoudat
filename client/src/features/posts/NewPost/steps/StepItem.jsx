import { useFormikContext } from "formik";
import {
  Box,
  FormLabel,
  Typography,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Checkbox,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { TaskAltOutlined, SearchOffOutlined, LockOutlined, Male, Female, PersonOutline } from "@mui/icons-material";
import CategoryPickerField from "../../../../components/CategoryPickerField";
import DocumentTypePickerField from "../../../../components/DocumentTypePickerField";
import { useTranslation } from "../../../../utils/translations";
import { isDocumentsListing, isPersonListing } from "../documentCategory";
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
  const personSelected = isPersonListing(categories, values);

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

      {personSelected && (
        <Box
          data-testid="personDetailsBlock"
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2.5,
            border: `1px solid ${alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.28 : 0.2)}`,
            backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.07 : 0.03),
            display: 'flex',
            flexDirection: 'column',
            gap: 2.25,
            transition: 'all 0.25s ease-in-out',
          }}
        >
          {/* Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
                color: theme.custom.color.brandPrimary,
                flexShrink: 0,
              }}
            >
              <PersonOutline />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  fontSize: '1.05rem',
                  lineHeight: 1.25,
                }}
              >
                {t('personSectionTitle')}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  display: 'block',
                  fontSize: '0.85rem',
                  mt: 0.25,
                }}
              >
                {t('personSectionHint')}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: alpha(theme.custom.color.brandPrimary, 0.12) }} />

          {/* Person Name Inputs */}
          <Box data-testid="personNameBlock">
            <FormLabel
              htmlFor="personNameAr"
              sx={{
                mb: 0.5,
                display: 'block',
                fontWeight: 600,
                fontSize: '1rem',
                color: theme.palette.text.primary,
              }}
            >
              {t('personNameSectionTitle')}
            </FormLabel>
            <Typography
              variant="caption"
              sx={{
                mb: 1.5,
                display: 'block',
                fontSize: '0.85rem',
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              {t('personNameSectionHint')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <TextField
                fullWidth
                id="personNameAr"
                data-testid="personNameAr"
                label={t('personNameArabic')}
                placeholder={t('personNameArabicPlaceholder')}
                value={values.personName?.ar || ''}
                onChange={(event) => {
                  setFieldValue('personName', {
                    ...(values.personName || {}),
                    ar: event.target.value,
                  });
                  clearFieldError('personName');
                }}
                error={!!fieldErrors.personName}
                inputProps={{ dir: 'rtl', maxLength: 100 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper,
                  },
                }}
              />
              <TextField
                fullWidth
                id="personNameLatin"
                data-testid="personNameLatin"
                label={t('personNameLatin')}
                placeholder={t('personNameLatinPlaceholder')}
                value={values.personName?.latin || ''}
                onChange={(event) => {
                  setFieldValue('personName', {
                    ...(values.personName || {}),
                    latin: event.target.value,
                  });
                  clearFieldError('personName');
                }}
                error={!!fieldErrors.personName}
                helperText={fieldErrors.personName || ''}
                inputProps={{ dir: 'ltr', maxLength: 100 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper,
                  },
                }}
              />
            </Box>
          </Box>

          {/* Sex (Male / Female) as Checkbox Options */}
          <Box sx={{ mt: 0.5 }}>
            <FormLabel
              sx={{
                mb: 1,
                display: 'block',
                fontWeight: 600,
                fontSize: '1rem',
                color: theme.palette.text.primary,
              }}
            >
              {t('personSex')}
            </FormLabel>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              {/* Male Option */}
              <Box
                role="checkbox"
                aria-checked={values.personSex === 'male'}
                tabIndex={0}
                data-testid="personSexMale"
                onClick={() => {
                  const nextVal = values.personSex === 'male' ? '' : 'male';
                  setFieldValue('personSex', nextVal);
                  clearFieldError('personSex');
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    const nextVal = values.personSex === 'male' ? '' : 'male';
                    setFieldValue('personSex', nextVal);
                    clearFieldError('personSex');
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: `2px solid ${
                    values.personSex === 'male'
                      ? theme.custom.color.brandPrimary
                      : alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.25 : 0.15)
                  }`,
                  backgroundColor: values.personSex === 'male'
                    ? alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.16 : 0.08)
                    : theme.palette.background.paper,
                  transition: 'all 0.2s ease-in-out',
                  userSelect: 'none',
                  '&:hover': {
                    borderColor: values.personSex === 'male'
                      ? theme.custom.color.brandPrimary
                      : alpha(theme.custom.color.brandPrimary, 0.5),
                    backgroundColor: values.personSex === 'male'
                      ? alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.22 : 0.12)
                      : alpha(theme.custom.color.brandPrimary, 0.04),
                  },
                }}
              >
                <Checkbox
                  checked={values.personSex === 'male'}
                  tabIndex={-1}
                  sx={{
                    p: 0.5,
                    color: alpha(theme.custom.color.ink, 0.4),
                    '&.Mui-checked': {
                      color: theme.custom.color.brandPrimary,
                    },
                  }}
                />
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: alpha('#1976D2', 0.12),
                    color: '#1976D2',
                  }}
                >
                  <Male fontSize="small" />
                </Box>
                <Typography
                  sx={{
                    fontWeight: values.personSex === 'male' ? 700 : 500,
                    color: values.personSex === 'male'
                      ? theme.custom.color.brandPrimary
                      : theme.palette.text.primary,
                    fontSize: '1rem',
                  }}
                >
                  {t('male')}
                </Typography>
              </Box>

              {/* Female Option */}
              <Box
                role="checkbox"
                aria-checked={values.personSex === 'female'}
                tabIndex={0}
                data-testid="personSexFemale"
                onClick={() => {
                  const nextVal = values.personSex === 'female' ? '' : 'female';
                  setFieldValue('personSex', nextVal);
                  clearFieldError('personSex');
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    const nextVal = values.personSex === 'female' ? '' : 'female';
                    setFieldValue('personSex', nextVal);
                    clearFieldError('personSex');
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: `2px solid ${
                    values.personSex === 'female'
                      ? theme.custom.color.brandPrimary
                      : alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.25 : 0.15)
                  }`,
                  backgroundColor: values.personSex === 'female'
                    ? alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.16 : 0.08)
                    : theme.palette.background.paper,
                  transition: 'all 0.2s ease-in-out',
                  userSelect: 'none',
                  '&:hover': {
                    borderColor: values.personSex === 'female'
                      ? theme.custom.color.brandPrimary
                      : alpha(theme.custom.color.brandPrimary, 0.5),
                    backgroundColor: values.personSex === 'female'
                      ? alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.22 : 0.12)
                      : alpha(theme.custom.color.brandPrimary, 0.04),
                  },
                }}
              >
                <Checkbox
                  checked={values.personSex === 'female'}
                  tabIndex={-1}
                  sx={{
                    p: 0.5,
                    color: alpha(theme.custom.color.ink, 0.4),
                    '&.Mui-checked': {
                      color: theme.custom.color.brandPrimary,
                    },
                  }}
                />
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: alpha('#E91E63', 0.12),
                    color: '#E91E63',
                  }}
                >
                  <Female fontSize="small" />
                </Box>
                <Typography
                  sx={{
                    fontWeight: values.personSex === 'female' ? 700 : 500,
                    color: values.personSex === 'female'
                      ? theme.custom.color.brandPrimary
                      : theme.palette.text.primary,
                    fontSize: '1rem',
                  }}
                >
                  {t('female')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default StepItem;
