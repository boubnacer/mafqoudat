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
  LocationOn,
  GpsFixed as GpsFixedIcon,
  GpsOff as GpsOffIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
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
  const isRTLDirection = currentLanguage === 'ar' || isRTLMode;

  const reduxCountry = useSelector(selectCurrentCountry);

  // Wizard state: Step 1 (Location: Country & City) -> Step 2 (Categories: Multi-select)
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const selectedType = initialType || 'lost'; // Preserved from the button user clicked
  const [selectedCountry, setSelectedCountry] = useState(reduxCountry || '');
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]); // Multiple category IDs
  const [categoryFilterQuery, setCategoryFilterQuery] = useState('');

  // Unified City Dropdown state (matching NewPostForm / StepLocation)
  const [citySearchQuery, setCitySearchQuery] = useState(''); // Text typed inside dropdown search input
  const [searchResults, setSearchResults] = useState([]); // Results returned from search cascade
  const [isSearching, setIsSearching] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null); // null | 'denied' | 'error'

  const citySearchDebounceRef = useRef(null);
  const citySearchRequestIdRef = useRef(0);
  const cityDropdownContainerRef = useRef(null);

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

  // Reset and sync state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setDirection(1);
      if (reduxCountry) {
        setSelectedCountry(reduxCountry);
      } else if (countriesList.length > 0) {
        const morocco = countriesList.find((c) => c?.code?.toUpperCase() === 'MA');
        setSelectedCountry((morocco?._id || morocco?.id) || countriesList[0]._id || countriesList[0].id);
      }
      setSelectedCity(null);
      setSelectedCategories([]);
      setCategoryFilterQuery('');
      setCitySearchQuery('');
      setSearchResults([]);
      setShowCityDropdown(false);
    }
  }, [open, reduxCountry, countriesList]);

  // Close city dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCityDropdown && cityDropdownContainerRef.current && !cityDropdownContainerRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCityDropdown]);

  // Cancel any pending debounced city search on unmount
  useEffect(() => {
    return () => {
      if (citySearchDebounceRef.current) {
        clearTimeout(citySearchDebounceRef.current);
      }
    };
  }, []);

  // If no selected country yet, default to reduxCountry or Morocco ('MA') or first available country
  useEffect(() => {
    if (!selectedCountry && countriesList.length > 0) {
      if (reduxCountry) {
        setSelectedCountry(reduxCountry);
      } else {
        const morocco = countriesList.find((c) => c?.code?.toUpperCase() === 'MA');
        setSelectedCountry((morocco?._id || morocco?.id) || countriesList[0]._id || countriesList[0].id);
      }
    }
  }, [selectedCountry, countriesList, reduxCountry]);

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

  // Maps a city result's source to a label + color badge (matches NewPostForm / StepLocation)
  const getCitySourceInfo = useCallback((source) => {
    const sourceMap = {
      geonames: {
        label: { en: 'GeoNames', fr: 'GeoNames', ar: 'GeoNames' },
        color: '#0284c7',
      },
      google: {
        label: { en: 'Google Places', fr: 'Google Places', ar: 'Google Places' },
        color: '#f59e0b',
      },
      database: {
        label: { en: 'Database', fr: 'Base de données', ar: 'قاعدة البيانات' },
        color: '#10b981',
      },
    };
    const entry = sourceMap[source] || sourceMap.database;
    return { label: entry.label[currentLanguage] || entry.label.en, color: entry.color };
  }, [currentLanguage]);

  const sourceCaptionPrefix = currentLanguage === 'ar' ? 'المصدر' : 'Source';

  // Disambiguation context (region / state / formatted address)
  const getCityExtraInfo = useCallback((city) => {
    if (city?.adminName1) {
      const countryLabel = city.country?.label || selectedCountryObj?.name || selectedCountryObj?.label;
      return countryLabel ? `${city.adminName1}, ${countryLabel}` : city.adminName1;
    }
    if (city?.source === 'google' && city?.formattedAddress) {
      return city.formattedAddress;
    }
    return city?.region || null;
  }, [selectedCountryObj]);

  // Hybrid search (DB -> GeoNames -> Google Places)
  const searchCitiesHybrid = useCallback(async (searchQuery, targetCountryCode) => {
    try {
      if (!searchQuery || searchQuery.length < 2) return [];
      const validCountryCode = targetCountryCode && targetCountryCode.length === 2
        ? targetCountryCode.toUpperCase()
        : null;
      let url = `${BASE_URL}/cities/search?q=${encodeURIComponent(searchQuery)}&language=${currentLanguage || 'en'}&limit=10`;
      if (validCountryCode) {
        url += `&countryCode=${validCountryCode}`;
      }
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('❌ City hybrid search error:', error);
      return [];
    }
  }, [currentLanguage]);

  // Traditional search fallback
  const searchCitiesTraditional = useCallback(async (searchQuery, countryId) => {
    try {
      const url = `${BASE_URL}/cities/search-name?query=${encodeURIComponent(searchQuery)}&countryId=${countryId}&limit=10`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.map((city) => ({
          ...city,
          source: 'database',
          _id: city._id || city.id,
        }));
      }
      return [];
    } catch (error) {
      return [];
    }
  }, []);

  // Cascading performCitySearch with sequential requestId guarding
  const performCitySearch = useCallback(async (query, requestId) => {
    const isStale = () => requestId !== citySearchRequestIdRef.current;
    const countryId = selectedCountry;
    let targetCountryCode = countryCode;
    if (typeof targetCountryCode === 'string') {
      targetCountryCode = targetCountryCode.trim().toUpperCase();
    }
    if (!(targetCountryCode && targetCountryCode.length === 2)) {
      targetCountryCode = null;
    }

    try {
      if (query.length >= 2 && (countryId || targetCountryCode)) {
        // 1. Try hybrid search first (DB + GeoNames + Google Places)
        const results = await searchCitiesHybrid(query, targetCountryCode);
        if (isStale()) return;
        if (results.length > 0) {
          setSearchResults(results);
          return;
        }

        // 2. Fallback to traditional search if countryId exists
        if (countryId) {
          const fallbackResults = await searchCitiesTraditional(query, countryId);
          if (isStale()) return;
          if (fallbackResults.length > 0) {
            setSearchResults(fallbackResults);
            return;
          }
        }

        // 3. Final fallback: filter existing country cities locally
        const localResults = countryCities.filter((city) =>
          city.label?.toLowerCase().includes(query.toLowerCase()) ||
          city.name?.toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.ar?.toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.fr?.toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.en?.toLowerCase().includes(query.toLowerCase())
        ).map((city) => ({
          ...city,
          source: 'database',
          _id: city._id || city.id,
        }));
        setSearchResults(localResults);
      } else if (query.length > 0) {
        const localResults = countryCities.filter((city) =>
          city.label?.toLowerCase().includes(query.toLowerCase()) ||
          city.name?.toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.ar?.toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.fr?.toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.en?.toLowerCase().includes(query.toLowerCase())
        ).map((city) => ({
          ...city,
          source: 'database',
          _id: city._id || city.id,
        }));
        if (!isStale()) setSearchResults(localResults);
      }
    } catch (error) {
      console.error('❌ City search error:', error);
      if (!isStale()) setSearchResults([]);
    } finally {
      if (!isStale()) setIsSearching(false);
    }
  }, [searchCitiesHybrid, searchCitiesTraditional, selectedCountry, countryCode, countryCities]);

  // Handle city search input change (debounced and sequence-guarded)
  const handleCitySearchChange = useCallback((event) => {
    const query = event.target.value;
    setCitySearchQuery(query);
    if (query.trim().length > 0) {
      setShowCityDropdown(true);
    }
    citySearchRequestIdRef.current += 1;
    const requestId = citySearchRequestIdRef.current;
    if (citySearchDebounceRef.current) {
      clearTimeout(citySearchDebounceRef.current);
    }
    setSearchResults([]);
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    citySearchDebounceRef.current = setTimeout(() => {
      performCitySearch(query, requestId);
    }, 300);
  }, [performCitySearch]);

  const filteredCountryCities = useMemo(() => {
    if (!countryCities || countryCities.length === 0) return [];
    return countryCities.map((c) => ({
      ...c,
      source: c.source || 'database',
    }));
  }, [countryCities]);

  // Handle city selection (auto-saves external API cities to DB dynamically)
  const handleCitySelect = async (city) => {
    let resolvedCity = city;
    setSelectedCity(resolvedCity);
    setCitySearchQuery('');
    setShowCityDropdown(false);

    // If an external API city was selected without a DB _id, persist it to the database
    // so it gets a permanent MongoDB _id and is stored in DB
    if (!resolvedCity._id && selectedCountry) {
      try {
        const cityName = resolvedCity.label || resolvedCity.name || getCityDisplayName(resolvedCity, currentLanguage);
        const res = await fetch(`${BASE_URL}/cities/dynamic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityName,
            countryId: selectedCountry,
            sourceLanguage: currentLanguage || 'en',
            cityData: resolvedCity,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            resolvedCity = data.data;
            setSelectedCity(data.data);
          }
        }
      } catch (err) {
        console.error('Error auto-saving API city on select:', err);
      }
    }
  };

  // "My Location" GPS button handler (reverse geocodes browser coords)
  const handleMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('error');
      return;
    }
    setLocationError(null);
    setIsDetectingLocation(true);
    setShowCityDropdown(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const resp = await fetch(
            `${BASE_URL}/cities/reverse-geocode?lat=${latitude}&lng=${longitude}&language=${currentLanguage || 'en'}`
          );
          const data = await resp.json();
          if (data.success && data.data) {
            await handleCitySelect(data.data);
          } else {
            setLocationError('error');
          }
        } catch {
          setLocationError('error');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        setLocationError(err.code === 1 ? 'denied' : 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [currentLanguage]);

  const handleCityDropdownToggle = () => {
    if (!selectedCountryObj) return;
    setShowCityDropdown((prev) => {
      const next = !prev;
      if (next) {
        setCitySearchQuery('');
        setSearchResults([]);
      }
      return next;
    });
  };

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
      setCitySearchQuery('');
      setSearchResults([]);
      setShowCityDropdown(false);
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

  const handleSearchSubmit = async () => {
    let finalCity = selectedCity;

    // If an external city was selected without a DB _id, persist it to the database
    // so it gets a permanent MongoDB _id and is saved for future New Post creations without calling external APIs again.
    if (finalCity && !finalCity._id && selectedCountry) {
      try {
        const cityName = finalCity.label || finalCity.name || getCityDisplayName(finalCity, currentLanguage);
        const res = await fetch(`${BASE_URL}/cities/dynamic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityName,
            countryId: selectedCountry,
            sourceLanguage: currentLanguage || 'en',
            cityData: finalCity,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            finalCity = json.data;
            setSelectedCity(json.data);
          }
        }
      } catch (err) {
        console.error('Error auto-saving searched city:', err);
      }
    }

    // 1. Dispatch updated country to Redux store and confirm in localStorage
    if (selectedCountry) {
      dispatch(setCurrentCountry({ currentCountry: selectedCountry }));
      localStorage.setItem('countryConfirmed', 'true');
    }

    // 2. Build URL query params
    const params = new URLSearchParams();
    const flParam = selectedType === 'found' ? (foundsId || '') : (lostsId || '');
    if (flParam) params.set('fl', flParam);

    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','));
    }

    const cityParam = finalCity
      ? (finalCity._id || finalCity.id || finalCity.code || '')
      : '';
    if (cityParam) params.set('city', cityParam);

    if (selectedCountry) params.set('country', selectedCountry);

    // 3. Close dialog and navigate
    onClose();
    navigate(`/dash/posts?${params.toString()}`, {
      state: { selectedCityObj: finalCity }
    });
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
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: isDark
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px -10px rgba(0, 242, 254, 0.25)'
            : '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 35px -5px rgba(0, 242, 254, 0.25)',
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
          background: 'linear-gradient(90deg, transparent 5%, rgba(0, 242, 254, 0.7) 50%, transparent 95%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Cyber dot matrix SVG background with Corner Clusters matching Statistics style */}
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: isDark ? 0.5 : 0.85,
          zIndex: 0,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dot-matrix-guided" width="4.5" height="4.5" patternUnits="userSpaceOnUse">
            <circle cx="2.25" cy="2.25" r={isDark ? 0.72 : 0.9} fill={theme.custom.color.brandLogo} />
          </pattern>
          {/* In LTR: top-left (cx=0%, cy=0%) and bottom-right (cx=100%, cy=100%). In RTL: inversed to top-right (cx=100%, cy=0%) and bottom-left (cx=0%, cy=100%) */}
          <radialGradient
            id="top-glow-guided"
            cx={isRTLDirection ? "100%" : "0%"}
            cy="0%"
            r="48%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id="bottom-glow-guided"
            cx={isRTLDirection ? "0%" : "100%"}
            cy="100%"
            r="48%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <mask id="top-mask-guided">
            <rect width="100%" height="100%" fill="url(#top-glow-guided)" />
          </mask>
          <mask id="bottom-mask-guided">
            <rect width="100%" height="100%" fill="url(#bottom-glow-guided)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-matrix-guided)" mask="url(#top-mask-guided)" />
        <rect width="100%" height="100%" fill="url(#dot-matrix-guided)" mask="url(#bottom-mask-guided)" />
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

              {/* Unified City Dropdown (matching NewPostForm / StepLocation) */}
              <Box sx={{ mb: { xs: 2.25, sm: 2.75 }, textAlign: 'start', position: 'relative' }} ref={cityDropdownContainerRef} data-testid="city-dropdown">
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

                {/* Read-Only City Display Input (Dropdown trigger) */}
                <TextField
                  fullWidth
                  placeholder={
                    !selectedCountryObj
                      ? (t('selectCountryFirst') || (currentLanguage === 'ar' ? 'اختر الدولة أولاً' : currentLanguage === 'fr' ? 'Choisissez le pays d\'abord' : 'Select country first'))
                      : (currentLanguage === 'ar' ? 'اختر مدينة...' : currentLanguage === 'fr' ? 'Sélectionner une ville...' : 'Select a city...')
                  }
                  value={selectedCity ? getCityDisplayName(selectedCity, currentLanguage) : ''}
                  inputProps={{ readOnly: true }}
                  disabled={!selectedCountryObj}
                  onClick={handleCityDropdownToggle}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5, mr: 1, flexShrink: 0 }}>
                        <LocationOn sx={{ fontSize: 20, color: '#00F2FE' }} />
                      </Box>
                    ),
                    endAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {selectedCity && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCity(null);
                              setCitySearchQuery('');
                              setSearchResults([]);
                            }}
                            sx={{ color: isDark ? '#94a3b8' : '#64748b', p: 0.5 }}
                          >
                            <CloseIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        )}
                        {isSearching ? (
                          <CircularProgress size={18} sx={{ color: '#00F2FE' }} />
                        ) : (
                          <KeyboardArrowDownIcon
                            sx={{
                              color: isDark ? '#94a3b8' : '#64748b',
                              transform: showCityDropdown ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s ease',
                            }}
                          />
                        )}
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.85)',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.92rem',
                      cursor: selectedCountryObj ? 'pointer' : 'default',
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
                      '& .MuiInputBase-input': {
                        cursor: selectedCountryObj ? 'pointer' : 'default',
                      },
                    },
                  }}
                />

                {/* Dropdown Box Anchored Under Input */}
                {showCityDropdown && selectedCountryObj && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      insetInlineStart: 0,
                      insetInlineEnd: 0,
                      zIndex: 9999,
                      backgroundColor: isDark ? 'rgba(11, 18, 32, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '16px',
                      boxShadow: isDark
                        ? '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 242, 254, 0.15)'
                        : '0 20px 50px rgba(15, 23, 42, 0.12), 0 0 25px rgba(0, 242, 254, 0.15)',
                      maxHeight: 380,
                      overflow: 'hidden',
                      mt: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Search Input inside Dropdown */}
                    <Box sx={{
                      p: 1.5,
                      borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                    }}>
                      <TextField
                        fullWidth
                        size="small"
                        autoFocus
                        placeholder={currentLanguage === 'ar' ? 'ابحث عن مدينة...' : currentLanguage === 'fr' ? 'Rechercher une ville...' : 'Search for a city...'}
                        value={citySearchQuery}
                        onChange={handleCitySearchChange}
                        InputProps={{
                          startAdornment: isSearching ? (
                            <CircularProgress size={16} sx={{ color: '#00F2FE', marginInlineEnd: 1 }} />
                          ) : (
                            <LocationOn sx={{ color: isDark ? '#94a3b8' : '#64748b', marginInlineEnd: 1, fontSize: 18 }} />
                          ),
                          endAdornment: citySearchQuery ? (
                            <IconButton size="small" onClick={() => { setCitySearchQuery(''); setSearchResults([]); }}>
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          ) : null,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(241, 245, 249, 0.8)',
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontSize: '0.88rem',
                            '& fieldset': {
                              borderColor: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(203, 213, 225, 0.8)',
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
                    </Box>

                    {/* My Location button */}
                    <Box
                      onClick={isDetectingLocation ? undefined : handleMyLocation}
                      sx={{
                        px: 2,
                        py: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        cursor: isDetectingLocation ? 'default' : 'pointer',
                        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                        backgroundColor: isDark ? 'rgba(0, 242, 254, 0.06)' : 'rgba(0, 242, 254, 0.04)',
                        '&:hover': isDetectingLocation ? {} : {
                          backgroundColor: isDark ? 'rgba(0, 242, 254, 0.14)' : 'rgba(0, 242, 254, 0.08)',
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      {isDetectingLocation ? (
                        <CircularProgress size={18} sx={{ color: '#00F2FE', flexShrink: 0 }} />
                      ) : locationError === 'denied' ? (
                        <GpsOffIcon sx={{ fontSize: 18, color: '#f59e0b', flexShrink: 0 }} />
                      ) : (
                        <GpsFixedIcon sx={{ fontSize: 18, color: '#00F2FE', flexShrink: 0 }} />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.86rem',
                            color: locationError === 'denied'
                              ? '#f59e0b'
                              : locationError === 'error'
                              ? '#ef4444'
                              : (isDark ? '#38BDF8' : '#0284c7'),
                            lineHeight: 1.3,
                          }}
                        >
                          {isDetectingLocation
                            ? (t('myLocationDetecting') || (currentLanguage === 'ar' ? 'جارٍ تحديد موقعك...' : currentLanguage === 'fr' ? 'Détection de position...' : 'Detecting location...'))
                            : locationError === 'denied'
                            ? (t('myLocationDenied') || (currentLanguage === 'ar' ? 'تم رفض إذن الموقع' : currentLanguage === 'fr' ? 'Accès à la position refusé' : 'Location permission denied'))
                            : locationError === 'error'
                            ? (t('myLocationError') || (currentLanguage === 'ar' ? 'تعذر تحديد الموقع' : currentLanguage === 'fr' ? 'Position introuvable' : 'Could not detect location'))
                            : (t('myLocation') || (currentLanguage === 'ar' ? 'تحديد موقعي' : currentLanguage === 'fr' ? 'Ma position' : 'My Location'))}
                        </Typography>
                        {!isDetectingLocation && !locationError && (
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', fontSize: '0.74rem', lineHeight: 1.2 }}>
                            {currentLanguage === 'ar'
                              ? 'اضغط لتحديد موقعك تلقائياً'
                              : currentLanguage === 'fr'
                              ? 'Appuyez pour détecter votre position'
                              : 'Tap to auto-detect your position'}
                          </Typography>
                        )}
                        {locationError && (
                          <Typography variant="caption" sx={{ color: locationError === 'denied' ? '#f59e0b' : '#ef4444', display: 'block', fontSize: '0.74rem', lineHeight: 1.2 }}>
                            {locationError === 'denied'
                              ? (currentLanguage === 'ar' ? 'اسمح بالوصول إلى الموقع من إعدادات المتصفح' : currentLanguage === 'fr' ? 'Autorisez la localisation dans votre navigateur' : 'Allow location access in your browser settings')
                              : (currentLanguage === 'ar' ? 'حاول مجدداً أو ابحث يدوياً' : currentLanguage === 'fr' ? 'Réessayez ou cherchez manuellement' : 'Try again or search manually')}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Cities Scrollable List */}
                    <Box sx={{
                      maxHeight: 260,
                      overflowY: 'auto',
                      p: 0.5,
                      '&::-webkit-scrollbar': { width: 5 },
                      '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(203, 213, 225, 0.8)',
                        borderRadius: 8,
                        '&:hover': { backgroundColor: 'rgba(0, 242, 254, 0.4)' },
                      },
                    }}>
                      {citySearchQuery.trim() && isSearching ? (
                        <Box sx={{ p: 3, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <CircularProgress size={16} sx={{ color: '#00F2FE' }} />
                          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.86rem' }}>
                            {currentLanguage === 'ar' ? 'جارٍ البحث...' : currentLanguage === 'fr' ? 'Recherche...' : 'Searching...'}
                          </Typography>
                        </Box>
                      ) : citySearchQuery.trim() && searchResults.length > 0 ? (
                        <>
                          <Box sx={{
                            p: 1,
                            px: 1.5,
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                            backgroundColor: isDark ? 'rgba(11, 18, 32, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#00F2FE', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.72rem' }}>
                              {currentLanguage === 'ar' ? 'نتائج البحث' : currentLanguage === 'fr' ? 'Résultats de recherche' : 'Search Results'}
                            </Typography>
                          </Box>
                          {searchResults.map((city, index) => {
                            const isSelected = selectedCity && (
                              (selectedCity._id && (selectedCity._id === city._id || selectedCity._id === city.id)) ||
                              (selectedCity.code && selectedCity.code === city.code)
                            );
                            const sourceInfo = getCitySourceInfo(city.source);
                            const extraInfo = getCityExtraInfo(city);

                            return (
                              <Box
                                key={city._id || city.code || city.id || index}
                                onClick={() => handleCitySelect(city)}
                                sx={{
                                  p: 1.5,
                                  cursor: 'pointer',
                                  borderRadius: '10px',
                                  backgroundColor: isSelected
                                    ? (isDark ? 'rgba(0, 242, 254, 0.16)' : 'rgba(0, 242, 254, 0.14)')
                                    : 'transparent',
                                  borderBottom: index < searchResults.length - 1 && !isSelected ? `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` : 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.25,
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: isDark ? 'rgba(0, 242, 254, 0.1)' : 'rgba(0, 242, 254, 0.08)',
                                    transform: isRTLDirection ? 'translateX(-3px)' : 'translateX(3px)',
                                  },
                                }}
                              >
                                <LocationOn sx={{ fontSize: 20, color: '#00F2FE', flexShrink: 0 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.9rem' }}>
                                    {getCityDisplayName(city, currentLanguage)}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', fontSize: '0.76rem' }}>
                                    {city.labels?.ar && currentLanguage !== 'ar' && ` • ${city.labels.ar}`}
                                    {city.labels?.fr && currentLanguage !== 'fr' && ` • ${city.labels.fr}`}
                                    {city.labels?.en && currentLanguage !== 'en' && ` • ${city.labels.en}`}
                                  </Typography>
                                  {extraInfo && (
                                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', fontSize: '0.74rem' }}>
                                      {extraInfo}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" sx={{
                                    display: 'block',
                                    fontWeight: 600,
                                    color: sourceInfo.color,
                                    fontSize: '0.72rem',
                                    mt: 0.25,
                                  }}>
                                    {sourceCaptionPrefix}: {sourceInfo.label}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                        </>
                      ) : citySearchQuery.trim() && searchResults.length === 0 && !isSearching ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.86rem' }}>
                            {t('noCitiesFound') || (currentLanguage === 'ar' ? 'لم يتم العثور على مدن' : currentLanguage === 'fr' ? 'Aucune ville trouvée' : 'No cities found')}
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          {filteredCountryCities.length > 0 ? (
                            filteredCountryCities.map((city, index) => {
                              const isSelected = selectedCity && (
                                (selectedCity._id && (selectedCity._id === city._id || selectedCity._id === city.id)) ||
                                (selectedCity.code && selectedCity.code === city.code)
                              );
                              const sourceInfo = getCitySourceInfo(city.source);
                              const extraInfo = getCityExtraInfo(city);

                              return (
                                <Box
                                  key={city._id || city.code || city.id || index}
                                  onClick={() => handleCitySelect(city)}
                                  sx={{
                                    p: 1.5,
                                    cursor: 'pointer',
                                    borderRadius: '10px',
                                    backgroundColor: isSelected
                                      ? (isDark ? 'rgba(0, 242, 254, 0.16)' : 'rgba(0, 242, 254, 0.14)')
                                      : 'transparent',
                                    borderBottom: index < filteredCountryCities.length - 1 && !isSelected ? `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.25,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: isDark ? 'rgba(0, 242, 254, 0.1)' : 'rgba(0, 242, 254, 0.08)',
                                      transform: isRTLDirection ? 'translateX(-3px)' : 'translateX(3px)',
                                    },
                                  }}
                                >
                                  <LocationOn sx={{ fontSize: 20, color: '#00F2FE', flexShrink: 0 }} />
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.9rem' }}>
                                      {getCityDisplayName(city, currentLanguage)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', fontSize: '0.76rem' }}>
                                      {city.labels?.ar && currentLanguage !== 'ar' && ` • ${city.labels.ar}`}
                                      {city.labels?.fr && currentLanguage !== 'fr' && ` • ${city.labels.fr}`}
                                      {city.labels?.en && currentLanguage !== 'en' && ` • ${city.labels.en}`}
                                    </Typography>
                                    {extraInfo && (
                                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', fontSize: '0.74rem' }}>
                                        {extraInfo}
                                      </Typography>
                                    )}
                                    <Typography variant="caption" sx={{
                                      display: 'block',
                                      fontWeight: 600,
                                      color: sourceInfo.color,
                                      fontSize: '0.72rem',
                                      mt: 0.25,
                                    }}>
                                      {sourceCaptionPrefix}: {sourceInfo.label}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })
                          ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.86rem' }}>
                                {t('noCitiesFound') || (currentLanguage === 'ar' ? 'لم يتم العثور على مدن' : currentLanguage === 'fr' ? 'Aucune ville trouvée' : 'No cities found')}
                              </Typography>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  </Box>
                )}
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
