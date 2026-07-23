/**
 * Welcome Screen - Root page for mobile app
 * Mirrors: client/src/components/WelcomePage.jsx
 * Beautiful welcome screen with country selection
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import apiClient from '../api/apiService';
import { API_BASE_URL } from '../config/api';
import { colorTokens, radiusTokens } from '../theme/tokens';
import { getCategoryConfig } from '../config/categories';
import LanguageDropdown from '../components/LanguageDropdown';
import { getLocalizedLabel } from '../context/ReferenceDataContext';

const BRAND_MARK = require('../../assets/icon.png');

const HERO_CARD_WIDTH = 140;
const HERO_CARD_HEIGHT = 188;

// Mirrors client/src/designTokens.js's elevationTokens as RN shadow/elevation
// props (same helper already used in PostsListScreen.js).
const getElevation = (isDark, level = 1) =>
  level === 2
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.45 : 0.1, shadowRadius: 16, elevation: 4 }
    : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.4 : 0.06, shadowRadius: 2, elevation: 2 };

// Symmetric outward tilt/lift around the middle card — same geometry as the
// web hero's getFanGeometry() in client/src/components/WelcomePage.jsx.
const getFanGeometry = (index, count) => {
  const centerIndex = Math.floor((count - 1) / 2);
  const offset = index - centerIndex;
  const isFront = offset === 0;
  return { tilt: offset * 6, lift: isFront ? -14 : Math.abs(offset) * 16, zIndex: 10 - Math.abs(offset), isFront };
};

const getHeroImageUri = (image) => (image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : null);

// getAllPosts's aggregation returns a Categories array (new format) with a
// Category/categoryname fallback for legacy posts — same helpers as
// PostsListScreen.js's getCategoryInfo/getCategoryLabel/getCityLabel.
const getHeroCategoryInfo = (item) => {
  if (Array.isArray(item?.Categories) && item.Categories.length > 0) return item.Categories[0];
  if (item?.Category?.code) return item.Category;
  if (item?.categoryname) return { code: item.categoryname, labels: null };
  return null;
};

const getHeroCategoryLabel = (item, lang) => {
  const cat = getHeroCategoryInfo(item);
  if (!cat) return null;
  return cat.labels ? cat.labels[lang] || cat.labels.en || cat.code : cat.code;
};

const getHeroCityLabelBase = (item, lang) => {
  if (item?.cityLabels && typeof item.cityLabels === 'object') {
    const label = item.cityLabels[lang] || item.cityLabels.en;
    if (label && label.trim()) return label.trim();
  }
  if (item?.city?.labels && typeof item.city.labels === 'object') {
    const label = item.city.labels[lang] || item.city.labels.en;
    if (label && label.trim()) return label.trim();
  }
  if (item?.cityName && item.cityName.trim()) return item.cityName.trim();
  return null;
};

const isHeroPostFound = (item) => {
  if (Array.isArray(item?.Floptions) && item.Floptions.length > 0) return item.Floptions[0].code !== 'LOST';
  if (item?.Floptions?.code) return item.Floptions.code !== 'LOST';
  if (typeof item?.foundLost === 'string' && ['found', 'lost'].includes(item.foundLost.toLowerCase())) {
    return item.foundLost.toLowerCase() === 'found';
  }
  return true;
};

const formatHeroShortDate = (dateString, lang) => {
  try {
    return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return '';
  }
};

const WelcomeScreen = () => {
  const { selectCountry, hasCountry } = useAuth();
  const { currentLanguage } = useLanguage();
  const { colors, isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [error, setError] = useState('');
  // Live snapshot of a few recent posts for the selected country — mirrors
  // client/src/components/WelcomePage.jsx's hero fan (same endpoint/shape,
  // same fan geometry), proof the platform is active and local before the
  // user even finishes onboarding.
  const [heroPosts, setHeroPosts] = useState([]);
  const [heroPostsLoading, setHeroPostsLoading] = useState(false);
  // Whether the last loadCountries() call resolved a real API list (as
  // opposed to falling back to the hardcoded single-country list below) -
  // gates applying an IP-geolocation match so it never fires against the
  // placeholder fallback.
  const [hasRealCountries, setHasRealCountries] = useState(false);
  const [geoCountryCode, setGeoCountryCode] = useState(null);
  // Tracks explicit user interaction with the picker so a late-arriving geo
  // match never clobbers a choice the user already made by hand.
  const userSelectedCountryRef = useRef(false);
  const geoAppliedRef = useRef(false);

  // Country code to name mapping for fallback
  const countryCodeToName = {
    'MA': { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' },
    'DZ': { en: 'Algeria', ar: 'الجزائر', fr: 'Algérie' },
    'TN': { en: 'Tunisia', ar: 'تونس', fr: 'Tunisie' },
    'EG': { en: 'Egypt', ar: 'مصر', fr: 'Égypte' },
    'SA': { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', fr: 'Arabie Saoudite' },
    'AE': { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', fr: 'Émirats Arabes Unis' },
    'QA': { en: 'Qatar', ar: 'قطر', fr: 'Qatar' },
    'KW': { en: 'Kuwait', ar: 'الكويت', fr: 'Koweït' },
    'BH': { en: 'Bahrain', ar: 'البحرين', fr: 'Bahreïn' },
    'OM': { en: 'Oman', ar: 'عُمان', fr: 'Oman' },
    'JO': { en: 'Jordan', ar: 'الأردن', fr: 'Jordanie' },
    'LB': { en: 'Lebanon', ar: 'لبنان', fr: 'Liban' },
    'SY': { en: 'Syria', ar: 'سوريا', fr: 'Syrie' },
    'IQ': { en: 'Iraq', ar: 'العراق', fr: 'Irak' },
    'PS': { en: 'Palestine', ar: 'فلسطين', fr: 'Palestine' },
    'LY': { en: 'Libya', ar: 'ليبيا', fr: 'Libye' },
    'SD': { en: 'Sudan', ar: 'السودان', fr: 'Soudan' },
    'SO': { en: 'Somalia', ar: 'الصومال', fr: 'Somalie' },
    'DJ': { en: 'Djibouti', ar: 'جيبوتي', fr: 'Djibouti' },
    'KM': { en: 'Comoros', ar: 'جزر القمر', fr: 'Comores' },
    'MR': { en: 'Mauritania', ar: 'موريتانيا', fr: 'Mauritanie' },
  };

  // Fallback countries in case API fails
  const fallbackCountries = [
    { _id: '68b0b774dcafb50aec949f4e', code: 'MA', label: 'Morocco', labels: { en: 'MA', ar: 'MA', fr: 'MA' }, names: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' }, flag: '🇲🇦', isActive: true },
  ];

  useEffect(() => {
    loadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload countries when language changes
  useEffect(() => {
    if (!isLoading && countries.length > 0) {
      loadCountries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = countries.filter(country => {
        const name = getCountryName(country);
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(countries);
    }
  }, [searchQuery, countries, currentLanguage]);

  // First-visit-only IP geolocation pre-selection. Never writes to
  // AuthContext/storage - only nudges the local `selectedCountry` UI state
  // below, so the user still has to tap Continue to confirm exactly as
  // before. `hasCountry` (from AuthContext, backed by storage.getCurrentCountry())
  // is read once at mount to decide whether a lookup is even warranted: if a
  // country is already persisted, skip the network call entirely. In
  // practice RootNavigator (App.js) only mounts this screen while hasCountry
  // is false, but the check is kept as an explicit, defensive gate.
  useEffect(() => {
    if (hasCountry) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    fetch('https://ipwho.is/', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success !== false && data.country_code) {
          setGeoCountryCode(data.country_code);
        }
      })
      .catch(() => {
        // Silent fail by design: timeout, network error, or malformed
        // response should never surface to the user - the picker just shows
        // with no preselection.
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the geo match once both the lookup and the real countries list
  // have resolved, and only if the user hasn't already picked (or started
  // picking) something themselves.
  useEffect(() => {
    if (!geoCountryCode) return;
    if (geoAppliedRef.current) return;
    if (userSelectedCountryRef.current) return;
    if (!hasRealCountries) return;

    const match = countries.find(
      (c) => c.code && c.code.toUpperCase() === geoCountryCode.toUpperCase()
    );
    geoAppliedRef.current = true;
    if (match) {
      setSelectedCountry(match);
    }
    // `countries` changes identity on every loadCountries() call (including
    // language-change reloads); gate on the hasRealCountries flag instead of
    // the array itself to avoid re-running unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoCountryCode, hasRealCountries]);

  const loadCountries = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await apiClient.get('/countries', {
        params: {
          language: currentLanguage || 'en',
          active: true,
        },
      });

      // Handle different response structures
      let countriesList = [];
      if (response.data?.ids && response.data?.entities) {
        countriesList = response.data.ids.map(id => response.data.entities[id]);
      } else if (Array.isArray(response.data)) {
        countriesList = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        countriesList = response.data.data;
      }
      
      const validCountries = countriesList.length > 0 ? countriesList : fallbackCountries;
      setCountries(validCountries);
      setFilteredCountries(validCountries);
      setHasRealCountries(countriesList.length > 0);
    } catch (err) {
      console.error('Error loading countries:', err);
      setError(t('errorLoadingCountries'));
      // Use fallback countries
      setCountries(fallbackCountries);
      setFilteredCountries(fallbackCountries);
      setHasRealCountries(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a small hero snapshot of recent posts once a country is picked —
  // same endpoint/params as the web hero (pageSize 3, fl: '' so both found
  // and lost show up), re-fetched on language change so labels stay in sync.
  useEffect(() => {
    if (!selectedCountry?._id) {
      setHeroPosts([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setHeroPostsLoading(true);

    apiClient
      .get('/posts', {
        signal: controller.signal,
        params: {
          pageSize: 3,
          currentCountry: selectedCountry._id,
          language: currentLanguage || 'en',
          fl: '',
        },
      })
      .then((response) => {
        if (cancelled) return;
        setHeroPosts(response.data?.postsWithUser || []);
      })
      .catch(() => {
        if (!cancelled) setHeroPosts([]);
      })
      .finally(() => {
        if (!cancelled) setHeroPostsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedCountry?._id, currentLanguage]);

  const getCountryName = (country) => {
    if (!country) return '';
    const currentLang = currentLanguage || 'en';

    // getLocalizedLabel handles the standard names/labels/code fallback chain;
    // the extra check below is specific to this app's country data, where
    // `labels[lang]` sometimes stores a 2-letter placeholder code rather than
    // an actual name - in that case prefer the static country-name mapping.
    const label = getLocalizedLabel(country, currentLang);
    if (label && label.length === 2 && label === label.toUpperCase()) {
      return countryCodeToName[label]?.[currentLang] || country.code || label;
    }

    return label || countryCodeToName[country.code]?.[currentLang] || country.code || '';
  };

  const handleContinue = async () => {
    if (!selectedCountry) {
      setError(t('pleaseSelectCountry'));
      return;
    }

    try {
      const countryId = selectedCountry._id || selectedCountry.id;
      // Flips AuthContext's hasCountry, which drives RootNavigator (App.js) to
      // swap into the guest-eligible AppNavigator and land on Home - no
      // explicit navigation call needed here.
      await selectCountry(countryId);
    } catch (err) {
      console.error('Error saving country:', err);
      setError(t('failedToSaveCountry'));
    }
  };

  const renderCountry = ({ item }) => {
    const isSelected = selectedCountry?._id === item._id || 
                      selectedCountry?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.countryItem,
          isSelected && styles.countryItemSelected
        ]}
        onPress={() => {
          userSelectedCountryRef.current = true;
          setSelectedCountry(item);
          setShowCountryDropdown(false);
          setSearchQuery('');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.countryFlag}>
          {item.flag || '🌍'}
        </Text>
        <Text
          style={[
            styles.countryName,
            isRTL && styles.textRTL,
            isSelected && styles.countryNameSelected
          ]}
        >
          {getCountryName(item)}
        </Text>
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeroCard = (item, index, total) => {
    const found = isHeroPostFound(item);
    const tone = found ? tokens.status.found : tokens.status.lost;
    const categoryConfig = getCategoryConfig(getHeroCategoryInfo(item)?.code);
    const categoryLabel = getHeroCategoryLabel(item, currentLanguage);
    const imageUri = getHeroImageUri(item.image);
    let cityLabel = getHeroCityLabelBase(item, currentLanguage);
    if (!cityLabel && item?.exactLocation) {
      const first = item.exactLocation.split(',')[0].split('(')[0].replace(/\d+/g, '').trim();
      if (first) cityLabel = first;
    }
    if (!cityLabel) cityLabel = t('unknownCity');

    const { tilt, lift, zIndex, isFront } = getFanGeometry(index, total);
    const overlapStyle = index === 0 ? null : isRTL ? { marginRight: -16 } : { marginLeft: -16 };

    return (
      <View
        key={item._id || item.id || index}
        style={[
          styles.heroCard,
          overlapStyle,
          getElevation(isDark, isFront ? 2 : 1),
          {
            backgroundColor: categoryConfig.color,
            zIndex,
            transform: [{ rotate: `${tilt}deg` }, { translateY: lift }, { scale: isFront ? 1.05 : 1 }],
          },
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.heroCardIconWrap]}>
            <Ionicons name={categoryConfig.icon} size={40} color="#FFFFFF" />
          </View>
        )}
        {imageUri && <View style={[StyleSheet.absoluteFill, styles.heroCardScrim]} />}

        <View style={styles.heroCardContent}>
          <View style={styles.heroCardTopRow}>
            <Text style={styles.heroCardCategory} numberOfLines={2}>
              {categoryLabel}
            </Text>
            <View style={[styles.heroStatusTag, { backgroundColor: tone.main }]}>
              <Ionicons name={found ? 'checkmark-circle' : 'search'} size={12} color="#FFFFFF" />
              <Text style={styles.heroStatusTagText}>{found ? t('found') : t('lost')}</Text>
            </View>
          </View>

          <View style={styles.heroCardBottomRow}>
            <View style={styles.heroCardCityRow}>
              <Ionicons name="location-outline" size={12} color="#FFFFFF" />
              <Text style={styles.heroCardCityText} numberOfLines={1}>
                {cityLabel}
              </Text>
            </View>
            <Text style={styles.heroCardDateText}>{formatHeroShortDate(item.createdAt, currentLanguage)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && countries.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {t('loadingCountries')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Controls */}
          <View style={styles.topControls}>
            <LanguageDropdown />
          </View>

          {/* Logo and Welcome Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image source={BRAND_MARK} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.brandName}>{t('brandName')}</Text>
            <Text style={styles.welcomeMessage}>
              {t('welcomeMessage')}
            </Text>
          </View>

          {/* Country Selection Section */}
          <View style={styles.countrySection}>
            <Text style={styles.sectionTitle}>
              {t('chooseCountryTitle')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {t('chooseCountryDescription')}
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Country Dropdown Button */}
            <TouchableOpacity
              style={[
                styles.countryButton,
                selectedCountry && styles.countryButtonSelected
              ]}
              onPress={() => setShowCountryDropdown(!showCountryDropdown)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.countryButtonText,
                  isRTL && styles.textRTL,
                  !selectedCountry && styles.countryButtonPlaceholder
                ]}
              >
                {selectedCountry 
                  ? `${selectedCountry.flag || '🌍'} ${getCountryName(selectedCountry)}`
                  : t('chooseCountry')
                }
              </Text>
              <Text style={styles.dropdownArrow}>
                {showCountryDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {/* Country Search and List */}
            {showCountryDropdown && (
              <View style={styles.countryDropdown}>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={[styles.searchInput, isRTL && styles.textRTL]}
                    placeholder={t('searchCountry')}
                    placeholderTextColor={colors.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                  />
                </View>
                <FlatList
                  data={filteredCountries}
                  renderItem={renderCountry}
                  keyExtractor={(item) => item._id || item.id || item.code}
                  style={styles.countryList}
                  contentContainerStyle={styles.countryListContent}
                  maxHeight={200}
                  nestedScrollEnabled
                />
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedCountry && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              disabled={!selectedCountry}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {t('continueToPosts')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Live snapshot of recent posts — mirrors the web welcome page's
              fanned card stack (client/src/components/WelcomePage.jsx). */}
          {selectedCountry && (
            <View style={styles.heroSection}>
              {heroPostsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : heroPosts.length > 0 ? (
                <View style={[styles.heroFan, isRTL && styles.heroFanRTL]}>
                  {heroPosts.map((item, index) => renderHeroCard(item, index, heroPosts.length))}
                </View>
              ) : (
                <Text style={styles.heroEmptyText}>{t('noPostsInArea')}</Text>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  countrySection: {
    paddingHorizontal: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: colors.dangerBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  countryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.inputBackground,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  countryButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  countryButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  countryButtonPlaceholder: {
    color: colors.placeholder,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.textSecondary,
    marginStart: 8,
  },
  countryDropdown: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    height: 44,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
  countryList: {
    maxHeight: 200,
  },
  countryListContent: {
    paddingVertical: 8,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryItemSelected: {
    backgroundColor: colors.primarySoft,
  },
  countryFlag: {
    fontSize: 24,
    marginEnd: 12,
  },
  countryName: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  countryNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
    marginStart: 8,
  },
  textRTL: {
    textAlign: 'right',
  },
  continueButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '600',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  heroFan: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroFanRTL: {
    flexDirection: 'row-reverse',
  },
  heroCard: {
    width: HERO_CARD_WIDTH,
    height: HERO_CARD_HEIGHT,
    borderRadius: radiusTokens.lg,
    overflow: 'hidden',
  },
  heroCardIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardScrim: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 10,
  },
  heroCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
  },
  heroCardCategory: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radiusTokens.sm,
  },
  heroStatusTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroCardBottomRow: {
    gap: 2,
  },
  heroCardCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroCardCityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  heroCardDateText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  heroEmptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default WelcomeScreen;

