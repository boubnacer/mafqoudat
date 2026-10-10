import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  Box,
  Typography,
  Button,
  IconButton,
  Autocomplete,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Fade,
  Tooltip,
  useTheme,
} from '@mui/material';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { setMode } from '../../app/state';
import { useTranslation } from '../../utils/translations';
import { useLanguage } from '../../utils/languageContext';
import { languageStorage } from '../../utils/authStorage';

// Multilingual country names mapping for reliable display across EN, AR, and FR
const countryCodeToName = {
  MA: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' },
  DZ: { en: 'Algeria', ar: 'الجزائر', fr: 'Algérie' },
  TN: { en: 'Tunisia', ar: 'تونس', fr: 'Tunisie' },
  EG: { en: 'Egypt', ar: 'مصر', fr: 'Égypte' },
  SA: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', fr: 'Arabie Saoudite' },
  AE: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', fr: 'Émirats Arabes Unis' },
  QA: { en: 'Qatar', ar: 'قطر', fr: 'Qatar' },
  KW: { en: 'Kuwait', ar: 'الكويت', fr: 'Koweït' },
  BH: { en: 'Bahrain', ar: 'البحرين', fr: 'Bahreïn' },
  OM: { en: 'Oman', ar: 'عُمان', fr: 'Oman' },
  JO: { en: 'Jordan', ar: 'الأردن', fr: 'Jordanie' },
  LB: { en: 'Lebanon', ar: 'لبنان', fr: 'Liban' },
  SY: { en: 'Syria', ar: 'سوريا', fr: 'Syrie' },
  IQ: { en: 'Iraq', ar: 'العراق', fr: 'Irak' },
  PS: { en: 'Palestine', ar: 'فلسطين', fr: 'Palestine' },
  LY: { en: 'Libya', ar: 'ليبيا', fr: 'Libye' },
  SD: { en: 'Sudan', ar: 'السودان', fr: 'Soudan' },
  SO: { en: 'Somalia', ar: 'الصومال', fr: 'Somalie' },
  DJ: { en: 'Djibouti', ar: 'جيبوتي', fr: 'Djibouti' },
  KM: { en: 'Comoros', ar: 'جزر القمر', fr: 'Comores' },
  MR: { en: 'Mauritania', ar: 'موريتانيا', fr: 'Mauritanie' },
  ML: { en: 'Mali', ar: 'مالي', fr: 'Mali' },
  NE: { en: 'Niger', ar: 'النيجر', fr: 'Niger' },
  TD: { en: 'Chad', ar: 'تشاد', fr: 'Tchad' },
  CF: { en: 'Central African Republic', ar: 'جمهورية أفريقيا الوسطى', fr: 'République Centrafricaine' },
  FR: { en: 'France', ar: 'فرنسا', fr: 'France' },
  ES: { en: 'Spain', ar: 'إسبانيا', fr: 'Espagne' },
  DE: { en: 'Germany', ar: 'ألمانيا', fr: 'Allemagne' },
  US: { en: 'United States', ar: 'الولايات المتحدة', fr: 'États-Unis' },
  CA: { en: 'Canada', ar: 'كندا', fr: 'Canada' },
  GB: { en: 'United Kingdom', ar: 'المملكة المتحدة', fr: 'Royaume-Uni' },
  TR: { en: 'Turkey', ar: 'تركيا', fr: 'Turquie' },
  IT: { en: 'Italy', ar: 'إيطاليا', fr: 'Italie' },
  NL: { en: 'Netherlands', ar: 'هولندا', fr: 'Pays-Bas' },
  BE: { en: 'Belgium', ar: 'بلجيكا', fr: 'Belgique' },
};

const fallbackCountries = [
  {
    _id: '68a4b54ab46524c54c553ca9',
    code: 'MA',
    label: 'Morocco',
    labels: { en: 'MA', ar: 'MA', fr: 'MA' },
    names: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' },
    flag: '🇲🇦',
  },
];

const getCountryLabel = (option, lang) => {
  if (!option) return '';
  const currentLang = lang || 'en';

  if (option.names && option.names[currentLang]) {
    return option.names[currentLang];
  }

  if (option.labels && option.labels[currentLang]) {
    const label = option.labels[currentLang];
    if (label && label.length === 2 && label === label.toUpperCase()) {
      return countryCodeToName[label]?.[currentLang] || option.code;
    }
    return label;
  }

  if (option.code && countryCodeToName[option.code]) {
    return countryCodeToName[option.code][currentLang] || option.code;
  }

  return option.label || option.code || '';
};

const languageOptions = [
  { code: 'ar', label: 'العربية (Arabic)', flag: '🇲🇦' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français (French)', flag: '🇫🇷' },
];

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

const CountryWelcomeDialog = ({
  open,
  onConfirm,
  countriesData,
  detectedCountryCode,
  currentCountryId,
}) => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.global.mode);
  const isDark = mode === 'dark';
  const { t } = useTranslation();
  const { currentLanguage, setLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const isArabic = currentLanguage === 'ar';
  const isFrench = currentLanguage === 'fr';

  const countriesList = useMemo(() => {
    if (countriesData?.entities && countriesData?.ids?.length > 0) {
      return countriesData.ids.map((id) => countriesData.entities[id]).filter(Boolean);
    }
    return fallbackCountries;
  }, [countriesData]);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [userInteracted, setUserInteracted] = useState(false);

  // Initial selection: match detectedCountryCode, or currentCountryId, or Morocco ('MA') default
  useEffect(() => {
    if (!countriesList.length) return;

    if (!userInteracted) {
      let target = null;

      // 1. If IP detected a valid country in the list, pre-select it
      if (detectedCountryCode) {
        target = countriesList.find(
          (c) => c?.code && c.code.toUpperCase() === detectedCountryCode.toUpperCase()
        );
      }

      // 2. If current active country matches
      if (!target && currentCountryId) {
        target = countriesList.find((c) => (c?._id || c?.id) === currentCountryId);
      }

      // 3. Fallback to Morocco ('MA')
      if (!target) {
        target = countriesList.find((c) => c?.code && c.code.toUpperCase() === 'MA');
      }

      // 4. Fallback to first available country
      if (!target) {
        target = countriesList[0];
      }

      if (target) {
        setSelectedCountry(target);
      }
    }
  }, [detectedCountryCode, countriesList, currentCountryId, userInteracted]);

  const handleCountryChange = (_, newValue) => {
    if (newValue) {
      setUserInteracted(true);
      setSelectedCountry(newValue);
    }
  };

  const handleLanguageSelect = (newLang) => {
    if (!newLang) return;
    languageStorage.setLanguage(newLang, false);
    setLanguage(newLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  const handleThemeToggle = () => {
    dispatch(setMode());
  };

  const handleConfirm = () => {
    const chosen = selectedCountry || countriesList[0];
    const countryId = chosen?._id || chosen?.id;
    if (onConfirm && countryId) {
      onConfirm(countryId);
    }
  };

  if (!open) return null;

  // Localized texts synchronized with platform strings
  const titleText =
    t('welcomeCountryTitle') ||
    (isArabic ? 'مرحباً بك في مفقودات' : isFrench ? 'Bienvenue sur Mafqoudat' : 'Welcome to Mafqoudat');

  const descText =
    t('welcomeCountryDescription') ||
    (isArabic
      ? 'اختر بلدك ولغتك المفضلة لتصفح الإعلانات والموجودات في منطقتك.'
      : isFrench
      ? 'Choisissez votre pays et votre langue préférée pour voir les objets perdus et trouvés dans votre région.'
      : 'Choose your country and preferred language to view lost and found items in your area.');

  const languageLabel = isArabic
    ? 'اختر لغتك المفضلة'
    : isFrench
    ? 'Choisissez votre langue préférée'
    : 'Choose your preferred language';

  const countryLabel =
    t('chooseCountry') ||
    (isArabic ? 'اختر دولتك' : isFrench ? 'Choisissez votre pays' : 'Choose your country');

  const searchCountryPlaceholder =
    t('searchCountry') ||
    (isArabic ? 'ابحث عن الدولة...' : isFrench ? 'Rechercher un pays...' : 'Search country...');

  const confirmBtnText =
    t('confirmAndBrowse') ||
    (isArabic ? 'تأكيد ومتابعة' : isFrench ? 'Confirmer et continuer' : 'Confirm & Browse');

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        // Prevent dialog from closing on backdrop click or escape key
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        elevation: 0,
        sx: {
          backgroundColor: isDark ? 'rgba(11, 18, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderRadius: '24px',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: isDark
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px -10px rgba(0, 242, 254, 0.25)'
            : '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 35px -5px rgba(0, 242, 254, 0.25)',
          overflow: 'hidden',
          p: { xs: 3, sm: 4 },
          position: 'relative',
          color: isDark ? '#ffffff' : '#0f172a',
          direction: isRTL ? 'rtl' : 'ltr',
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

      {/* Cyber dot matrix SVG background with Corner Clusters */}
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: isDark ? 0.32 : 0.85,
          zIndex: 0,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dot-matrix-welcome" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r={isDark ? 1 : 1.35} fill={isDark ? '#00F2FE' : '#00C4DF'} />
          </pattern>
          <radialGradient id="tr-glow-welcome" cx="100%" cy="0%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bl-glow-welcome" cx="0%" cy="100%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <mask id="tr-mask-welcome">
            <rect width="100%" height="100%" fill="url(#tr-glow-welcome)" />
          </mask>
          <mask id="bl-mask-welcome">
            <rect width="100%" height="100%" fill="url(#bl-glow-welcome)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-matrix-welcome)" mask="url(#tr-mask-welcome)" />
        <rect width="100%" height="100%" fill="url(#dot-matrix-welcome)" mask="url(#bl-mask-welcome)" />
      </Box>

      {/* Theme Mode Toggle Button */}
      <Tooltip
        title={
          isDark
            ? (isArabic ? 'الوضع الفاتح' : isFrench ? 'Mode clair' : 'Light mode')
            : (isArabic ? 'الوضع الداكن' : isFrench ? 'Mode sombre' : 'Dark mode')
        }
      >
        <IconButton
          onClick={handleThemeToggle}
          size="small"
          aria-label="Toggle theme mode"
          sx={{
            position: 'absolute',
            top: 14,
            insetInlineEnd: 14,
            zIndex: 20,
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(241, 245, 249, 0.85)',
            border: isDark ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(0, 242, 254, 0.45)',
            color: isDark ? '#facc15' : '#0284c7',
            transition: 'all 0.25s ease',
            '&:hover': {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: 'rgba(0, 242, 254, 0.6)',
              boxShadow: isDark ? '0 0 12px rgba(0, 242, 254, 0.35)' : '0 0 12px rgba(0, 242, 254, 0.25)',
              transform: 'scale(1.05)',
            },
          }}
        >
          {isDark ? (
            <LightModeOutlinedIcon sx={{ fontSize: 20, color: '#facc15' }} />
          ) : (
            <DarkModeOutlinedIcon sx={{ fontSize: 20, color: '#0284c7' }} />
          )}
        </IconButton>
      </Tooltip>

      {/* Centered Capsule Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Header Badge with Website logoIcon */}
        <Box sx={{ mb: 2.5, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box
            sx={{
              position: 'relative',
              p: '2px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 242, 254, 0.25)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '20px',
                opacity: 0.85,
                background: 'linear-gradient(135deg, #00F2FE, transparent 60%, #00F2FE)',
              }}
            />
            <Box
              sx={{
                position: 'relative',
                width: 52,
                height: 52,
                borderRadius: '18px',
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                boxShadow: isDark ? 'none' : '0 4px 14px rgba(0, 242, 254, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src="/maficonSVG.svg"
                alt="Mafqoudat Logo"
                sx={{
                  width: 30,
                  height: 34,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.45))',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Dialog Title */}
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.35rem', sm: '1.5rem' },
            lineHeight: 1.25,
            color: isDark ? '#ffffff' : '#0f172a',
            mb: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {titleText}
        </Typography>

        {/* Localized Description */}
        <Typography
          variant="body2"
          sx={{
            color: isDark ? '#cbd5e1' : '#475569',
            lineHeight: 1.6,
            fontSize: { xs: '0.86rem', sm: '0.92rem' },
            maxWidth: 380,
            mx: 'auto',
            mb: 3,
          }}
        >
          {descText}
        </Typography>

        {/* Form Container */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.2,
          }}
        >
          {/* Field 1: Website Preferred Language */}
          <Box sx={{ width: '100%', textAlign: 'start' }}>
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
              {languageLabel}
            </Typography>

            <FormControl fullWidth size="medium">
              <Select
                value={currentLanguage || 'ar'}
                onChange={(e) => handleLanguageSelect(e.target.value)}
                displayEmpty
                renderValue={(selected) => {
                  const langConfig = languageOptions.find((l) => l.code === selected) || languageOptions[0];
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <span style={{ fontSize: '18px', lineHeight: 1 }}>{langConfig.flag}</span>
                      <Typography sx={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: '0.92rem', fontWeight: 500 }}>
                        {langConfig.label}
                      </Typography>
                    </Box>
                  );
                }}
                startAdornment={
                  <LanguageRoundedIcon
                    sx={{
                      color: isDark ? '#00F2FE' : '#0284c7',
                      fontSize: 20,
                      marginInlineStart: 0.5,
                      marginInlineEnd: 1.2,
                      flexShrink: 0,
                    }}
                  />
                }
                sx={{
                  borderRadius: '14px',
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.85)',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.92rem',
                  transition: 'all 0.2s ease',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(0, 242, 254, 0.45)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00F2FE',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00F2FE',
                    borderWidth: '2px',
                    boxShadow: isDark ? '0 0 12px rgba(0, 242, 254, 0.25)' : '0 0 12px rgba(0, 242, 254, 0.3)',
                  },
                  '& .MuiSelect-icon': {
                    color: isDark ? '#94a3b8' : '#64748b',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 0.8,
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
                      '& .MuiMenuItem-root': {
                        py: '10px !important',
                        px: '14px !important',
                        color: isDark ? '#f1f5f9 !important' : '#0f172a !important',
                        fontSize: '0.92rem',
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(0, 242, 254, 0.12) !important' : 'rgba(0, 242, 254, 0.1) !important',
                        },
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(0, 242, 254, 0.2) !important' : 'rgba(0, 242, 254, 0.18) !important',
                          fontWeight: '600 !important',
                          '&:hover': {
                            backgroundColor: isDark ? 'rgba(0, 242, 254, 0.28) !important' : 'rgba(0, 242, 254, 0.24) !important',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                {languageOptions.map((opt) => (
                  <MenuItem key={opt.code} value={opt.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <span style={{ fontSize: '20px', lineHeight: 1 }}>{opt.flag}</span>
                      <Typography sx={{ fontSize: '0.92rem', color: isDark ? '#f8fafc' : '#0f172a' }}>{opt.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Field 2: Country Dropdown */}
          <Box sx={{ width: '100%', textAlign: 'start' }}>
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
              {countryLabel}
            </Typography>

            <Autocomplete
              options={countriesList}
              autoHighlight
              disableClearable
              value={selectedCountry || countriesList[0]}
              onChange={handleCountryChange}
              getOptionLabel={(option) => getCountryLabel(option, currentLanguage)}
              isOptionEqualToValue={(option, val) =>
                (option?._id || option?.id) === (val?._id || val?.id)
              }
              filterOptions={(options, state) => {
                const query = (state.inputValue || '').trim().toLowerCase();
                if (!query) return options;
                return options.filter((option) => {
                  const label = getCountryLabel(option, currentLanguage).toLowerCase();
                  const code = (option.code || '').toLowerCase();
                  const enName = (option.names?.en || countryCodeToName[option.code]?.en || '').toLowerCase();
                  const arName = (option.names?.ar || countryCodeToName[option.code]?.ar || '').toLowerCase();
                  const frName = (option.names?.fr || countryCodeToName[option.code]?.fr || '').toLowerCase();
                  return (
                    label.includes(query) ||
                    code.includes(query) ||
                    enName.includes(query) ||
                    arName.includes(query) ||
                    frName.includes(query)
                  );
                });
              }}
              PaperComponent={CustomAutocompletePaper}
              componentsProps={{
                popper: {
                  sx: {
                    zIndex: 99999,
                    '& .MuiPaper-root, & .MuiAutocomplete-paper': {
                      backgroundColor: isDark ? 'rgba(11, 18, 32, 0.98) !important' : 'rgba(255, 255, 255, 0.98) !important',
                      backgroundImage: 'none !important',
                      backdropFilter: 'blur(24px) !important',
                      WebkitBackdropFilter: 'blur(24px) !important',
                      border: '1px solid rgba(0, 242, 254, 0.3) !important',
                      borderRadius: '16px !important',
                      boxShadow: isDark
                        ? '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 242, 254, 0.15) !important'
                        : '0 20px 50px rgba(15, 23, 42, 0.12), 0 0 25px rgba(0, 242, 254, 0.15) !important',
                      color: isDark ? '#f8fafc !important' : '#0f172a !important',
                    },
                    '& .MuiAutocomplete-listbox': {
                      backgroundColor: isDark ? 'rgba(11, 18, 32, 0.98) !important' : 'rgba(255, 255, 255, 0.98) !important',
                      p: '8px !important',
                      '& .MuiAutocomplete-option': {
                        borderRadius: '10px !important',
                        my: '2px !important',
                        py: '10px !important',
                        px: '14px !important',
                        color: isDark ? '#f1f5f9 !important' : '#0f172a !important',
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
                  },
                },
              }}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: 1.5,
                  }}
                  {...props}
                >
                  {option.flag ? (
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{option.flag}</span>
                  ) : (
                    <img
                      loading="lazy"
                      width="20"
                      height="15"
                      src={`https://flagcdn.com/w20/${(option.code || '').toLowerCase()}.png`}
                      srcSet={`https://flagcdn.com/w40/${(option.code || '').toLowerCase()}.png 2x`}
                      alt=""
                      style={{ borderRadius: '2px', objectFit: 'cover' }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      fontSize: '0.92rem',
                      color: isDark ? '#f1f5f9' : '#0f172a',
                    }}
                  >
                    {getCountryLabel(option, currentLanguage)}
                  </Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="medium"
                  placeholder={searchCountryPlaceholder}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          marginInlineStart: 0.5,
                          marginInlineEnd: 1,
                          flexShrink: 0,
                        }}
                      >
                        <PlaceRoundedIcon sx={{ fontSize: 20, color: '#10B981' }} />
                        {selectedCountry?.flag ? (
                          <span style={{ fontSize: '18px', lineHeight: 1 }}>{selectedCountry.flag}</span>
                        ) : selectedCountry?.code ? (
                          <img
                            loading="lazy"
                            width="18"
                            height="13"
                            src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                            alt=""
                            style={{ borderRadius: '2px' }}
                          />
                        ) : null}
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

          {/* Submit Action Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            endIcon={isRTL ? <ArrowBackRoundedIcon /> : <ArrowForwardRoundedIcon />}
            sx={{
              mt: 1,
              py: 1.4,
              borderRadius: '14px',
              fontSize: '0.96rem',
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
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            {confirmBtnText}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default CountryWelcomeDialog;
