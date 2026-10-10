import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  SearchOffOutlined,
  TaskAltOutlined,
  PlaceOutlined,
  CategoryOutlined,
  CheckCircleRounded,
  Clear as ClearIcon,
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

  // Wizard state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedType, setSelectedType] = useState(initialType || 'lost');
  const [selectedCountry, setSelectedCountry] = useState(reduxCountry || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

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
      setSelectedType(initialType || 'lost');
      if (reduxCountry) {
        setSelectedCountry(reduxCountry);
      }
      setSelectedCategory('');
      setSelectedCity(null);
      setCityInput('');
      setHybridCities([]);
    }
  }, [open, initialType, reduxCountry]);

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

  const categoriesList = useMemo(() => {
    if (!categoriesData?.ids) return [];
    const raw = categoriesData.ids
      .map((id) => categoriesData.entities[id])
      .filter(Boolean);
    return sortCategoriesForBrowse(raw);
  }, [categoriesData]);

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
    if (!selectedType || !selectedCountry) return;
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

  const handleSearchSubmit = () => {
    // 1. Dispatch updated country to Redux store
    if (selectedCountry) {
      dispatch(setCurrentCountry({ currentCountry: selectedCountry }));
    }

    // 2. Build URL query params
    const params = new URLSearchParams();
    const flParam = selectedType === 'found' ? (foundsId || '') : (lostsId || '');
    if (flParam) params.set('fl', flParam);
    if (selectedCategory) params.set('category', selectedCategory);

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
          border: `1px solid ${alpha(theme.custom.color.brandPrimary, isDark ? 0.28 : 0.18)}`,
          borderRadius: `${theme.custom.radius.xl}px`,
          boxShadow: theme.custom.elevation.e3,
          p: { xs: 2.5, sm: 3.5 },
          direction: isRTLMode ? 'rtl' : 'ltr',
        },
      }}
    >
      <Box sx={blob(theme.custom.color.brandPrimary, { top: -80, insetInlineStart: -60 })} />
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
                backgroundColor: step === 1
                  ? theme.custom.color.brandPrimary
                  : alpha(theme.custom.color.ink, 0.08),
                color: step === 1
                  ? theme.palette.common.white
                  : alpha(theme.custom.color.ink, 0.6),
                transition: 'all 0.25s ease',
              }}
            >
              1. {t('step1TypeAndCountry') || 'Type & Country'}
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
                backgroundColor: step === 2
                  ? theme.custom.color.brandPrimary
                  : alpha(theme.custom.color.ink, 0.08),
                color: step === 2
                  ? theme.palette.common.white
                  : alpha(theme.custom.color.ink, 0.6),
                transition: 'all 0.25s ease',
              }}
            >
              2. {t('step2CategoryAndCity') || 'Category & City'}
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
              key="slide-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Title */}
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
                  {t('whatHappenedAndWhere') || 'What happened & Where?'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: alpha(theme.custom.color.ink, 0.68),
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  }}
                >
                  {t('browseBeforeReport') || 'Select if you lost or found an item and your country.'}
                </Typography>
              </Box>

              {/* Type Selector (Lost vs Found) */}
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ color: theme.custom.color.ink, mb: 1.25 }}
              >
                {t('postStatus') || 'Status'}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: { xs: 1.5, sm: 2 },
                  mb: 3,
                }}
              >
                {/* I Lost Something Card */}
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedType('lost')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedType('lost');
                    }
                  }}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: `${theme.custom.radius.lg}px`,
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 1.2,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    backgroundColor: selectedType === 'lost'
                      ? alpha(theme.custom.status.lost.main, isDark ? 0.24 : 0.12)
                      : alpha(theme.custom.color.surfaceRaised, 0.6),
                    border: selectedType === 'lost'
                      ? `2px solid ${theme.custom.status.lost.main}`
                      : `1px solid ${alpha(theme.custom.color.ink, 0.12)}`,
                    boxShadow: selectedType === 'lost'
                      ? `0 6px 18px ${alpha(theme.custom.status.lost.main, 0.2)}`
                      : 'none',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      backgroundColor: alpha(theme.custom.status.lost.main, isDark ? 0.28 : 0.16),
                    },
                  }}
                >
                  {selectedType === 'lost' && (
                    <CheckCircleRounded
                      sx={{
                        position: 'absolute',
                        top: 8,
                        insetInlineEnd: 8,
                        fontSize: 18,
                        color: theme.custom.status.lost.main,
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.custom.status.lost.bg,
                      color: theme.custom.status.lost.main,
                    }}
                  >
                    <SearchOffOutlined sx={{ fontSize: 26 }} />
                  </Box>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{
                      color: theme.custom.color.ink,
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  >
                    {t('iLostSomething') || 'I Lost Something'}
                  </Typography>
                </Box>

                {/* I Found Something Card */}
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedType('found')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedType('found');
                    }
                  }}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: `${theme.custom.radius.lg}px`,
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 1.2,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    backgroundColor: selectedType === 'found'
                      ? alpha(theme.custom.status.found.main, isDark ? 0.24 : 0.12)
                      : alpha(theme.custom.color.surfaceRaised, 0.6),
                    border: selectedType === 'found'
                      ? `2px solid ${theme.custom.status.found.main}`
                      : `1px solid ${alpha(theme.custom.color.ink, 0.12)}`,
                    boxShadow: selectedType === 'found'
                      ? `0 6px 18px ${alpha(theme.custom.status.found.main, 0.2)}`
                      : 'none',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      backgroundColor: alpha(theme.custom.status.found.main, isDark ? 0.28 : 0.16),
                    },
                  }}
                >
                  {selectedType === 'found' && (
                    <CheckCircleRounded
                      sx={{
                        position: 'absolute',
                        top: 8,
                        insetInlineEnd: 8,
                        fontSize: 18,
                        color: theme.custom.status.found.main,
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.custom.status.found.bg,
                      color: theme.custom.status.found.main,
                    }}
                  >
                    <TaskAltOutlined sx={{ fontSize: 26 }} />
                  </Box>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{
                      color: theme.custom.color.ink,
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  >
                    {t('iFoundSomething') || 'I Found Something'}
                  </Typography>
                </Box>
              </Box>

              {/* Country Picker */}
              <Box sx={{ mb: 4 }}>
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

              {/* Next Step Action */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                  disabled={!selectedType || !selectedCountry}
                  endIcon={isRTLMode ? <ArrowBackIcon /> : <ArrowForwardIcon />}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    px: 3.5,
                    py: 1.25,
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: theme.custom.color.brandPrimary,
                    boxShadow: theme.custom.elevation.e1,
                    '&:hover': {
                      backgroundColor: theme.custom.color.brandPrimary,
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
              key="slide-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Title */}
              <Box sx={{ mb: 2.5 }}>
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
                  {t('categoryAndCity') || 'Category & City'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: alpha(theme.custom.color.ink, 0.68),
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  }}
                >
                  {t('searchPostsDesc') || 'Narrow down by category and city to find matching posts.'}
                </Typography>
              </Box>

              {/* Category Picker */}
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: theme.custom.color.ink }}>
                    {t('selectCategory') || 'Category (Optional)'}
                  </Typography>
                  {selectedCategory && (
                    <Button
                      size="small"
                      onClick={() => setSelectedCategory('')}
                      sx={{
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        color: alpha(theme.custom.color.ink, 0.6),
                        py: 0,
                      }}
                    >
                      {t('allCategories') || 'Clear category'}
                    </Button>
                  )}
                </Box>

                {/* Quick Interactive Category Grid */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)' },
                    gap: 1,
                    maxHeight: 180,
                    overflowY: 'auto',
                    pr: 0.5,
                    mb: 1.5,
                  }}
                >
                  {categoriesList.map((cat) => {
                    const catId = cat._id || cat.id;
                    const isSelected = selectedCategory === catId;
                    const IconComponent = getCategoryIcon(cat.code);
                    const catColor = getCategoryColor(cat.code) || theme.custom.color.brandPrimary;
                    const catLabel = cat.labels?.[currentLanguage] || cat.name || cat.label || cat.code;

                    return (
                      <Box
                        key={catId}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCategory(isSelected ? '' : catId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedCategory(isSelected ? '' : catId);
                          }
                        }}
                        sx={{
                          p: 1,
                          borderRadius: `${theme.custom.radius.md}px`,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: 0.5,
                          transition: 'all 0.18s ease',
                          backgroundColor: isSelected
                            ? alpha(catColor, isDark ? 0.28 : 0.16)
                            : alpha(theme.custom.color.surfaceRaised, 0.6),
                          border: isSelected
                            ? `2px solid ${catColor}`
                            : `1px solid ${alpha(theme.custom.color.ink, 0.1)}`,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            backgroundColor: alpha(catColor, isDark ? 0.22 : 0.12),
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alpha(catColor, 0.16),
                            color: catColor,
                          }}
                        >
                          <IconComponent sx={{ fontSize: 18 }} />
                        </Box>
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            fontWeight: isSelected ? 700 : 500,
                            color: theme.custom.color.ink,
                            fontSize: '0.75rem',
                            maxWidth: '100%',
                          }}
                        >
                          {catLabel}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* City Autocomplete */}
              <Box sx={{ mb: 3.5 }}>
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
                      <PlaceOutlined sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />
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
                      borderColor: theme.custom.color.brandPrimary,
                      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.06),
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
                    backgroundColor: theme.custom.color.brandPrimary,
                    boxShadow: theme.custom.elevation.e2,
                    '&:hover': {
                      backgroundColor: theme.custom.color.brandPrimary,
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
