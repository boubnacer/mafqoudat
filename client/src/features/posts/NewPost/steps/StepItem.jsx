import { useFormikContext } from "formik";
import {
  Box,
  FormLabel,
  Typography,
  TextField,
  Chip,
  Autocomplete,
  Alert,
  useTheme,
} from "@mui/material";
import Textfield from "../../../../components/Textfield";
import SelectOption from "../../../../components/SelectOption";
import { useTranslation } from "../../../../utils/translations";
import { getCategoryColor, getCategoryBackgroundColor } from "../../../../config/categories";
import RequiredMark from "./RequiredMark";

// Step 1 "What happened": foundLost, categories, description
const StepItem = ({ flOptions, categories, fieldErrors, clearFieldError, getFoundLostType }) => {
  const { values, setFieldValue } = useFormikContext();
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Basic Information Section */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
          fontSize: '1.4rem',
          mb: 1,
          textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
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
        <SelectOption
          name="foundLost"
          options={flOptions}
          data-testid="foundLost"
          error={!!fieldErrors.foundLost}
          helperText={fieldErrors.foundLost}
          onErrorClear={clearFieldError}
        />
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
          {currentLanguage === 'ar'
            ? 'يمكنك اختيار عدة فئات (مثال: محفظة، أوراق، بطاقة هوية)'
            : currentLanguage === 'fr'
              ? 'Vous pouvez sélectionner plusieurs catégories (ex: portefeuille, papiers, carte d\'identité)'
              : 'You can select multiple categories (e.g., wallet, papers, ID card)'
          }
        </Typography>
        <Autocomplete
          multiple
          options={categories || []}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              // If option is just an ID string, find the category object
              const cat = categories.find(c => c.id === option || c._id === option);
              if (cat) {
                return cat.labels?.[currentLanguage] || cat.label || cat.code || option;
              }
              return option;
            }
            return option.labels?.[currentLanguage] || option.label || option.code || '';
          }}
          value={values.categories && Array.isArray(values.categories) && values.categories.length > 0
            ? categories.filter(cat => values.categories.includes(cat.id || cat._id))
            : (values.category ? categories.filter(cat => (cat.id || cat._id) === values.category) : [])
          }
          onChange={(event, newValue) => {
            const categoryIds = newValue.map(cat => cat.id || cat._id);
            setFieldValue('categories', categoryIds);
            // Also set legacy category field for backward compatibility
            if (categoryIds.length > 0) {
              setFieldValue('category', categoryIds[0]);
            } else {
              setFieldValue('category', '');
            }
            clearFieldError('category');
          }}
          isOptionEqualToValue={(option, value) => {
            const optionId = option.id || option._id;
            const valueId = value.id || value._id;
            return optionId === valueId;
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              placeholder={currentLanguage === 'ar'
                ? 'اختر الفئات...'
                : currentLanguage === 'fr'
                  ? 'Sélectionner les catégories...'
                  : 'Select categories...'
              }
              data-testid="category"
              error={!!fieldErrors.category}
              helperText={fieldErrors.category || (currentLanguage === 'ar'
                ? 'يمكنك اختيار أكثر من فئة واحدة'
                : currentLanguage === 'fr'
                  ? 'Vous pouvez sélectionner plusieurs catégories'
                  : 'You can select multiple categories'
              )}
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                  },
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  },
                },
              }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              const categoryName = option.labels?.[currentLanguage] || option.label || option.code || '';
              // Use the category's own color if the data has a code for it;
              // otherwise fall back to the wizard's default green accent.
              const chipColor = option.code
                ? getCategoryColor(option.code)
                : (theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32');
              const chipBackground = option.code
                ? getCategoryBackgroundColor(option.code)
                : (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)');
              return (
                <Chip
                  key={key}
                  label={categoryName}
                  {...tagProps}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? `${chipColor}33` : chipBackground,
                    color: chipColor,
                    border: `1px solid ${chipColor}`,
                    '& .MuiChip-deleteIcon': {
                      color: chipColor,
                    },
                  }}
                />
              );
            })
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* Item Details Section */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
          fontSize: '1.4rem',
          mb: 1,
          textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
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
          {getFoundLostType(values.foundLost) === 'LOST'
            ? (t('descriptionOptionalLostMessage') || "Description is optional but recommended when you don't have an image of the lost item.")
            : (t('descriptionOptionalFoundMessage') || "Description is optional. You can add an image instead, or provide both for better identification.")
          }
        </Typography>

        {/* Sensitive Information Warning - Only show for Found items */}
        {getFoundLostType(values.foundLost) === 'FOUND' && (
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
        )}

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
