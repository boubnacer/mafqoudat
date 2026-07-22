/**
 * First-launch onboarding slider - shown once (gated by OnboardingContext's
 * hasSeenOnboarding flag), then never again. Slide 1 picks a language, slides
 * 2-3 introduce the app, slide 4 requires a country before "Get Started".
 * FlatList + Animated only (no reanimated/carousel/swiper lib), per the
 * mobile app's existing dependency footprint.
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
  TextInput,
  ActivityIndicator,
  NativeModules,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTranslation } from '../../utils/translations';
import { languageStorage } from '../../utils/languageStorage';
import apiClient from '../../api/apiService';
import { getLocalizedLabel } from '../../context/ReferenceDataContext';
import { colorTokens, radiusTokens, fontFamilies } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_COUNT = 4;

// The outer slides list drives scrollX with useNativeDriver: true (for smooth
// per-slide fade/translate + dot interpolation) - a plain FlatList can't back
// a native-driven onScroll, only an Animated-wrapped one can.
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const LANGUAGE_CHIPS = [
  { code: 'en', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', nativeName: 'العربية', flag: '🇸🇦' },
];

// Fallback used only if /countries can't be reached during onboarding - keeps
// "Get Started" reachable rather than stranding a first-run user offline.
const FALLBACK_COUNTRIES = [
  { _id: 'fallback-ma', code: 'MA', names: { en: 'Morocco', fr: 'Maroc', ar: 'المغرب' }, flag: '🇲🇦' },
];

// No expo-localization dependency for this one lookup - RN's built-in native
// module is enough to read the device locale before the user picks a language.
const getDeviceLanguage = () => {
  try {
    const locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    const code = (locale || 'en').slice(0, 2).toLowerCase();
    return ['en', 'fr', 'ar'].includes(code) ? code : 'en';
  } catch (error) {
    return 'en';
  }
};

const OnboardingScreen = () => {
  const { selectCountry } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const { isDark } = useTheme();
  const { completeOnboarding } = useOnboarding();
  const { t } = useTranslation();

  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  // Own, JS-driven Animated.Values for the dot widths - 'width' isn't a style
  // property the native driver supports, so these can't be interpolated from
  // scrollX (which is native-driven for the opacity/transform slide fades).
  const dotWidths = useRef([0, 1, 2, 3].map(() => new Animated.Value(8))).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [countryError, setCountryError] = useState('');
  const [showCountryList, setShowCountryList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Applies the device locale as the implicit slide-1 default, but only on a
  // genuine first launch - if the user (or a previous session) already saved
  // a language explicitly, that choice must never be silently overridden.
  useEffect(() => {
    const applyDeviceDefault = async () => {
      const hasStored = await languageStorage.hasStoredLanguage();
      if (!hasStored) {
        const deviceLanguage = getDeviceLanguage();
        if (deviceLanguage !== currentLanguage) {
          await setLanguage(deviceLanguage);
        }
      }
    };
    applyDeviceDefault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);

  useEffect(() => {
    dotWidths.forEach((value, i) => {
      Animated.timing(value, {
        toValue: activeIndex === i ? 24 : 8,
        duration: 220,
        useNativeDriver: false,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    if (countrySearch.trim()) {
      const query = countrySearch.toLowerCase();
      setFilteredCountries(countries.filter((country) => getCountryName(country).toLowerCase().includes(query)));
    } else {
      setFilteredCountries(countries);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countrySearch, countries]);

  const loadCountries = async () => {
    try {
      setIsLoadingCountries(true);
      setCountryError('');
      const response = await apiClient.get('/countries', {
        params: { language: currentLanguage || 'en', active: true },
      });

      let list = [];
      if (response.data?.ids && response.data?.entities) {
        list = response.data.ids.map((id) => response.data.entities[id]);
      } else if (Array.isArray(response.data)) {
        list = response.data;
      } else if (Array.isArray(response.data?.data)) {
        list = response.data.data;
      }

      const validList = list.length > 0 ? list : FALLBACK_COUNTRIES;
      setCountries(validList);
      setFilteredCountries(validList);
    } catch (error) {
      console.error('Error loading countries:', error);
      setCountryError(t('errorLoadingCountries'));
      setCountries(FALLBACK_COUNTRIES);
      setFilteredCountries(FALLBACK_COUNTRIES);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const getCountryName = (country) => {
    if (!country) return '';
    const label = getLocalizedLabel(country, currentLanguage || 'en');
    // Some country records store a 2-letter placeholder in labels[lang] rather
    // than an actual localized name - names{} is the real source in that case.
    if (label && label.length === 2 && label === label.toUpperCase()) {
      return country.names?.[currentLanguage] || country.code || label;
    }
    return label || country.code || '';
  };

  const scrollToIndex = (index) => {
    flatListRef.current?.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  };

  const handleMomentumScrollEnd = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleSkip = () => scrollToIndex(SLIDE_COUNT - 1);

  const handleNext = () => {
    if (activeIndex < SLIDE_COUNT - 1) {
      scrollToIndex(activeIndex + 1);
    }
  };

  const handleLanguageSelect = async (code) => {
    if (code === currentLanguage) return;
    await setLanguage(code);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryList(false);
    setCountrySearch('');
  };

  const handleGetStarted = async () => {
    if (!selectedCountry) {
      setCountryError(t('pleaseSelectCountry'));
      return;
    }
    setIsSubmitting(true);
    try {
      const countryId = selectedCountry._id || selectedCountry.id;
      await completeOnboarding();
      // Flips AuthContext's hasCountry, which drives RootNavigator (App.js)
      // to swap into the guest-eligible AppNavigator and land on Home - no
      // explicit navigation call needed here.
      await selectCountry(countryId);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setCountryError(t('failedToSaveCountry'));
      setIsSubmitting(false);
    }
  };

  const getSlideAnimatedStyle = (index) => {
    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    return {
      opacity: scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' }),
      transform: [
        {
          translateY: scrollX.interpolate({ inputRange, outputRange: [16, 0, 16], extrapolate: 'clamp' }),
        },
      ],
    };
  };

  const renderIconCircle = (iconName) => (
    <View style={styles.iconCircle}>
      <MaterialIcons name={iconName} size={48} color={tokens.brandPrimary} />
    </View>
  );

  const renderLanguageSlide = () => (
    <Animated.View style={[styles.slideContent, getSlideAnimatedStyle(0)]}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>M</Text>
      </View>
      <Text style={styles.brandName}>{t('brandName')}</Text>
      <Text style={styles.headline}>{t('onboardingWelcomeHeadline')}</Text>
      <Text style={styles.body}>{t('welcomeMessage')}</Text>

      <View style={[styles.languageChipsRow, isRTL && styles.rowReverse]}>
        {LANGUAGE_CHIPS.map((lang) => {
          const isActive = currentLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.languageChip, isActive && styles.languageChipActive]}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.languageChipFlag}>{lang.flag}</Text>
              <Text style={[styles.languageChipText, isActive && styles.languageChipTextActive]}>
                {lang.nativeName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderInfoSlide = (index, iconName, headlineKey, bodyKey) => (
    <Animated.View style={[styles.slideContent, getSlideAnimatedStyle(index)]}>
      {renderIconCircle(iconName)}
      <Text style={styles.headline}>{t(headlineKey)}</Text>
      <Text style={styles.body}>{t(bodyKey)}</Text>
    </Animated.View>
  );

  const renderCountrySlide = () => (
    <Animated.View style={[styles.slideContent, getSlideAnimatedStyle(3)]}>
      {renderIconCircle('verified-user')}
      <Text style={styles.headline}>{t('securePlatform')}</Text>
      <Text style={styles.body}>{t('securePlatformDesc')}</Text>

      <View style={styles.countrySection}>
        <Text style={styles.countryTitle}>{t('chooseCountryTitle')}</Text>
        <Text style={styles.countrySubtitle}>{t('chooseCountryDescription')}</Text>

        {countryError ? <Text style={styles.errorText}>{countryError}</Text> : null}

        <TouchableOpacity
          style={[styles.countryButton, selectedCountry && styles.countryButtonSelected]}
          onPress={() => setShowCountryList((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.countryButtonText, !selectedCountry && styles.countryButtonPlaceholder]}
            numberOfLines={1}
          >
            {selectedCountry ? `${selectedCountry.flag || '🌍'} ${getCountryName(selectedCountry)}` : t('chooseCountry')}
          </Text>
          <Ionicons name={showCountryList ? 'chevron-up' : 'chevron-down'} size={18} color={tokens.ink} />
        </TouchableOpacity>

        {showCountryList && (
          <View style={styles.countryDropdown}>
            <TextInput
              style={[styles.searchInput, isRTL && styles.textRTL]}
              placeholder={t('searchCountry')}
              placeholderTextColor={tokens.ink + '80'}
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoCapitalize="none"
            />
            {isLoadingCountries ? (
              <ActivityIndicator style={styles.countryListLoading} color={tokens.brandPrimary} />
            ) : (
              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item._id || item.id || item.code}
                nestedScrollEnabled
                style={styles.countryList}
                renderItem={({ item }) => {
                  const isSelected =
                    (selectedCountry?._id && selectedCountry._id === item._id) ||
                    (selectedCountry?.id && selectedCountry.id === item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.countryItem, isSelected && styles.countryItemSelected]}
                      onPress={() => handleCountrySelect(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.countryFlag}>{item.flag || '🌍'}</Text>
                      <Text style={[styles.countryName, isRTL && styles.textRTL]} numberOfLines={1}>
                        {getCountryName(item)}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={18} color={tokens.brandPrimary} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderSlide = ({ index }) => {
    switch (index) {
      case 0:
        return <View style={styles.slide}>{renderLanguageSlide()}</View>;
      case 1:
        return (
          <View style={styles.slide}>
            {renderInfoSlide(1, 'search-off', 'onboardingReportHeadline', 'onboardingReportBody')}
          </View>
        );
      case 2:
        return (
          <View style={styles.slide}>
            {renderInfoSlide(2, 'task-alt', 'onboardingFindHeadline', 'onboardingFindBody')}
          </View>
        );
      case 3:
      default:
        return <View style={styles.slide}>{renderCountrySlide()}</View>;
    }
  };

  const isLastSlide = activeIndex === SLIDE_COUNT - 1;
  const isCtaDisabled = isLastSlide && (!selectedCountry || isSubmitting);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {!isLastSlide ? (
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipText}>{t('skip')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      <AnimatedFlatList
        ref={flatListRef}
        data={[0, 1, 2, 3]}
        keyExtractor={(item) => String(item)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="center"
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={renderSlide}
        style={styles.flatList}
      />

      <View style={styles.footer}>
        <View style={[styles.dotsRow, isRTL && styles.rowReverse]}>
          {[0, 1, 2, 3].map((i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidths[i] }, activeIndex === i ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, isCtaDisabled && styles.ctaButtonDisabled]}
          onPress={isLastSlide ? handleGetStarted : handleNext}
          disabled={isCtaDisabled}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={[styles.ctaContent, isRTL && styles.rowReverse]}>
              <Text style={styles.ctaText}>{isLastSlide ? t('getStarted') : t('next')}</Text>
              <Ionicons
                name={isRTL ? 'arrow-back' : 'arrow-forward'}
                size={18}
                color="#FFFFFF"
                style={styles.ctaIcon}
              />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (tokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    header: {
      height: 44,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    skipText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 15,
      color: tokens.ink,
      opacity: 0.6,
    },
    skipPlaceholder: {
      width: 40,
      height: 20,
    },
    flatList: {
      flex: 1,
    },
    slide: {
      width: SCREEN_WIDTH,
      flex: 1,
    },
    slideContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: tokens.brandPrimary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    logoText: {
      fontSize: 34,
      fontFamily: fontFamilies.display,
      color: '#FFFFFF',
    },
    brandName: {
      fontSize: 24,
      fontFamily: fontFamilies.display,
      color: tokens.brandPrimary,
      marginBottom: 16,
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: `${tokens.brandPrimary}1A`,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 24,
    },
    headline: {
      fontSize: 22,
      fontFamily: fontFamilies.display,
      color: tokens.ink,
      textAlign: 'center',
      marginBottom: 12,
    },
    body: {
      fontSize: 15,
      fontFamily: fontFamilies.body,
      color: tokens.ink,
      opacity: 0.7,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    languageChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
      marginTop: 8,
    },
    rowReverse: {
      flexDirection: 'row-reverse',
    },
    languageChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.surfaceRaised,
      borderWidth: 1,
      borderColor: `${tokens.ink}1A`,
    },
    languageChipActive: {
      borderColor: tokens.brandPrimary,
      backgroundColor: `${tokens.brandPrimary}14`,
    },
    languageChipFlag: {
      fontSize: 18,
      marginEnd: 8,
    },
    languageChipText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 14,
      color: tokens.ink,
    },
    languageChipTextActive: {
      color: tokens.brandPrimary,
      fontFamily: fontFamilies.bodySemiBold,
    },
    countrySection: {
      width: '100%',
      marginTop: 4,
    },
    countryTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
      color: tokens.ink,
      textAlign: 'center',
      marginBottom: 4,
    },
    countrySubtitle: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: tokens.ink,
      opacity: 0.6,
      textAlign: 'center',
      marginBottom: 16,
    },
    errorText: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: colorTokens.light.status.lost.main,
      textAlign: 'center',
      marginBottom: 12,
    },
    countryButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 52,
      backgroundColor: tokens.surfaceRaised,
      borderWidth: 1,
      borderColor: `${tokens.ink}1A`,
      borderRadius: radiusTokens.md,
      paddingHorizontal: 16,
    },
    countryButtonSelected: {
      borderColor: tokens.brandPrimary,
    },
    countryButtonText: {
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
      flex: 1,
    },
    countryButtonPlaceholder: {
      opacity: 0.5,
    },
    countryDropdown: {
      marginTop: 8,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}1A`,
      overflow: 'hidden',
      maxHeight: 260,
    },
    searchInput: {
      height: 44,
      paddingHorizontal: 16,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: tokens.ink,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}1A`,
    },
    countryListLoading: {
      paddingVertical: 20,
    },
    countryList: {
      maxHeight: 210,
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
    },
    countryItemSelected: {
      backgroundColor: `${tokens.brandPrimary}14`,
    },
    countryFlag: {
      fontSize: 20,
    },
    countryName: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: tokens.ink,
    },
    textRTL: {
      textAlign: 'right',
    },
    footer: {
      paddingHorizontal: 28,
      paddingBottom: 12,
      paddingTop: 8,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginBottom: 20,
    },
    dot: {
      height: 8,
      borderRadius: 4,
    },
    dotActive: {
      backgroundColor: tokens.brandPrimary,
    },
    dotInactive: {
      backgroundColor: `${tokens.ink}33`,
    },
    ctaButton: {
      height: 54,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: tokens.brandPrimary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    ctaButtonDisabled: {
      backgroundColor: `${tokens.ink}33`,
      shadowOpacity: 0,
      elevation: 0,
    },
    ctaContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    ctaText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
      color: '#FFFFFF',
    },
    ctaIcon: {
      marginTop: 1,
    },
  });

export default OnboardingScreen;
