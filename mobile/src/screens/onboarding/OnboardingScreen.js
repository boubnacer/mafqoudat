/**
 * First-launch onboarding slider - shown once (gated by OnboardingContext's
 * hasSeenOnboarding flag), then never again. Slide 1 picks a language and
 * light/dark mode, slides 2-4 introduce the app (report, browse, filter),
 * slide 5 requires a country before "Get Started".
 * FlatList + Animated only (no reanimated/carousel/swiper lib), per the
 * mobile app's existing dependency footprint.
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTranslation } from '../../utils/translations';
import { languageStorage } from '../../utils/languageStorage';
import apiClient from '../../api/apiService';
import { getLocalizedLabel } from '../../context/ReferenceDataContext';
import { colorTokens, radiusTokens, fontFamilies, lightColors } from '../../theme/tokens';
import { NATIVE_RTL, needsDirectionFlip } from '../../utils/rtl';
import {
  WelcomeMascotIllustration,
  ReportIllustration,
  FindIllustration,
  FilterIllustration,
  SecureIllustration,
} from './OnboardingIllustrations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_COUNT = 5;
const SLIDE_INDICES = Array.from({ length: SLIDE_COUNT }, (_, i) => i);

// The website's brand blue (client/src/theme.js's secondary.main, shared by
// both its light and dark palettes) and the same fixed blue the onboarding
// mascot/icons already use - kept as one flat value (not per-theme) rather
// than colorTokens.brandPrimary so every slide/button reads as one system
// with the illustrations instead of the newer, different-shade brand token.
const BRAND_BLUE = lightColors.primary;

// The outer slides list drives scrollX with useNativeDriver: true (for smooth
// per-slide fade/translate + dot interpolation) - a plain FlatList can't back
// a native-driven onScroll, only an Animated-wrapped one can.
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// I18nManager.isRTL is read from constants captured when the JS bundle loaded,
// and forceRTL() only writes a native preference - neither the flag nor the
// view tree changes again until the app is genuinely restarted. So the layout
// direction is a per-session constant and belongs at module scope, where it
// cannot be mistaken for something that tracks the currently picked language.
// Sourced from utils/rtl.js so this screen and the rest of the app agree on
// it rather than each capturing their own copy.
const LAYOUT_IS_RTL = NATIVE_RTL;

// How a horizontal list reports contentOffset.x under an RTL layout is NOT the
// same on both platforms, so this cannot be handled with a single sign flip:
//
// - Android hands back the raw scrollX, still measured from the left edge
//   (ReactHorizontalScrollView.onScrollChanged passes it through untouched),
//   so slide 0 sits at the far end and index <-> offset runs backwards.
// - iOS mirrors the scroll view and its content with a scale(-1, 1) transform
//   (RCTScrollView's RCTApplyTransformationAccordingLayoutDirection), which
//   leaves contentOffset.x reading exactly as it does in LTR.
//
// Offsets stay positive in both cases - only Android's ordering reverses.
const OFFSETS_REVERSED = LAYOUT_IS_RTL && Platform.OS === 'android';
const offsetForIndex = (index) =>
  (OFFSETS_REVERSED ? SLIDE_COUNT - 1 - index : index) * SCREEN_WIDTH;
const indexForOffset = (x) => {
  const raw = Math.round(x / SCREEN_WIDTH);
  return OFFSETS_REVERSED ? SLIDE_COUNT - 1 - raw : raw;
};

// Same wordmark image LoginScreen/SignUpScreen/AppHeader use in place of a
// text brand name.
const BRAND_WORDMARK = require('../../../assets/mafWordmark.png');
const WORDMARK_RATIO = 984 / 213;

const LANGUAGE_CHIPS = [
  { code: 'en', nativeName: 'English' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'ar', nativeName: 'العربية' },
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
  const { isDark, setThemeMode } = useTheme();
  const { completeOnboarding } = useOnboarding();
  const { t } = useTranslation();

  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  // Two different notions of "RTL" have to coexist on this screen, and keeping
  // them apart is what makes it survive a language switch:
  //
  // - isRTL is the direction the PICKED LANGUAGE wants. It flips the instant
  //   Arabic is tapped.
  // - LAYOUT_IS_RTL is the direction the view tree is ACTUALLY laid out in for
  //   this session, which does NOT follow isRTL until the app is restarted.
  //
  // mirrorRows is true only while the two disagree, i.e. while a direction
  // change is pending that restart. A row with flexDirection 'row' ALREADY
  // mirrors itself natively once the layout is RTL, so reversing rows whenever
  // isRTL is true (what this screen used to do) double-flips every row back to
  // the wrong order on any session that booted in Arabic.
  const isRTL = currentLanguage === 'ar';
  const mirrorRows = needsDirectionFlip(isRTL);

  const flatListRef = useRef(null);
  // Seeded with slide 0's resting offset rather than a bare 0: under the
  // reversed (Android RTL) mapping the list opens at the far end, so starting
  // this at 0 would fade slide 0 out and the last slide in before the user has
  // touched anything.
  const scrollX = useRef(new Animated.Value(offsetForIndex(0))).current;
  // Own, JS-driven Animated.Values for the dot widths - 'width' isn't a style
  // property the native driver supports, so these can't be interpolated from
  // scrollX (which is native-driven for the opacity/transform slide fades).
  const dotWidths = useRef(SLIDE_INDICES.map(() => new Animated.Value(8))).current;
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
    flatListRef.current?.scrollToOffset({ offset: offsetForIndex(index), animated: true });
    setActiveIndex(index);
  };

  const handleMomentumScrollEnd = (event) => {
    setActiveIndex(indexForOffset(event.nativeEvent.contentOffset.x));
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

  // Built once per slide index and reused across renders - scrollX.interpolate()
  // creates a native-driven Animated node, and recreating it on every render (as
  // a plain per-call function would) tears down/reattaches that node while a
  // scroll animation may be in flight (setActiveIndex in scrollToIndex re-renders
  // this component the instant "Next" is pressed, right as the native scroll
  // starts), which is what caused the black-flash glitch on slide transitions.
  const slideAnimatedStyles = useMemo(
    () =>
      SLIDE_INDICES.map((index) => {
        // Centred on the offset this slide actually rests at, so the fade
        // tracks the real scroll position under a reversed (Android RTL)
        // mapping too. Always ascending, as interpolate() requires.
        const center = offsetForIndex(index);
        const inputRange = [center - SCREEN_WIDTH, center, center + SCREEN_WIDTH];
        return {
          opacity: scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' }),
          transform: [
            {
              translateY: scrollX.interpolate({ inputRange, outputRange: [16, 0, 16], extrapolate: 'clamp' }),
            },
          ],
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Must be created exactly once, for the same reason the interpolations above
  // are. React Native keys a component's AnimatedProps on the IDENTITY of any
  // AnimatedEvent/AnimatedNode prop (see createAnimatedPropsMemoHook), so an
  // inline Animated.event makes every single render of this screen rebuild the
  // list's AnimatedProps, which runs the ref-effect cleanup that rips the
  // native onScroll -> scrollX binding off the list and re-attaches a new one.
  // Any render landing while a paging scroll is in flight therefore loses the
  // rest of that scroll and leaves scrollX stale, so the slide actually on
  // screen interpolates to opacity 0 and the page goes blank.
  //
  // Pressing "Next" normally only re-renders once (setActiveIndex), while
  // scrollX is still parked on the previous offset, so it survives. Switching
  // language is what makes this fatal: a direction change additionally fires
  // the pending-restart notice, that notice's 4s auto-dismiss timer, and the
  // country refetch's async setStates - late re-renders that land after the
  // scroll has already started. That is the "everything turns white after
  // changing language" bug, and it is why it happened in BOTH directions.
  const handleScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const renderLanguageSlide = () => (
    <Animated.View style={[styles.slideContent, slideAnimatedStyles[0]]}>
      <WelcomeMascotIllustration isDark={isDark} />
      <Image
        source={BRAND_WORDMARK}
        resizeMode="contain"
        accessibilityLabel={t('brandName')}
        style={styles.brandWordmarkImg}
      />
      <Text style={styles.headline}>{t('onboardingWelcomeHeadline')}</Text>

      <View style={[styles.languageChipsRow, mirrorRows && styles.rowReverse]}>
        {LANGUAGE_CHIPS.map((lang) => {
          const isActive = currentLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.languageChip, isActive && styles.languageChipActive]}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={[styles.languageChipText, isActive && styles.languageChipTextActive]}>
                {lang.nativeName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.themeLabel}>{t('onboardingThemeLabel')}</Text>
      <View style={[styles.themeToggleTrack, mirrorRows && styles.rowReverse]}>
        <TouchableOpacity
          style={[styles.themeToggleOption, !isDark && styles.themeToggleOptionActive]}
          onPress={() => setThemeMode('light')}
          activeOpacity={0.8}
        >
          <Ionicons name="sunny" size={16} color={!isDark ? '#FFFFFF' : tokens.ink} />
          <Text style={[styles.themeToggleText, !isDark && styles.themeToggleTextActive]}>
            {t('themeLight')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.themeToggleOption, isDark && styles.themeToggleOptionActive]}
          onPress={() => setThemeMode('dark')}
          activeOpacity={0.8}
        >
          <Ionicons name="moon" size={16} color={isDark ? '#FFFFFF' : tokens.ink} />
          <Text style={[styles.themeToggleText, isDark && styles.themeToggleTextActive]}>
            {t('themeDark')}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderInfoSlide = (index, IllustrationComponent, headlineKey, bodyKey) => (
    <Animated.View style={[styles.slideContent, slideAnimatedStyles[index]]}>
      <IllustrationComponent isDark={isDark} />
      <Text style={styles.headline}>{t(headlineKey)}</Text>
      <Text style={styles.body}>{t(bodyKey)}</Text>
    </Animated.View>
  );

  const renderFilterSlide = () => (
    <Animated.View style={[styles.slideContent, slideAnimatedStyles[3]]}>
      <FilterIllustration />
      <Text style={styles.headline}>{t('onboardingFilterHeadline')}</Text>
      <Text style={styles.body}>{t('onboardingFilterBody')}</Text>

      <View style={[styles.filterPillsRow, mirrorRows && styles.rowReverse]}>
        <View style={styles.filterPill}>
          <Ionicons name="earth" size={14} color={BRAND_BLUE} />
          <Text style={styles.filterPillText}>{t('country')}</Text>
        </View>
        <View style={styles.filterPill}>
          <Ionicons name="location" size={14} color={BRAND_BLUE} />
          <Text style={styles.filterPillText}>{t('city')}</Text>
        </View>
        <View style={styles.filterPill}>
          <Ionicons name="pricetag" size={14} color={BRAND_BLUE} />
          <Text style={styles.filterPillText}>{t('categories')}</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderCountrySlide = () => (
    <Animated.View style={[styles.slideContent, slideAnimatedStyles[4]]}>
      <SecureIllustration />
      <Text style={styles.headline}>{t('securePlatform')}</Text>
      <Text style={styles.body}>{t('securePlatformDesc')}</Text>

      <View style={styles.countrySection}>
        <Text style={styles.countryTitle}>{t('chooseCountryTitle')}</Text>
        <Text style={styles.countrySubtitle}>{t('chooseCountryDescription')}</Text>

        {countryError ? <Text style={styles.errorText}>{countryError}</Text> : null}

        <TouchableOpacity
          style={[
            styles.countryButton,
            selectedCountry && styles.countryButtonSelected,
            mirrorRows && styles.rowReverse,
          ]}
          onPress={() => setShowCountryList((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.countryButtonText,
              !selectedCountry && styles.countryButtonPlaceholder,
              isRTL ? styles.textRTL : styles.textLTR,
            ]}
            numberOfLines={1}
          >
            {selectedCountry ? `${selectedCountry.flag || '🌍'} ${getCountryName(selectedCountry)}` : t('chooseCountry')}
          </Text>
          <Ionicons name={showCountryList ? 'chevron-up' : 'chevron-down'} size={18} color={tokens.ink} />
        </TouchableOpacity>

        {showCountryList && (
          <View style={styles.countryDropdown}>
            <TextInput
              style={[styles.searchInput, isRTL ? styles.textRTL : styles.textLTR]}
              placeholder={t('searchCountry')}
              placeholderTextColor={tokens.ink + '80'}
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoCapitalize="none"
            />
            {isLoadingCountries ? (
              <ActivityIndicator style={styles.countryListLoading} color={BRAND_BLUE} />
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
                      style={[
                        styles.countryItem,
                        isSelected && styles.countryItemSelected,
                        mirrorRows && styles.rowReverse,
                      ]}
                      onPress={() => handleCountrySelect(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.countryFlag}>{item.flag || '🌍'}</Text>
                      <Text style={[styles.countryName, isRTL ? styles.textRTL : styles.textLTR]} numberOfLines={1}>
                        {getCountryName(item)}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={18} color={BRAND_BLUE} />}
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
            {renderInfoSlide(1, ReportIllustration, 'onboardingReportHeadline', 'onboardingReportBody')}
          </View>
        );
      case 2:
        return (
          <View style={styles.slide}>
            {renderInfoSlide(2, FindIllustration, 'onboardingFindHeadline', 'onboardingFindBody')}
          </View>
        );
      case 3:
        return <View style={styles.slide}>{renderFilterSlide()}</View>;
      case 4:
      default:
        return <View style={styles.slide}>{renderCountrySlide()}</View>;
    }
  };

  const isLastSlide = activeIndex === SLIDE_COUNT - 1;
  const isCtaDisabled = isLastSlide && (!selectedCountry || isSubmitting);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={[styles.header, mirrorRows && styles.headerRTL]}>
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
        data={SLIDE_INDICES}
        keyExtractor={(item) => String(item)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="center"
        decelerationRate="fast"
        bounces={false}
        // Android clips/recycles offscreen subviews by default, which can flash
        // blank/black mid-transition on an Animated-opacity FlatList like this one.
        removeClippedSubviews={false}
        // Describes where items sit inside the content (always index-ordered),
        // not where the viewport is scrolled to - so this stays unsigned even
        // when the offset mapping above reverses. Safe here because all five
        // slides are below initialNumToRender and are always mounted anyway.
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={renderSlide}
        style={styles.flatList}
      />

      <View style={styles.footer}>
        {/* Never mirrored by hand: the dots map to the slides' PHYSICAL order,
            which already follows the list's real layout direction. Reversing
            them on language alone made the active dot appear to walk backwards
            while the carousel still advanced the other way. */}
        <View style={styles.dotsRow}>
          {SLIDE_INDICES.map((i) => (
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
            <View style={[styles.ctaContent, mirrorRows && styles.rowReverse]}>
              <Text style={styles.ctaText}>{isLastSlide ? t('getStarted') : t('next')}</Text>
              <Ionicons
                // Points the way the carousel physically moves, so it tracks
                // the real layout rather than a direction change still waiting
                // on a restart.
                name={LAYOUT_IS_RTL ? 'arrow-back' : 'arrow-forward'}
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
    headerRTL: {
      justifyContent: 'flex-start',
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
    brandWordmarkImg: {
      height: 30,
      width: 30 * WORDMARK_RATIO,
      marginBottom: 16,
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
      borderColor: BRAND_BLUE,
      backgroundColor: `${BRAND_BLUE}14`,
    },
    languageChipText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 14,
      color: tokens.ink,
    },
    languageChipTextActive: {
      color: BRAND_BLUE,
      fontFamily: fontFamilies.bodySemiBold,
    },
    themeLabel: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: tokens.ink,
      opacity: 0.6,
      textAlign: 'center',
      marginTop: 28,
      marginBottom: 10,
    },
    themeToggleTrack: {
      flexDirection: 'row',
      backgroundColor: `${tokens.ink}0D`,
      borderRadius: radiusTokens.md,
      padding: 4,
      gap: 4,
    },
    themeToggleOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: 20,
      borderRadius: radiusTokens.sm,
    },
    themeToggleOptionActive: {
      backgroundColor: BRAND_BLUE,
    },
    themeToggleText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: tokens.ink,
    },
    themeToggleTextActive: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
    },
    filterPillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
      marginTop: 4,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: radiusTokens.md,
      backgroundColor: `${BRAND_BLUE}14`,
      borderWidth: 1,
      borderColor: `${BRAND_BLUE}33`,
    },
    filterPillText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: BRAND_BLUE,
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
      borderColor: BRAND_BLUE,
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
      backgroundColor: `${BRAND_BLUE}14`,
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
    // Stated explicitly in both directions rather than relying on the layout
    // default, which is right-aligned on a session that booted in Arabic and
    // would leave English/French text hanging on the wrong edge.
    textRTL: {
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    textLTR: {
      textAlign: 'left',
      writingDirection: 'ltr',
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
      backgroundColor: BRAND_BLUE,
    },
    dotInactive: {
      backgroundColor: `${tokens.ink}33`,
    },
    ctaButton: {
      height: 54,
      borderRadius: radiusTokens.md,
      backgroundColor: BRAND_BLUE,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: BRAND_BLUE,
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
