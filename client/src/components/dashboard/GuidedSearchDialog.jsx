import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Autocomplete,
  TextField,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  PlaceOutlined,
  CheckCircleRounded,
  Clear as ClearIcon,
  FilterListRounded,
} from '@mui/icons-material';
import { selectCurrentCountry, setCurrentCountry } from '../../app/state';
import {
  useGetCountriesQuery,
  useGetflOptionsQuery,
  useGetCategoriesQuery,
  useGetCitiesQuery,
} from '../../features/dependencies/dependenciesApiSlice';
import { useTranslation } from '../../utils/translations';
import { isRTL } from '../../utils/languageUtils';
import { getCategoryIcon, getCategoryColor, sortCategoriesForBrowse } from '../../config/categories';
import { getCityDisplayName } from '../../features/posts/NewPost/cityDisplay';
import { BASE_URL } from '../../config/api';

// Multilingual country names mapping
const countryCodeToName = {
  MA: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc', es: 'Marruecos' },
  DZ: { en: 'Algeria', ar: 'الجزائر', fr: 'Algérie', es: 'Argelia' },
  TN: { en: 'Tunisia', ar: 'تونس', fr: 'Tunisie', es: 'Túnez' },
  EG: { en: 'Egypt', ar: 'مصر', fr: 'Égypte', es: 'Egipto' },
  SA: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', fr: 'Arabie Saoudite', es: 'Arabia Saudí' },
  AE: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', fr: 'Émirats Arabes Unis', es: 'Emiratos Árabes Unidos' },
  QA: { en: 'Qatar', ar: 'قطر', fr: 'Qatar', es: 'Catar' },
  KW: { en: 'Kuwait', ar: 'الكويت', fr: 'Koweït', es: 'Kuwait' },
  BH: { en: 'Bahrain', ar: 'البحرين', fr: 'Bahreïn', es: 'Baréin' },
  OM: { en: 'Oman', ar: 'عُمان', fr: 'Oman', es: 'Omán' },
  JO: { en: 'Jordan', ar: 'الأردن', fr: 'Jordanie', es: 'Jordania' },
  LB: { en: 'Lebanon', ar: 'لبنان', fr: 'Liban', es: 'Líbano' },
  SY: { en: 'Syria', ar: 'سوريا', fr: 'Syrie', es: 'Siria' },
  IQ: { en: 'Iraq', ar: 'العراق', fr: 'Irak', es: 'Irak' },
  PS: { en: 'Palestine', ar: 'فلسطين', fr: 'Palestine', es: 'Palestina' },
  LY: { en: 'Libya', ar: 'ليبيا', fr: 'Libye', es: 'Libia' },
  SD: { en: 'Sudan', ar: 'السودان', fr: 'Soudan', es: 'Sudán' },
  SO: { en: 'Somalia', ar: 'الصومال', fr: 'Somalie', es: 'Somalia' },
  DJ: { en: 'Djibouti', ar: 'جيبوتي', fr: 'Djibouti', es: 'Yibuti' },
  KM: { en: 'Comoros', ar: 'جزر القمر', fr: 'Comores', es: 'Comoras' },
  MR: { en: 'Mauritania', ar: 'موريتانيا', fr: 'Mauritanie', es: 'Mauritania' },
  FR: { en: 'France', ar: 'فرنسا', fr: 'France', es: 'Francia' },
  ES: { en: 'Spain', ar: 'إسبانيا', fr: 'Espagne', es: 'España' },
  DE: { en: 'Germany', ar: 'ألمانيا', fr: 'Allemagne', es: 'Alemania' },
  US: { en: 'United States', ar: 'الولايات المتحدة', fr: 'États-Unis', es: 'Estados Unidos' },
  CA: { en: 'Canada', ar: 'كندا', fr: 'Canada', es: 'Canadá' },
  GB: { en: 'United Kingdom', ar: 'المملكة المتحدة', fr: 'Royaume-Uni', es: 'Reino Unido' },
  TR: { en: 'Turkey', ar: 'تركيا', fr: 'Turquie', es: 'Turquía' },
  IT: { en: 'Italy', ar: 'إيطاليا', fr: 'Italie', es: 'Italia' },
  NL: { en: 'Netherlands', ar: 'هولندا', fr: 'Pays-Bas', es: 'Países Bajos' },
  BE: { en: 'Belgium', ar: 'بلجيكا', fr: 'Belgique', es: 'Bélgica' },
};

const getCountryDisplayName = (country, lang = 'en') => {
  if (!country) return '';
  if (country.names?.[lang]) return country.names[lang];
  if (country.labels?.[lang]) {
    const l = country.labels[lang];
    if (l && l.length === 2 && l === l.toUpperCase()) {
      return countryCodeToName[l]?.[lang] || l;
    }
    return l;
  }
  if (country.code && countryCodeToName[country.code]) {
    return countryCodeToName[country.code][lang] || country.code;
  }
  return country.label || country.name || country.code || '';
};

const getCountryFlag = (code) => {
  if (!code || code.length !== 2) return '🌐';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

const GuidedSearchDialog = ({ open, onClose, initialType = 'lost' }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTLMode = isRTL();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();

  const reduxCountry = useSelector(selectCurrentCountry);

  // Wizard state: Step 1 (Location: Country & City) -> Step 2 (Categories: Multi-select)
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const selectedType = initialType || 'lost'; // Preserved from the button user clicked
  const [selectedCountry, setSelectedCountry] = useState(reduxCountry || '');
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]); // Multiple category IDs
  const [categoryFilterQuery, setCategoryFilterQuery] = useState('');

  // City hybrid search state
  const [cityInput, setCityInput] = useState('');
  const [hybridCities, setHybridCities] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const searchDebounceRef = useRef(null);

  // Reset and sync state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setDirection(1);
      if (reduxCountry) {
        setSelectedCountry(reduxCountry);
      }
      setSelectedCity(null);
      setSelectedCategories([]);
      setCategoryFilterQuery('');
      setCityInput('');
      setHybridCities([]);
    }
  }, [open, reduxCountry]);

  // Dependencies queries
  const { data: countriesData } = useGetCountriesQuery({ language: currentLanguage });
  const { data: flOptionsData } = useGetflOptionsQuery({ language: currentLanguage });
  const { data: categoriesData } = useGetCategoriesQuery({ language: currentLanguage });

  const countriesList = useMemo(() => {
    if (!countriesData?.ids) return [];
    return countriesData.ids
      .map((id) => countriesData.entities[id])
      .filter(Boolean);
  }, [countriesData]);

  // If no selected country yet, default to first available country from query
  useEffect(() => {
    if (!selectedCountry && countriesList.length > 0) {
      setSelectedCountry(countriesList[0]._id || countriesList[0].id);
    }
  }, [selectedCountry, countriesList]);

  const selectedCountryObj = useMemo(() => {
    if (!selectedCountry) return null;
    return countriesList.find((c) => c._id === selectedCountry || c.id === selectedCountry) || null;
  }, [countriesList, selectedCountry]);

  const countryCode = useMemo(() => {
    return selectedCountryObj?.code?.toUpperCase() || null;
  }, [selectedCountryObj]);

  const foundsId = useMemo(() => {
    if (!flOptionsData?.ids) return null;
    return flOptionsData.ids
      .map((id) => flOptionsData.entities[id])
      .find((opt) => opt?.code === 'FOUND')?.id;
  }, [flOptionsData]);

  const lostsId = useMemo(() => {
    if (!flOptionsData?.ids) return null;
    return flOptionsData.ids
      .map((id) => flOptionsData.entities[id])
      .find((opt) => opt?.code === 'LOST')?.id;
  }, [flOptionsData]);

  const allCategories = useMemo(() => {
    if (!categoriesData?.ids) return [];
    const raw = categoriesData.ids
      .map((id) => categoriesData.entities[id])
      .filter(Boolean);
    return sortCategoriesForBrowse(raw);
  }, [categoriesData]);

  // Filtered categories in Slide 2 by user search query
  const displayedCategories = useMemo(() => {
    if (!categoryFilterQuery.trim()) return allCategories;
    const q = categoryFilterQuery.toLowerCase().trim();
    return allCategories.filter((cat) => {
      const name = (cat.name || '').toLowerCase();
      const label = (cat.label || '').toLowerCase();
      const code = (cat.code || '').toLowerCase();
      const labelEn = (cat.labels?.en || '').toLowerCase();
      const labelAr = (cat.labels?.ar || '').toLowerCase();
      const labelFr = (cat.labels?.fr || '').toLowerCase();
      return (
        name.includes(q) ||
        label.includes(q) ||
        code.includes(q) ||
        labelEn.includes(q) ||
        labelAr.includes(q) ||
        labelFr.includes(q)
      );
    });
  }, [allCategories, categoryFilterQuery]);

  // Fetch standard database cities for selected country
  const { data: citiesData } = useGetCitiesQuery(
    { countryId: selectedCountry, language: currentLanguage },
    { skip: !selectedCountry }
  );

  const countryCities = useMemo(() => {
    if (!citiesData?.ids) return [];
    return citiesData.ids
      .map((id) => citiesData.entities[id])
      .filter(Boolean);
  }, [citiesData]);

  // Handle hybrid city search when user types in city field
  useEffect(() => {
    if (!cityInput || cityInput.trim().length < 2 || !countryCode) {
      setHybridCities([]);
      setIsSearchingCity(false);
      return;
    }

    setIsSearchingCity(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const url = `${BASE_URL}/cities/search?q=${encodeURIComponent(cityInput.trim())}&countryCode=${countryCode}&language=${currentLanguage || 'en'}&limit=12`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setHybridCities(json.data);
          } else {
            setHybridCities([]);
          }
        }
      } catch (err) {
        setHybridCities([]);
      } finally {
        setIsSearchingCity(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [cityInput, countryCode, currentLanguage]);

  // Combine search results with known cities, avoiding duplicates
  const cityOptions = useMemo(() => {
    const map = new Map();
    // Prioritize hybrid search results if searching
    hybridCities.forEach((c) => {
      const key = c._id || c.id || c.code || getCityDisplayName(c, currentLanguage);
      if (key) map.set(String(key), c);
    });
    // Add country cities
    countryCities.forEach((c) => {
      const key = c._id || c.id || c.code || getCityDisplayName(c, currentLanguage);
      if (key && !map.has(String(key))) map.set(String(key), c);
    });
    return Array.from(map.values());
  }, [hybridCities, countryCities, currentLanguage]);

  // Slide navigation
  const handleNext = () => {
    if (!selectedCountry) return;
    setDirection(1);
    setStep(2);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(1);
  };

  const handleCountryChange = (event, newCountry) => {
    if (newCountry) {
      const newId = newCountry._id || newCountry.id;
      setSelectedCountry(newId);
      setSelectedCity(null);
      setCityInput('');
      setHybridCities([]);
    }
  };

  // Multiple category selection handler (toggle in/out)
  const handleToggleCategory = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
  };

  const handleSelectAllCategories = () => {
    const allIds = allCategories.map((c) => c._id || c.id).filter(Boolean);
    setSelectedCategories(allIds);
  };

  const handleSearchSubmit = () => {
    // 1. Dispatch updated country to Redux store
    if (selectedCountry) {
      dispatch(setCurrentCountry({ currentCountry: selectedCountry }));
    }

    // 2. Build URL query params
    const params = new URLSearchParams();
    const flParam = selectedType === 'found' ? (foundsId || '') : (lostsId || '');
    if (flParam) params.set('fl', flParam);

    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','));
    }

    const cityParam = selectedCity
      ? (selectedCity._id || selectedCity.id || selectedCity.code || '')
      : '';
    if (cityParam) params.set('city', cityParam);

    if (selectedCountry) params.set('country', selectedCountry);

    // 3. Close dialog and navigate
    onClose();
    navigate(`/dash/posts?${params.toString()}`);
  };

  // Background ambient blobs
  const blob = (color, position) => ({
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${alpha(color, isDark ? 0.28 : 0.18)} 0%, ${alpha(color, 0)} 70%)`,
    filter: 'blur(24px)',
    pointerEvents: 'none',
    zIndex: 0,
    ...position,
  });

  const accentColor =
    selectedType === 'found' ? theme.custom.status.found.main : theme.custom.status.lost.main;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.94)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.98)} 100%)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(accentColor, isDark ? 0.35 : 0.22)}`,
          borderRadius: `${theme.custom.radius.xl}px`,
          boxShadow: theme.custom.elevation.e3,
          p: { xs: 2.5, sm: 3.5 },
          direction: isRTLMode ? 'rtl' : 'ltr',
        },
      }}
    >
      <Box sx={blob(accentColor, { top: -80, insetInlineStart: -60 })} />
      <Box sx={blob(theme.custom.color.brandLogo, { bottom: -90, insetInlineEnd: -60 })} />

      <DialogContent sx={{ p: 0, position: 'relative', zIndex: 1, overflow: 'visible' }}>
        {/* Header Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          {/* Step Pill Indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: step === 1 ? accentColor : alpha(theme.custom.color.ink, 0.08),
                color: step === 1 ? theme.palette.common.white : alpha(theme.custom.color.ink, 0.6),
                transition: 'all 0.25s ease',
              }}
            >
              1. {t('step1Location') || 'Location'}
            </Box>
            <Box
              sx={{
                width: 16,
                height: 2,
                backgroundColor: alpha(theme.custom.color.ink, 0.2),
              }}
            />
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: step === 2 ? accentColor : alpha(theme.custom.color.ink, 0.08),
                color: step === 2 ? theme.palette.common.white : alpha(theme.custom.color.ink, 0.6),
                transition: 'all 0.25s ease',
              }}
            >
              2. {t('step2Categories') || 'Categories'}
            </Box>
          </Box>

          <IconButton
            size="small"
            onClick={onClose}
            aria-label="close"
            sx={{
              color: alpha(theme.custom.color.ink, 0.6),
              '&:hover': {
                color: theme.custom.color.ink,
                backgroundColor: alpha(theme.custom.color.ink, 0.08),
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Step Transition Slides */}
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 ? (
            <motion.div
              key="slide-1-location"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Slide 1 Header */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{
                    fontFamily: theme.custom.font.display,
                    color: theme.custom.color.ink,
                    fontSize: { xs: '1.25rem', sm: '1.45rem' },
                    mb: 0.5,
                  }}
                >
                  {selectedType === 'found'
                    ? t('whereDidYouFindIt') || 'Where did you find the item?'
                    : t('whereDidYouLoseIt') || 'Where did you lose your item?'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: alpha(theme.custom.color.ink, 0.68),
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  }}
                >
                  {selectedType === 'found'
                    ? t('selectLocationSubtitleFound') ||
                      'Select the country and city where you found the item to search owner reports.'
                    : t('selectLocationSubtitleLost') ||
                      'Select the country and city where you lost your item to find community reports.'}
                </Typography>
              </Box>

              {/* Country Picker */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{ color: theme.custom.color.ink, mb: 1 }}
                >
                  {t('selectCountry') || 'Country'}
                </Typography>
                <Autocomplete
                  options={countriesList}
                  value={selectedCountryObj}
                  onChange={handleCountryChange}
                  getOptionLabel={(option) => getCountryDisplayName(option, currentLanguage)}
                  isOptionEqualToValue={(option, value) =>
                    (option._id || option.id) === (value._id || value.id)
                  }
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 1,
                        px: 1.5,
                      }}
                    >
                      <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>
                        {getCountryFlag(option.code)}
                      </Typography>
                      <Typography sx={{ fontWeight: 500 }}>
                        {getCountryDisplayName(option, currentLanguage)}
                      </Typography>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t('chooseCountryPrompt') || 'Choose country...'}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            {selectedCountryObj && (
                              <Typography sx={{ fontSize: '1.25rem', mr: 1, ml: 0.5 }}>
                                {getCountryFlag(selectedCountryObj.code)}
                              </Typography>
                            )}
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.7),
                          borderRadius: `${theme.custom.radius.md}px`,
                        },
                      }}
                    />
                  )}
                />
              </Box>

              {/* City Autocomplete */}
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: theme.custom.color.ink }}>
                    {t('selectCity') || 'City'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha(theme.custom.color.ink, 0.6) }}>
                    {t('leaveEmptyForWholeCountry') || 'Optional — Leave empty to search entire country'}
                  </Typography>
                </Box>

                <Autocomplete
                  options={cityOptions}
                  value={selectedCity}
                  onChange={(event, newCity) => setSelectedCity(newCity)}
                  inputValue={cityInput}
                  onInputChange={(event, newInputValue) => setCityInput(newInputValue)}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return getCityDisplayName(option, currentLanguage);
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!value) return false;
                    const optId = option._id || option.id || option.code;
                    const valId = value._id || value.id || value.code;
                    return optId === valId;
                  }}
                  loading={isSearchingCity}
                  noOptionsText={
                    isSearchingCity
                      ? t('searching') || 'Searching...'
                      : t('noCitiesFound') || 'No matching cities found'
                  }
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        py: 1,
                        px: 1.5,
                      }}
                    >
                      <PlaceOutlined sx={{ fontSize: 20, color: accentColor }} />
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {getCityDisplayName(option, currentLanguage)}
                        </Typography>
                        {option.region && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {option.region}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t('searchCitiesPlaceholder') || 'Search all cities or type to filter...'}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <PlaceOutlined
                              sx={{
                                color: alpha(theme.custom.color.ink, 0.5),
                                mr: 1,
                                ml: 0.5,
                                fontSize: 20,
                              }}
                            />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {isSearchingCity ? (
                              <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.7),
                          borderRadius: `${theme.custom.radius.md}px`,
                        },
                      }}
                    />
                  )}
                />
              </Box>

              {/* Next Step Action */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                  disabled={!selectedCountry}
                  endIcon={isRTLMode ? <ArrowBackIcon /> : <ArrowForwardIcon />}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    px: 3.5,
                    py: 1.25,
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: accentColor,
                    boxShadow: theme.custom.elevation.e1,
                    '&:hover': {
                      backgroundColor: accentColor,
                      opacity: 0.92,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {t('nextStep') || 'Next'}
                </Button>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key="slide-2-categories"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Slide 2 Header: "Select the things you found/lost" */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{
                    fontFamily: theme.custom.font.display,
                    color: theme.custom.color.ink,
                    fontSize: { xs: '1.25rem', sm: '1.45rem' },
                    mb: 0.5,
                  }}
                >
                  {selectedType === 'found'
                    ? t('selectWhatYouFound') || 'Select the things you found'
                    : t('selectWhatYouLost') || 'Select the things you lost'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: alpha(theme.custom.color.ink, 0.68),
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  }}
                >
                  {t('selectCategoriesSubtitle') ||
                    'You can choose one or multiple categories to find matching reports.'}
                </Typography>
              </Box>

              {/* Controls bar: search input + counter & clear */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  mb: 1.5,
                  flexWrap: 'wrap',
                }}
              >
                <TextField
                  size="small"
                  value={categoryFilterQuery}
                  onChange={(e) => setCategoryFilterQuery(e.target.value)}
                  placeholder={t('search') || 'Filter categories...'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterListRounded sx={{ fontSize: 18, color: alpha(theme.custom.color.ink, 0.5) }} />
                      </InputAdornment>
                    ),
                    endAdornment: categoryFilterQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setCategoryFilterQuery('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    flex: '1 1 180px',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.7),
                      borderRadius: `${theme.custom.radius.md}px`,
                      fontSize: '0.85rem',
                    },
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {selectedCategories.length > 0 && (
                    <Chip
                      size="small"
                      label={`${selectedCategories.length} ${t('categoriesSelected') || 'selected'}`}
                      sx={{
                        fontWeight: 700,
                        backgroundColor: alpha(accentColor, 0.16),
                        color: accentColor,
                        border: `1px solid ${alpha(accentColor, 0.3)}`,
                      }}
                    />
                  )}
                  {selectedCategories.length > 0 ? (
                    <Button
                      size="small"
                      onClick={handleClearCategories}
                      sx={{
                        fontSize: '0.78rem',
                        textTransform: 'none',
                        color: alpha(theme.custom.color.ink, 0.7),
                        p: 0.5,
                      }}
                    >
                      {t('clearSelection') || 'Clear'}
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      onClick={handleSelectAllCategories}
                      sx={{
                        fontSize: '0.78rem',
                        textTransform: 'none',
                        color: alpha(theme.custom.color.ink, 0.7),
                        p: 0.5,
                      }}
                    >
                      {t('selectAll') || 'Select All'}
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Multi-Select Category Cards Grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1.25,
                  maxHeight: 270,
                  overflowY: 'auto',
                  pr: 0.5,
                  mb: 3,
                }}
              >
                {displayedCategories.map((cat) => {
                  const catId = cat._id || cat.id;
                  const isSelected = selectedCategories.includes(catId);
                  const IconComponent = getCategoryIcon(cat.code);
                  const catColor = getCategoryColor(cat.code) || accentColor;
                  const catLabel =
                    cat.labels?.[currentLanguage] || cat.name || cat.label || cat.code;

                  return (
                    <Box
                      key={catId}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleCategory(catId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleCategory(catId);
                        }
                      }}
                      sx={{
                        position: 'relative',
                        p: { xs: 1.25, sm: 1.5 },
                        borderRadius: `${theme.custom.radius.md}px`,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 0.75,
                        transition: 'all 0.18s ease',
                        backgroundColor: isSelected
                          ? alpha(catColor, isDark ? 0.3 : 0.16)
                          : alpha(theme.custom.color.surfaceRaised, 0.6),
                        border: isSelected
                          ? `2px solid ${catColor}`
                          : `1px solid ${alpha(theme.custom.color.ink, 0.12)}`,
                        boxShadow: isSelected
                          ? `0 4px 12px ${alpha(catColor, 0.25)}`
                          : 'none',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          backgroundColor: alpha(catColor, isDark ? 0.24 : 0.12),
                          borderColor: catColor,
                        },
                      }}
                    >
                      {isSelected && (
                        <CheckCircleRounded
                          sx={{
                            position: 'absolute',
                            top: 4,
                            insetInlineEnd: 4,
                            fontSize: 16,
                            color: catColor,
                          }}
                        />
                      )}
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: alpha(catColor, 0.16),
                          color: catColor,
                        }}
                      >
                        <IconComponent sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{
                          fontWeight: isSelected ? 700 : 500,
                          color: theme.custom.color.ink,
                          fontSize: '0.78rem',
                          maxWidth: '100%',
                        }}
                      >
                        {catLabel}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Actions Footer */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleBack}
                  startIcon={isRTLMode ? <ArrowForwardIcon /> : <ArrowBackIcon />}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    px: 2.5,
                    py: 1.25,
                    fontWeight: 600,
                    textTransform: 'none',
                    color: theme.custom.color.ink,
                    borderColor: alpha(theme.custom.color.ink, 0.25),
                    '&:hover': {
                      borderColor: accentColor,
                      backgroundColor: alpha(accentColor, 0.06),
                    },
                  }}
                >
                  {t('backStep') || 'Back'}
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSearchSubmit}
                  startIcon={<SearchIcon />}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    px: 3.5,
                    py: 1.25,
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: accentColor,
                    boxShadow: theme.custom.elevation.e2,
                    '&:hover': {
                      backgroundColor: accentColor,
                      opacity: 0.92,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {t('searchPostsAction') || 'Search Listings'}
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default GuidedSearchDialog;
