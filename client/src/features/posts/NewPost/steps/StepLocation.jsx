import { useFormikContext } from "formik";
import {
  Box,
  FormLabel,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Divider,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { LocationOn, Add as AddIcon } from '@mui/icons-material';
import Textfield from "../../../../components/Textfield";
import { useTranslation } from "../../../../utils/translations";
import { getCityDisplayName } from "../cityDisplay";
import RequiredMark from "./RequiredMark";

// Step 2 "Where & when": country, city (dropdown + search + Add New City
// trigger), exactLocation, exactDate. City search/dialog state is owned by
// the shell (NewPostForm.js) and passed down as props (C3/C4).
const StepLocation = ({
  countries,
  fieldErrors,
  clearFieldError,
  getFoundLostType,
  getCountryLabel,
  selectedCountryObj,
  handleCountryChange,
  cities,
  citySearchQuery,
  cityDisplayValue,
  searchResults,
  isSearching,
  showCityDropdown,
  filteredCities,
  setShowCityDropdown,
  setShowCustomCityInput,
  handleCityDropdownToggle,
  handleCitySearchChange,
  handleCitySelect,
}) => {
  const { values } = useFormikContext();
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();

  // Maps a city result's `source` field ('database' | 'geonames' | 'google',
  // set by the backend's DB -> GeoNames -> Google Places cascade) to a
  // label + color so it's visible in the dropdown which API actually
  // supplied a given suggestion, without needing devtools.
  const getCitySourceInfo = (source) => {
    const sourceMap = {
      geonames: {
        label: { en: 'GeoNames', fr: 'GeoNames', ar: 'GeoNames' },
        color: theme.palette.info.main,
      },
      google: {
        label: { en: 'Google Places', fr: 'Google Places', ar: 'Google Places' },
        color: theme.palette.warning.main,
      },
      database: {
        label: { en: 'Database', fr: 'Base de données', ar: 'قاعدة البيانات' },
        color: theme.palette.success.main,
      },
    };
    const entry = sourceMap[source] || sourceMap.database;
    return { label: entry.label[currentLanguage] || entry.label.en, color: entry.color };
  };

  const sourceCaptionPrefix = currentLanguage === 'ar' ? 'المصدر' : 'Source';

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Location Section */}
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
        {t('location')}
      </Typography>

      <Box>
        <FormLabel
          htmlFor="country"
          sx={{
            mb: 1,
            display: "block",
            fontWeight: 600,
            fontSize: '1.15rem',
            color: theme.palette.text.primary
          }}
        >
          {t('country')}<RequiredMark />
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
            ? t('chooseCountryLost')
            : t('chooseCountryFound')
          }
        </Typography>
        <FormControl fullWidth error={!!fieldErrors.country}>
          <Select
            value={values.country || ""}
            onChange={handleCountryChange}
            data-testid="country-select"
            displayEmpty
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
              },
              color: theme.palette.text.primary,
              fontWeight: 500
            }}
          >
            {countries?.map((country) => (
              <MenuItem key={country._id} value={country._id}>
                <Box display="flex" alignItems="center" gap={1}>
                  {country.flag ? (
                    <span style={{ fontSize: '20px' }}>
                      {country.flag}
                    </span>
                  ) : (
                    <img
                      loading="lazy"
                      width="20"
                      src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                      srcSet={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png 2x`}
                      alt=""
                      style={{ marginInlineEnd: 8 }}
                    />
                  )}
                  {getCountryLabel(country)} ({country.code})
                </Box>
              </MenuItem>
            ))}
          </Select>
          {fieldErrors.country && (
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                display: 'block',
                color: theme.palette.mode === 'dark' ? '#f44336' : '#d32f2f',
                fontWeight: 500
              }}
            >
              {fieldErrors.country}
            </Typography>
          )}
        </FormControl>
      </Box>

      <Box>
        <FormLabel
          htmlFor="city"
          sx={{
            mb: 1,
            display: "block",
            fontWeight: 600,
            fontSize: '1.15rem',
            color: theme.palette.text.primary
          }}
        >
          {t('city')}<RequiredMark />
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
          {!selectedCountryObj
            ? t('selectCountryFirst')
              : getFoundLostType(values.foundLost) === 'LOST'
                ? currentLanguage === 'ar'
                  ? 'يرجى تحديد المدينة التي فقدت فيها العنصر أو أقرب مدينة رئيسية إليها'
                  : currentLanguage === 'fr'
                    ? 'Veuillez sélectionner la ville où vous avez perdu l\'objet ou la ville principale la plus proche'
                    : 'Please select the city where you lost the item or the nearest major administrative center'
                : currentLanguage === 'ar'
                  ? 'يرجى تحديد المدينة التي وجدت فيها العنصر أو أقرب مدينة رئيسية إليها'
                  : currentLanguage === 'fr'
                    ? 'Veuillez sélectionner la ville où vous avez trouvé l\'objet ou la ville principale la plus proche'
                    : 'Please select the city where you found the item or the nearest major administrative center'
          }
        </Typography>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && selectedCountryObj && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                mb: 1,
                display: "block",
                fontSize: '0.8rem',
                color: theme.palette.mode === 'dark' ? '#ff9800' : '#f57c00',
                fontWeight: 500
              }}
            >
              Debug: Country: {selectedCountryObj.code || selectedCountryObj.labels?.en || 'No code'} | Cities loaded: {cities.length}
            </Typography>
          </Box>
        )}

        <Box sx={{
          position: 'relative'
        }} data-testid="city-dropdown">
          {/* City Display Input (Read-only) */}
          <TextField
            fullWidth
            placeholder={currentLanguage === 'ar' ? 'اختر مدينة...' : currentLanguage === 'fr' ? 'Sélectionner une ville...' : 'Select a city...'}
            value={cityDisplayValue}
            readOnly
            disabled={!selectedCountryObj}
            data-testid="city-select"
            onClick={handleCityDropdownToggle}
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
              color: theme.palette.text.primary,
                fontWeight: 500,
                cursor: 'pointer',
                '& .MuiInputBase-input': {
                  cursor: 'pointer'
                }
              }
            }}
            InputProps={{
              endAdornment: isSearching ? (
                <CircularProgress size={20} />
              ) : (
                <LocationOn sx={{ color: theme.palette.text.secondary }} />
              )
            }}
          />

          {/* Unified City Dropdown */}
          {showCityDropdown && selectedCountryObj && (
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: '99999 !important',
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                boxShadow: theme.shadows[8],
                maxHeight: 400,
                overflow: 'hidden',
                mt: 0.5
              }}
            >
              {/* Search Input inside Dropdown */}
              <Box sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper
              }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={currentLanguage === 'ar' ? 'ابحث عن مدينة...' : currentLanguage === 'fr' ? 'Rechercher une ville...' : 'Search for a city...'}
                  value={citySearchQuery}
                  onChange={handleCitySearchChange}
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: theme.palette.text.primary,
                    }
                  }}
                  InputProps={{
                    startAdornment: isSearching ? (
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                    ) : (
                      <LocationOn sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 20 }} />
                    )
                  }}
                />
              </Box>

              {/* Cities List */}
              <Box sx={{
                maxHeight: 300,
                overflow: 'auto',
                backgroundColor: theme.palette.background.paper,
                position: 'relative',
                zIndex: 1
              }}>
                {/* Show search results if searching */}
                {citySearchQuery.trim() && searchResults.length > 0 ? (
                  <>
                    <Box sx={{
                      p: 1,
                      backgroundColor: theme.palette.background.paper,
                      position: 'sticky',
                      top: 0,
                      zIndex: 2
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {currentLanguage === 'ar' ? 'نتائج البحث' : currentLanguage === 'fr' ? 'Résultats de recherche' : 'Search Results'}
                      </Typography>
                    </Box>
                    {searchResults.map((city, index) => (
                      <Box
                        key={city._id || city.code || city.id || index}
                        onClick={() => handleCitySelect(city)}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          backgroundColor: theme.palette.background.paper,
                          borderBottom: index < searchResults.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                          position: 'relative',
                          zIndex: '999999 !important',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateX(4px)',
                            transition: 'all 0.2s ease-in-out'
                          },
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <LocationOn fontSize="small" color="primary" sx={{ zIndex: '999999 !important', position: 'relative' }} />
                        <Box sx={{ zIndex: '999999 !important', position: 'relative' }}>
                          <Typography variant="body2" sx={{
                            fontWeight: 500,
                            zIndex: '999999 !important',
                            position: 'relative'
                          }}>
                            {getCityDisplayName(city, currentLanguage)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{
                            zIndex: '999999 !important',
                            position: 'relative'
                          }}>
                            {city.labels?.ar && currentLanguage !== 'ar' && ` • ${city.labels.ar}`}
                            {city.labels?.fr && currentLanguage !== 'fr' && ` • ${city.labels.fr}`}
                            {city.labels?.en && currentLanguage !== 'en' && ` • ${city.labels.en}`}
                          </Typography>
                          <Typography variant="caption" sx={{
                            display: 'block',
                            fontWeight: 600,
                            color: getCitySourceInfo(city.source).color,
                            zIndex: '999999 !important',
                            position: 'relative'
                          }}>
                            {sourceCaptionPrefix}: {getCitySourceInfo(city.source).label}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </>
                ) : citySearchQuery.trim() && searchResults.length === 0 && !isSearching ? (
                  <Box sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: theme.palette.background.paper,
                    position: 'relative',
                    zIndex: '999999 !important'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('noCitiesFound') || 'No cities found'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {currentLanguage === 'ar' ? 'أضف اسم المدينة الجديدة' :
                       currentLanguage === 'fr' ? 'Ajouter un nouveau nom de ville' :
                       'Add new city name'}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Show existing cities when not searching */}
                    {filteredCities.length > 0 ? (
                      filteredCities.map((city, index) => (
                        <Box
                          key={city.id || city._id}
                          onClick={() => handleCitySelect(city)}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            backgroundColor: theme.palette.background.paper,
                            borderBottom: index < filteredCities.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                            position: 'relative',
                            zIndex: '999999 !important',
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                              transform: 'translateX(4px)',
                              transition: 'all 0.2s ease-in-out'
                            },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <LocationOn fontSize="small" color="primary" sx={{ zIndex: '999999 !important', position: 'relative' }} />
                          <Box sx={{ zIndex: '999999 !important', position: 'relative' }}>
                            <Typography variant="body2" sx={{
                              fontWeight: 500,
                              zIndex: '999999 !important',
                              position: 'relative'
                            }}>
                              {getCityDisplayName(city, currentLanguage)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{
                              zIndex: '999999 !important',
                              position: 'relative'
                            }}>
                              {city.labels?.ar && currentLanguage !== 'ar' && ` • ${city.labels.ar}`}
                              {city.labels?.fr && currentLanguage !== 'fr' && ` • ${city.labels.fr}`}
                              {city.labels?.en && currentLanguage !== 'en' && ` • ${city.labels.en}`}
                            </Typography>
                            <Typography variant="caption" sx={{
                              display: 'block',
                              fontWeight: 600,
                              color: getCitySourceInfo(city.source).color,
                              zIndex: '999999 !important',
                              position: 'relative'
                            }}>
                              {sourceCaptionPrefix}: {getCitySourceInfo(city.source).label}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box sx={{
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: theme.palette.background.paper,
                        position: 'relative',
                        zIndex: '999999 !important'
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('noCitiesAvailable') || 'No cities available'}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}

                {/* Add New City Option - Only show when search has no results */}
                {citySearchQuery.trim().length > 0 && !isSearching && searchResults.length === 0 && (
                  <>
                    <Divider />
                    <Box
                      onClick={() => {
                        setShowCityDropdown(false);
                        setShowCustomCityInput(true);
                      }}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        margin: '6px 8px',
                        borderRadius: 2,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                          color: theme.palette.text.primary,
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[4],
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <AddIcon fontSize="small" />
                        {t('addNewCity') || 'Add New City'}
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          )}

          {fieldErrors.city && (
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                display: 'block',
                color: theme.palette.mode === 'dark' ? '#f44336' : '#d32f2f',
                fontWeight: 500
              }}
            >
              {fieldErrors.city}
            </Typography>
          )}
        </Box>
      </Box>

      <Box>
        <FormLabel
          htmlFor="exactLocation"
          sx={{
            mb: 1,
            display: "block",
            fontWeight: 600,
            fontSize: '1.15rem',
            color: theme.palette.text.primary
          }}
        >
          {t('exactLocation')}<RequiredMark />
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
            ? currentLanguage === 'ar'
              ? 'يرجى تحديد الموقع الدقيق والتفصيلي حيث فقدت العنصر (مثال: حي النور، شارع الملك، بجانب المسجد، أو أي معلم مميز)'
              : currentLanguage === 'fr'
                ? 'Veuillez spécifier l\'emplacement exact et détaillé où vous avez perdu l\'objet (ex: Quartier Al-Nour, Rue du Roi, près de la mosquée, ou tout point de repère distinctif)'
                : 'Please specify the precise and detailed location where you lost the item (e.g., Al-Nour District, King Street, near the mosque, or any distinctive landmark)'
            : currentLanguage === 'ar'
              ? 'يرجى تحديد الموقع الدقيق والتفصيلي حيث وجدت العنصر (مثال: حي النور، شارع الملك، بجانب المسجد، أو أي معلم مميز)'
              : currentLanguage === 'fr'
                ? 'Veuillez spécifier l\'emplacement exact et détaillé où vous avez trouvé l\'objet (ex: Quartier Al-Nour, Rue du Roi, près de la mosquée, ou tout point de repère distinctif)'
                : 'Please specify the precise and detailed location where you found the item (e.g., Al-Nour District, King Street, near the mosque, or any distinctive landmark)'
          }
        </Typography>
        <Textfield
          name="exactLocation"
          variant="outlined"
          multiline
          rows={4}
          placeholder={t('exactLocationPlaceholder')}
          data-testid="exactLocation"
          error={!!fieldErrors.exactLocation}
          helperText={fieldErrors.exactLocation}
          onErrorClear={clearFieldError}
        />
      </Box>

      <Box>
        <FormLabel
          htmlFor="exactDate"
          sx={{
            mb: 1,
            display: "block",
            fontWeight: 600,
            fontSize: '1.15rem',
            color: theme.palette.text.primary
          }}
        >
          {getFoundLostType(values.foundLost) === 'LOST'
            ? t('exactDateLost')
            : t('exactDateFound')
          } ({t('optional')})
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
            ? t('exactDateLostPlaceholderOptional')
            : t('exactDateFoundPlaceholderOptional')
          }
        </Typography>
        <Textfield
          name="exactDate"
          variant="outlined"
          placeholder={`${t('exactDatePlaceholder')} ${new Date().toLocaleDateString()})`}
          data-testid="exactDate"
        />
      </Box>
    </Box>
  );
};

export default StepLocation;
