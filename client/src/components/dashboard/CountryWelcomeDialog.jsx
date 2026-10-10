import React, { useState, useEffect, useMemo } from 'react';
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
} from '@mui/material';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
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

const CountryWelcomeDialog = ({
  open,
  onConfirm,
  onClose,
  countriesData,
  detectedCountryCode,
  currentCountryId,
}) => {
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

  const handleConfirm = () => {
    const chosen = selectedCountry || countriesList[0];
    const countryId = chosen?._id || chosen?.id;
    if (onConfirm && countryId) {
      onConfirm(countryId);
    }
  };

  const handleDismiss = () => {
    const chosen = selectedCountry || countriesList[0];
    const countryId = chosen?._id || chosen?.id;
    if (onClose) {
      onClose(countryId);
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
      onClose={handleDismiss}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        elevation: 0,
        sx: {
          backgroundColor: 'rgba(11, 18, 32, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px -10px rgba(0, 242, 254, 0.25)',
          overflow: 'hidden',
          p: { xs: 3, sm: 4 },
          position: 'relative',
          color: '#ffffff',
          direction: isRTL ? 'rtl' : 'ltr',
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.78)',
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

      {/* Cyber dot matrix SVG background */}
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.15,
          zIndex: 0,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dot-matrix-welcome" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1" fill="#00F2FE" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-matrix-welcome)" />
      </Box>

      {/* Close button */}
      <IconButton
        onClick={handleDismiss}
        size="small"
        aria-label="Close"
        sx={{
          position: 'absolute',
          top: 14,
          insetInlineEnd: 14,
          zIndex: 20,
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          color: '#94a3b8',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#1e293b',
            color: '#ffffff',
            borderColor: 'rgba(0, 242, 254, 0.4)',
          },
        }}
      >
        <CloseRoundedIcon sx={{ fontSize: 18 }} />
      </IconButton>

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
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(12px)',
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
            color: '#ffffff',
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
            color: '#cbd5e1',
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
                color: '#cbd5e1',
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
                      <Typography sx={{ color: '#ffffff', fontSize: '0.92rem', fontWeight: 500 }}>
                        {langConfig.label}
                      </Typography>
                    </Box>
                  );
                }}
                startAdornment={
                  <LanguageRoundedIcon
                    sx={{
                      color: '#00F2FE',
                      fontSize: 20,
                      marginInlineStart: 0.5,
                      marginInlineEnd: 1.2,
                      flexShrink: 0,
                    }}
                  />
                }
                sx={{
                  borderRadius: '14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  transition: 'all 0.2s ease',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(51, 65, 85, 0.8)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00F2FE',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00F2FE',
                    borderWidth: '2px',
                    boxShadow: '0 0 12px rgba(0, 242, 254, 0.25)',
                  },
                  '& .MuiSelect-icon': {
                    color: '#94a3b8',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 0.8,
                      borderRadius: '16px',
                      backgroundColor: 'rgba(11, 18, 32, 0.96)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 242, 254, 0.15)',
                      '& .MuiMenuItem-root': {
                        py: 1.2,
                        px: 2,
                        color: '#f1f5f9',
                        fontSize: '0.92rem',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 242, 254, 0.12)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(0, 242, 254, 0.2)',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 242, 254, 0.28)',
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
                      <Typography sx={{ fontSize: '0.92rem', color: '#f8fafc' }}>{opt.label}</Typography>
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
                color: '#cbd5e1',
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
              PaperComponent={({ children, ...paperProps }) => (
                <Paper
                  {...paperProps}
                  sx={{
                    mt: 1,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(11, 18, 32, 0.96)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 242, 254, 0.15)',
                    color: '#f8fafc',
                    '& .MuiAutocomplete-listbox': {
                      p: 1,
                      '& .MuiAutocomplete-option': {
                        borderRadius: '10px',
                        my: 0.25,
                        py: 1.2,
                        px: 1.5,
                        color: '#f8fafc',
                        '&:hover, &.Mui-focused': {
                          backgroundColor: 'rgba(0, 242, 254, 0.12)',
                        },
                        '&[aria-selected="true"]': {
                          backgroundColor: 'rgba(0, 242, 254, 0.2)',
                          fontWeight: 600,
                        },
                      },
                    },
                  }}
                >
                  {children}
                </Paper>
              )}
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
                      color: '#f1f5f9',
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
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      color: '#ffffff',
                      fontSize: '0.92rem',
                      transition: 'all 0.2s ease',
                      '& fieldset': {
                        borderColor: 'rgba(51, 65, 85, 0.8)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#00F2FE',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00F2FE',
                        borderWidth: '2px',
                        boxShadow: '0 0 12px rgba(0, 242, 254, 0.25)',
                      },
                      '& .MuiAutocomplete-input': {
                        color: '#ffffff',
                      },
                      '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
                        color: '#94a3b8',
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
