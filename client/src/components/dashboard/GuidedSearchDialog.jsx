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
  Paper,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ArrowForwardRounded as ArrowForwardRoundedIcon,
  ArrowBackRounded as ArrowBackRoundedIcon,
  PlaceRounded as PlaceRoundedIcon,
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

// Custom Paper component for Autocomplete supporting both Cyber-Obsidian and Light Frosted Glass
const CustomAutocompletePaper = (props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      {...props}
      sx={{
        mt: 1,
        borderRadius: '16px !important',
        backgroundColor: isDark ? 'rgba(11, 18, 32, 0.98) !important' : 'rgba(255, 255, 255, 0.98) !important',
        backgroundImage: 'none !important',
        backdropFilter: 'blur(24px) !important',
        WebkitBackdropFilter: 'blur(24px) !important',
        border: '1px solid rgba(0, 242, 254, 0.3) !important',
        boxShadow: isDark
          ? '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 242, 254, 0.15) !important'
          : '0 20px 50px rgba(15, 23, 42, 0.12), 0 0 25px rgba(0, 242, 254, 0.15) !important',
        color: isDark ? '#f8fafc !important' : '#0f172a !important',
        '& .MuiAutocomplete-listbox': {
          p: '8px !important',
          backgroundColor: isDark ? 'rgba(11, 18, 32, 0.98) !important' : 'rgba(255, 255, 255, 0.98) !important',
          '& .MuiAutocomplete-option': {
            borderRadius: '10px !important',
            my: '2px !important',
            py: '10px !important',
            px: '14px !important',
            color: isDark ? '#f8fafc !important' : '#0f172a !important',
            backgroundColor: 'transparent !important',
            '&:hover, &.Mui-focused': {
              backgroundColor: isDark ? 'rgba(0, 242, 254, 0.12) !important' : 'rgba(0, 242, 254, 0.1) !important',
            },
            '&[aria-selected="true"]': {
              backgroundColor: isDark ? 'rgba(0, 242, 254, 0.2) !important' : 'rgba(0, 242, 254, 0.18) !important',
              fontWeight: '600 !important',
            },
          },
        },
        ...props.sx,
      }}
    />
  );
};

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -30 : 30,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        elevation: 0,
        sx: {
          backgroundColor: isDark ? 'rgba(11, 18, 32, 0.94)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderRadius: { xs: '20px', sm: '24px' },
          border: isDark ? '1px solid rgba(0, 242, 254, 0.35)' : '1.5px solid rgba(0, 242, 254, 0.65)',
          boxShadow: isDark
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px -10px rgba(0, 242, 254, 0.25)'
            : '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 35px -5px rgba(0, 242, 254, 0.35)',
          overflow: 'hidden',
          p: { xs: 2, sm: 2.5, md: 3 },
          position: 'relative',
          color: isDark ? '#ffffff' : '#0f172a',
          direction: isRTLMode ? 'rtl' : 'ltr',
          maxWidth: { xs: 'calc(100% - 24px)', sm: '560px', md: '600px' },
          width: '100%',
          mx: 'auto',
          my: { xs: 1.5, sm: 2 },
          maxHeight: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 40px)', md: 'min(90vh, 660px)' },
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        },
      }}
    >
      {/* Top glowing hairline gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: isDark
            ? 'linear-gradient(90deg, transparent 5%, rgba(0, 242, 254, 0.7) 50%, transparent 95%)'
            : 'linear-gradient(90deg, transparent 5%, #00F2FE 50%, transparent 95%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Cyber dot matrix SVG background */}
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: isDark ? 0.12 : 0.55,
          zIndex: 0,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dot-matrix-guided" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r={isDark ? 1 : 1.25} fill="#00F2FE" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-matrix-guided)" />
      </Box>

      {/* Close Button matching CountryWelcomeDialog style */}
      <IconButton
        onClick={onClose}
        size="small"
        aria-label="close"
        sx={{
          position: 'absolute',
          top: { xs: 10, sm: 14 },
          insetInlineEnd: { xs: 10, sm: 14 },
          zIndex: 20,
          width: 34,
          height: 34,
          borderRadius: '50%',
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(241, 245, 249, 0.85)',
          border: isDark ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(0, 242, 254, 0.45)',
          color: isDark ? '#94a3b8' : '#64748b',
          transition: 'all 0.25s ease',
          '&:hover': {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: 'rgba(0, 242, 254, 0.5)',
            boxShadow: isDark ? '0 0 12px rgba(0, 242, 254, 0.35)' : '0 0 12px rgba(0, 242, 254, 0.25)',
            color: isDark ? '#ffffff' : '#0f172a',
            transform: 'scale(1.05)',
          },
        }}
      >
        <CloseIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <DialogContent
        sx={{
          p: 0,
          position: 'relative',
          zIndex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          pr: 0.25,
          '&::-webkit-scrollbar': { width: 5 },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(203, 213, 225, 0.8)',
            borderRadius: 8,
            '&:hover': { backgroundColor: 'rgba(0, 242, 254, 0.4)' },
          },
        }}
      >
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
              <Box sx={{ mb: { xs: 2, sm: 2.25 }, pt: { xs: 0.5, sm: 0.75 }, px: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.2rem', sm: '1.35rem', md: '1.45rem' },
                    lineHeight: 1.25,
                    color: isDark ? '#ffffff' : '#0f172a',
                    mb: 0.5,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {selectedType === 'found'
                    ? t('whereDidYouFindIt') || 'Where did you find the item?'
                    : t('whereDidYouLoseIt') || 'Where did you lose your item?'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? '#cbd5e1' : '#475569',
                    lineHeight: 1.45,
                    fontSize: { xs: '0.82rem', sm: '0.88rem' },
                    maxWidth: 420,
                    mx: 'auto',
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
              <Box sx={{ mb: { xs: 1.75, sm: 2 }, textAlign: 'start' }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    color: isDark ? '#cbd5e1' : '#334155',
                    mb: 0.8,
                    fontSize: '0.82rem',
                  }}
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
                  PaperComponent={CustomAutocompletePaper}
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
                      <Typography sx={{ fontWeight: 500, color: isDark ? '#f1f5f9' : '#0f172a' }}>
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5, mr: 1, flexShrink: 0 }}>
                            <PlaceRoundedIcon sx={{ fontSize: 20, color: '#10B981' }} />
                            {selectedCountryObj && (
                              <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>
                                {getCountryFlag(selectedCountryObj.code)}
                              </Typography>
                            )}
                            {params.InputProps.startAdornment}
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '14px',
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.85)',
                          color: isDark ? '#ffffff' : '#0f172a',
                          fontSize: '0.92rem',
                          transition: 'all 0.2s ease',
                          '& fieldset': {
                            borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(0, 242, 254, 0.45)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#00F2FE',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00F2FE',
                            borderWidth: '2px',
                            boxShadow: isDark ? '0 0 12px rgba(0, 242, 254, 0.25)' : '0 0 12px rgba(0, 242, 254, 0.3)',
                          },
                          '& .MuiAutocomplete-input': {
                            color: isDark ? '#ffffff' : '#0f172a',
                          },
                          '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
                            color: isDark ? '#94a3b8' : '#64748b',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Box>

              {/* City Autocomplete */}
              <Box sx={{ mb: { xs: 2.25, sm: 2.75 }, textAlign: 'start' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 0.6,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      fontWeight: 600,
                      color: isDark ? '#cbd5e1' : '#334155',
                      fontSize: '0.82rem',
                    }}
                  >
                    {t('selectCity') || 'City'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.74rem' }}>
                    {t('leaveEmptyForWholeCountry') || 'Optional — Leave empty for entire country'}
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
                    <Typography sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.88rem' }}>
                      {isSearchingCity
                        ? t('searching') || 'Searching...'
                        : t('noCitiesFound') || 'No matching cities found'}
                    </Typography>
                  }
                  PaperComponent={CustomAutocompletePaper}
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
                      <PlaceRoundedIcon sx={{ fontSize: 19, color: '#00F2FE' }} />
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                          {getCityDisplayName(option, currentLanguage)}
                        </Typography>
                        {option.region && (
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
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
                          <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5, mr: 1, flexShrink: 0 }}>
                            <PlaceRoundedIcon sx={{ fontSize: 20, color: '#00F2FE' }} />
                            {params.InputProps.startAdornment}
                          </Box>
                        ),
                        endAdornment: (
                          <>
                            {isSearchingCity ? (
                              <CircularProgress sx={{ color: '#00F2FE', mr: 1 }} size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '14px',
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.85)',
                          color: isDark ? '#ffffff' : '#0f172a',
                          fontSize: '0.92rem',
                          transition: 'all 0.2s ease',
                          '& fieldset': {
                            borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(0, 242, 254, 0.45)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#00F2FE',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00F2FE',
                            borderWidth: '2px',
                            boxShadow: isDark ? '0 0 12px rgba(0, 242, 254, 0.25)' : '0 0 12px rgba(0, 242, 254, 0.3)',
                          },
                          '& .MuiAutocomplete-input': {
                            color: isDark ? '#ffffff' : '#0f172a',
                          },
                          '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
                            color: isDark ? '#94a3b8' : '#64748b',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Box>

              {/* Next Step Action Button matching CountryWelcomeDialog */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                  disabled={!selectedCountry}
                  endIcon={isRTLMode ? <ArrowBackRoundedIcon /> : <ArrowForwardRoundedIcon />}
                  sx={{
                    py: { xs: 1.15, sm: 1.25 },
                    borderRadius: '14px',
                    fontSize: '0.94rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    backgroundColor: '#00F2FE',
                    color: '#020617',
                    boxShadow: '0 6px 24px rgba(0, 242, 254, 0.35)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      backgroundColor: '#38f6ff',
                      boxShadow: '0 8px 32px rgba(0, 242, 254, 0.55)',
                      transform: 'translateY(-1px)',
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(51, 65, 85, 0.5)',
                      color: 'rgba(255, 255, 255, 0.4)',
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
              {/* Slide 2 Header */}
              <Box sx={{ mb: { xs: 1.5, sm: 1.75 }, pt: { xs: 0.5, sm: 0.75 }, px: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.2rem', sm: '1.35rem', md: '1.45rem' },
                    lineHeight: 1.25,
                    color: isDark ? '#ffffff' : '#0f172a',
                    mb: 0.5,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {selectedType === 'found'
                    ? t('selectWhatYouFound') || 'Select the things you found'
                    : t('selectWhatYouLost') || 'Select the things you lost'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? '#cbd5e1' : '#475569',
                    lineHeight: 1.45,
                    fontSize: { xs: '0.82rem', sm: '0.88rem' },
                    maxWidth: 420,
                    mx: 'auto',
                  }}
                >
                  {t('selectCategoriesSubtitle') ||
                    'Choose one or multiple categories to find matching reports.'}
                </Typography>
              </Box>

              {/* Controls bar: search input + counter & clear */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.25,
                  mb: 1.25,
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
                        <FilterListRounded sx={{ fontSize: 18, color: '#00F2FE' }} />
                      </InputAdornment>
                    ),
                    endAdornment: categoryFilterQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setCategoryFilterQuery('')} sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    flex: '1 1 180px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.85)',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.84rem',
                      '& fieldset': {
                        borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(0, 242, 254, 0.45)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#00F2FE',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00F2FE',
                      },
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
                        backgroundColor: 'rgba(0, 242, 254, 0.16)',
                        color: isDark ? '#00F2FE' : '#0284c7',
                        border: isDark ? '1px solid rgba(0, 242, 254, 0.35)' : '1px solid rgba(0, 242, 254, 0.4)',
                      }}
                    />
                  )}
                  {selectedCategories.length > 0 ? (
                    <Button
                      size="small"
                      onClick={handleClearCategories}
                      sx={{
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        color: isDark ? '#38bdf8' : '#0284c7',
                        p: 0.5,
                        '&:hover': { color: '#00F2FE' },
                      }}
                    >
                      {t('clearSelection') || 'Clear'}
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      onClick={handleSelectAllCategories}
                      sx={{
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        color: isDark ? '#38bdf8' : '#0284c7',
                        p: 0.5,
                        '&:hover': { color: '#00F2FE' },
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
                  gap: { xs: 0.85, sm: 1 },
                  maxHeight: { xs: '32vh', sm: '210px', md: '230px' },
                  overflowY: 'auto',
                  pr: 0.5,
                  mb: { xs: 2, sm: 2.25 },
                  '&::-webkit-scrollbar': { width: 5 },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.7)',
                    borderRadius: 8,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.8)',
                    borderRadius: 8,
                    '&:hover': { backgroundColor: 'rgba(0, 242, 254, 0.5)' },
                  },
                }}
              >
                {displayedCategories.map((cat) => {
                  const catId = cat._id || cat.id;
                  const isSelected = selectedCategories.includes(catId);
                  const IconComponent = getCategoryIcon(cat.code);
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
                        p: { xs: 1, sm: 1.15 },
                        borderRadius: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 0.5,
                        transition: 'all 0.2s ease',
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(0, 242, 254, 0.18)' : 'rgba(0, 242, 254, 0.14)')
                          : (isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)'),
                        border: isSelected
                          ? '2px solid #00F2FE'
                          : (isDark ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(0, 242, 254, 0.35)'),
                        boxShadow: isSelected
                          ? (isDark ? '0 0 18px rgba(0, 242, 254, 0.35)' : '0 0 16px rgba(0, 242, 254, 0.25)')
                          : 'none',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(0, 242, 254, 0.24)' : 'rgba(0, 242, 254, 0.2)')
                            : (isDark ? 'rgba(0, 242, 254, 0.08)' : 'rgba(0, 242, 254, 0.1)'),
                          borderColor: '#00F2FE',
                          boxShadow: '0 0 14px rgba(0, 242, 254, 0.2)',
                        },
                      }}
                    >
                      {isSelected && (
                        <CheckCircleRounded
                          sx={{
                            position: 'absolute',
                            top: 4,
                            insetInlineEnd: 4,
                            fontSize: 15,
                            color: '#00F2FE',
                          }}
                        />
                      )}
                      <Box
                        sx={{
                          width: { xs: 32, sm: 36 },
                          height: { xs: 32, sm: 36 },
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(0, 242, 254, 0.25)' : 'rgba(0, 242, 254, 0.22)')
                            : (isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)'),
                          color: isSelected ? (isDark ? '#00F2FE' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b'),
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <IconComponent sx={{ fontSize: { xs: 18, sm: 20 } }} />
                      </Box>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#cbd5e1' : '#334155'),
                          fontSize: { xs: '0.72rem', sm: '0.76rem' },
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
                  mt: 'auto',
                  pt: 0.5,
                }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleBack}
                  startIcon={isRTLMode ? <ArrowForwardRoundedIcon /> : <ArrowBackRoundedIcon />}
                  sx={{
                    borderRadius: '14px',
                    px: { xs: 2.5, sm: 3 },
                    py: { xs: 1.1, sm: 1.2 },
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.85)',
                    borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(0, 242, 254, 0.45)',
                    color: isDark ? '#cbd5e1' : '#475569',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      borderColor: '#00F2FE',
                      color: isDark ? '#ffffff' : '#0f172a',
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
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
                    borderRadius: '14px',
                    px: { xs: 3, sm: 3.5 },
                    py: { xs: 1.1, sm: 1.2 },
                    fontSize: '0.94rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    backgroundColor: '#00F2FE',
                    color: '#020617',
                    boxShadow: '0 6px 24px rgba(0, 242, 254, 0.35)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      backgroundColor: '#38f6ff',
                      boxShadow: '0 8px 32px rgba(0, 242, 254, 0.55)',
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
