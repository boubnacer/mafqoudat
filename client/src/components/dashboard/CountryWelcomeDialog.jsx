import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Autocomplete,
  TextField,
  Chip,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import { useTranslation } from '../../utils/translations';
import { useLanguage } from '../../utils/languageContext';

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

const CountryWelcomeDialog = ({
  open,
  onConfirm,
  onClose,
  countriesData,
  detectedCountryCode,
  currentCountryId,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

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
          borderRadius: { xs: '20px', sm: '24px' },
          backgroundColor: isDark
            ? alpha('#131720', 0.96)
            : alpha('#ffffff', 0.98),
          backdropFilter: 'blur(16px)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: isDark
            ? '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)'
            : '0 24px 64px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          p: { xs: 2.5, sm: 3.5 },
          position: 'relative',
        },
      }}
    >
      {/* Subtle close button */}
      <IconButton
        onClick={handleDismiss}
        size="small"
        aria-label="Close country confirmation dialog"
        sx={{
          position: 'absolute',
          top: 14,
          insetInlineEnd: 14,
          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
          '&:hover': {
            color: isDark ? '#ffffff' : '#000000',
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          },
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>

      <DialogContent sx={{ p: 0, textAlign: 'center' }}>
        {/* Glowing Globe Badge */}
        <Box
          sx={{
            width: { xs: 64, sm: 72 },
            height: { xs: 64, sm: 72 },
            mx: 'auto',
            mb: 2.5,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark
              ? 'linear-gradient(135deg, rgba(230,81,0,0.24) 0%, rgba(255,152,0,0.12) 100%)'
              : 'linear-gradient(135deg, rgba(230,81,0,0.12) 0%, rgba(255,167,38,0.2) 100%)',
            border: `2px solid ${alpha(theme.palette.primary.main, isDark ? 0.4 : 0.25)}`,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.2)}`,
            animation: 'welcomePulse 3s ease-in-out infinite',
            '@keyframes welcomePulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.04)' },
            },
          }}
        >
          <PublicRoundedIcon
            sx={{
              fontSize: { xs: 34, sm: 40 },
              color: theme.palette.primary.main,
            }}
          />
        </Box>

        {/* Welcome Title */}
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.35rem', sm: '1.55rem' },
            lineHeight: 1.25,
            color: isDark ? '#f8fafc' : '#0f172a',
            mb: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          {t('welcomeCountryTitle') || 'Welcome to Mafqoudat / مرحباً بك في مفقودات'}
        </Typography>

        {/* Localized Description */}
        <Typography
          variant="body2"
          sx={{
            color: isDark ? '#94a3b8' : '#64748b',
            lineHeight: 1.6,
            fontSize: { xs: '0.88rem', sm: '0.94rem' },
            maxWidth: 340,
            mx: 'auto',
            mb: 3,
          }}
        >
          {t('welcomeCountryDescription') ||
            'Select your country to view local lost and found items in your area.'}
        </Typography>

        {/* Autocomplete Country Picker */}
        <Box sx={{ mb: 2.5, textAlign: 'start' }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontWeight: 600,
              color: isDark ? '#cbd5e1' : '#475569',
              mb: 0.8,
              fontSize: '0.8rem',
            }}
          >
            {t('selectYourCountry') || 'Select your country'}
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
            renderOption={(props, option) => (
              <Box
                component="li"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  py: 1.25,
                  px: 2,
                  gap: 1.5,
                  borderRadius: 1.5,
                  '&:hover': {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  },
                }}
                {...props}
              >
                {option.flag ? (
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>{option.flag}</span>
                ) : (
                  <img
                    loading="lazy"
                    width="22"
                    height="16"
                    src={`https://flagcdn.com/w20/${(option.code || '').toLowerCase()}.png`}
                    srcSet={`https://flagcdn.com/w40/${(option.code || '').toLowerCase()}.png 2x`}
                    alt=""
                    style={{ borderRadius: '2px', objectFit: 'cover' }}
                  />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    color: isDark ? '#f1f5f9' : '#1e293b',
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
                placeholder={t('searchCountry') || 'Search country...'}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', marginInlineStart: 1, marginInlineEnd: 0.5 }}>
                      {selectedCountry?.flag ? (
                        <span style={{ fontSize: '20px', lineHeight: 1 }}>{selectedCountry.flag}</span>
                      ) : selectedCountry?.code ? (
                        <img
                          loading="lazy"
                          width="20"
                          height="15"
                          src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                          alt=""
                          style={{ borderRadius: '2px' }}
                        />
                      ) : (
                        <PlaceRoundedIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                      )}
                    </Box>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    '& fieldset': {
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '2px',
                    },
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Feature Highlights */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            flexWrap: 'wrap',
            mb: 3,
          }}
        >
          <Chip
            icon={<PlaceRoundedIcon sx={{ fontSize: '15px !important', color: `${theme.palette.primary.main} !important` }} />}
            label={t('localizedCommunity') || 'Localized community'}
            size="small"
            sx={{
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.78rem',
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: isDark ? '#94a3b8' : '#64748b',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            }}
          />
          <Chip
            icon={<BoltRoundedIcon sx={{ fontSize: '15px !important', color: `${theme.palette.primary.main} !important` }} />}
            label="Live Updates"
            size="small"
            sx={{
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.78rem',
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: isDark ? '#94a3b8' : '#64748b',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleConfirm}
          startIcon={<CheckCircleRoundedIcon />}
          sx={{
            py: 1.4,
            borderRadius: '14px',
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #e65100 0%, #ff6d00 100%)',
            boxShadow: '0 8px 20px rgba(230,81,0,0.3)',
            transition: 'all 0.25s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #d84315 0%, #f55100 100%)',
              boxShadow: '0 12px 28px rgba(230,81,0,0.4)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          {t('confirmAndBrowse') || 'Confirm & Browse / تأكيد ومتابعة'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CountryWelcomeDialog;
