import { useFormikContext } from "formik";
import {
  Box,
  FormLabel,
  Typography,
  Button,
  useTheme,
  alpha,
} from "@mui/material";
import { Edit as EditIcon } from '@mui/icons-material';
import Textfield from "../../../../components/Textfield";
import { useTranslation } from "../../../../utils/translations";
import RequiredMark from "./RequiredMark";

// Step 4 "Contact & review": contact field + a read-only, definition-list
// style summary of steps 1-3, each section with an Edit affordance that
// jumps back to that step. The submit button lives in the shell's footer
// (ReviewSubmitButton), not here - see S5.
const StepReview = ({
  flOptions,
  categories,
  countries,
  fieldErrors,
  clearFieldError,
  getFoundLostType,
  getCountryLabel,
  cityDisplayValue,
  imagePreview,
  onEditStep,
}) => {
  const { values } = useFormikContext();
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const accentColor = theme.custom.color.brandPrimary;

  const foundLostOption = flOptions.find((opt) => opt.id === values.foundLost);
  const foundLostLabel = foundLostOption
    ? (foundLostOption.labels?.[currentLanguage] || foundLostOption.label || foundLostOption.code)
    : '';

  const selectedCategoryIds = values.categories && Array.isArray(values.categories) && values.categories.length > 0
    ? values.categories
    : (values.category ? [values.category] : []);
  const categoryLabels = categories
    .filter((cat) => selectedCategoryIds.includes(cat.id || cat._id))
    .map((cat) => cat.labels?.[currentLanguage] || cat.label || cat.code)
    .join(', ');

  const selectedCountry = countries.find((c) => c._id === values.country) || null;
  const countryLabel = selectedCountry ? `${getCountryLabel(selectedCountry)} (${selectedCountry.code})` : '';

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <ReviewSection title={t('wizardStepItemTitle')} onEdit={() => onEditStep(0)}>
        <ReviewRow label={t('haveYouLostOrFoundSomething')} value={foundLostLabel} />
        <ReviewRow label={t('category')} value={categoryLabels || '-'} />
        {values.description && <ReviewRow label={t('description')} value={values.description} />}
      </ReviewSection>

      <ReviewSection title={t('wizardStepLocationTitle')} onEdit={() => onEditStep(1)}>
        <ReviewRow label={t('country')} value={countryLabel || '-'} />
        <ReviewRow label={t('city')} value={cityDisplayValue || '-'} />
        <ReviewRow label={t('exactLocation')} value={values.exactLocation} />
        {values.exactDate && <ReviewRow label={t('exactDateFound')} value={values.exactDate} />}
      </ReviewSection>

      <ReviewSection title={t('wizardStepPhotoTitle')} onEdit={() => onEditStep(2)}>
        {imagePreview ? (
          <Box
            component="img"
            src={imagePreview}
            alt="Item preview"
            sx={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('wizardReviewNoImage')}
          </Typography>
        )}
      </ReviewSection>

      {/* Contact Information Section */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: accentColor,
          fontSize: '1.4rem',
          mb: 1
        }}
      >
        {t('contactInformation')}
      </Typography>

      <Box>
        <FormLabel
          htmlFor="contact"
          sx={{
            mb: 1,
            display: "block",
            fontWeight: 600,
            fontSize: '1.15rem',
            color: theme.palette.text.primary
          }}
        >
          {t('phoneNumber')}<RequiredMark />
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
          {getFoundLostType(values.foundLost) === 'LOST'
            ? currentLanguage === 'ar'
              ? 'سنقوم بالتواصل معك عبر هذا الرقم في حالة العثور على عنصرك المفقود من قبل شخص آخر'
              : currentLanguage === 'fr'
                ? 'Nous vous contacterons via ce numéro si quelqu\'un trouve votre objet perdu'
                : 'We will contact you through this number if someone finds your lost item'
            : currentLanguage === 'ar'
              ? 'سنقوم بالتواصل معك عبر هذا الرقم في حالة تواصل مالك العنصر معنا'
              : currentLanguage === 'fr'
                ? 'Nous vous contacterons via ce numéro si le propriétaire de l\'objet nous contacte'
                : 'We will contact you through this number if the item owner contacts us'
          }
        </Typography>
        <Textfield
          name="contact"
          variant="outlined"
          placeholder={t('phoneNumberPlaceholder') || "Enter your phone number"}
          data-testid="contact"
          error={!!fieldErrors.contact}
          helperText={fieldErrors.contact}
          onErrorClear={clearFieldError}
        />
      </Box>
    </Box>
  );
};

const ReviewSection = ({ title, onEdit, children }) => {
  const theme = useTheme();
  const accentColor = theme.custom.color.brandPrimary;
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: `${theme.custom.radius.md}px`,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.02 : 0.015),
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: accentColor, fontSize: '1.1rem' }}
        >
          {title}
        </Typography>
        <Button
          size="small"
          onClick={onEdit}
          startIcon={<EditIcon fontSize="small" />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            fontWeight: 600,
            color: accentColor,
            '&:hover': {
              backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.1 : 0.08),
            },
          }}
        >
          {t('wizardEdit')}
        </Button>
      </Box>
      <Box
        component="dl"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' },
          rowGap: 0.75,
          columnGap: 2,
          m: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

const ReviewRow = ({ label, value }) => {
  const theme = useTheme();
  return (
    <>
      <Typography
        component="dt"
        variant="body2"
        sx={{ fontWeight: 600, color: theme.palette.text.secondary, m: 0 }}
      >
        {label}
      </Typography>
      <Typography
        component="dd"
        variant="body2"
        sx={{ color: theme.palette.text.primary, m: 0 }}
      >
        {value}
      </Typography>
    </>
  );
};

export default StepReview;
