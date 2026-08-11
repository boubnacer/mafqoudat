/**
 * First-launch onboarding slider - shown once (gated by OnboardingContext's
 * hasSeenOnboarding flag), then never again. Slide 1 picks a language and
 * light/dark mode, slides 2-4 introduce the app (report, browse, filter),
 * slide 5 requires a country before "Get Started".
 * Animated + PanResponder only (no reanimated/carousel/swiper lib), per the
 * mobile app's existing dependency footprint.
 *
 * The fields on slides 2-5 - the filter pills, the country picker and its list
 * - are neumorphic faces (components/NeumorphicSurface.js, palette in
 * theme/neumorphism.js), the same treatment Home's category and social sections
 * use: painted in the screen's own `surfaceBase` tone and read only from a
 * top-left highlight plus a bottom-right shade, so no fill contrast, no border,
 * no tinted background. Brand blue survives in icons, text and the footer CTA,
 * never as a face fill - a tinted face would break the one rule the effect
 * rests on. Selected/open state is the sunken face (`pressed`), which is also
 * what a touch does, hence Pressable with a render-prop child rather than
 * TouchableOpacity: the press has to reach the surface, not dim a wrapper.
 *
 * Slide 1 is deliberately NOT neumorphic and keeps its flat `surfaceRaised`
 * chips and its filled segmented theme toggle. It is the only slide whose
 * controls change the app's language and appearance for real rather than
 * previewing it, and the extra contrast is wanted there - a face in the page
 * tone is the quietest thing on screen, which is wrong for the first decision
 * a first-run user is asked to make.
 *
 * The faces are all siblings, never nested. NeumorphicSurface clips its
 * children (its highlight layer is `overflow: 'hidden'`), so a face inside
 * another face loses part of its own shadow unless the parent's padding is
 * larger than the shadow - fine for Home's social panel, not for anything
 * tightly packed.
 */

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTranslation } from '../../utils/translations';
import apiClient from '../../api/apiService';
import { getLocalizedLabel } from '../../context/ReferenceDataContext';
import { colorTokens, radiusTokens, fontFamilies, lightColors } from '../../theme/tokens';
import { useMeasuredLayoutDirection } from '../../utils/rtl';
import NeumorphicSurface from '../../components/NeumorphicSurface';
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

// How far / how fast a drag has to go before it counts as a page turn.
const SWIPE_DISTANCE_RATIO = 0.25;
const SWIPE_VELOCITY = 0.35;
const PAGE_DURATION = 280;
// A drag only takes over the gesture once it is clearly horizontal, so the
// country dropdown's own vertical list keeps its scrolling.
const DRAG_ACTIVATION_DISTANCE = 8;
const HORIZONTAL_DOMINANCE = 1.5;

// The carousel is a transform, not a scroll view, and that is the whole fix for
// the Arabic slides.
//
// A horizontal ScrollView/FlatList has no portable relationship between "slide
// index" and contentOffset.x once the layout is RTL: ScrollView.js and
// VirtualizedList.js contain no RTL handling at all, so scrollToOffset passes
// the number straight through, while the native side applies its own convention
// (ReactHorizontalScrollView.java: "offsets are from the right edge in RTL
// layouts"). Which one you actually get depends on the platform AND on whether
// the tree was really laid out mirrored - and after a JS-level relaunch it may
// not be, whatever I18nManager says (see useMeasuredLayoutDirection). Every
// index <-> offset guess is therefore wrong in at least one of those
// combinations: that mismatch is what left the scroll position and the slide
// fades out of sync, so the slide on screen interpolated to opacity 0 and slides
// 2-5 came up blank white in Arabic.
//
// translateX has no such convention. React Native never mirrors transforms, so
// `translateX: (index - progress) * width` puts slide i in exactly the same
// physical place in every language, on every platform, laid out either way.
// `progress` (in slide units) is the single source of truth for both the paging
// and the per-slide fade, so they cannot drift apart, and the animations look
// identical in RTL and LTR - which is the intent: only text, icons and control
// rows follow the language, never the motion.
const clampIndex = (index) => Math.min(SLIDE_COUNT - 1, Math.max(0, index));

// Same wordmark image LoginScreen/SignUpScreen/AppHeader use in place of a
// text brand name.
const BRAND_WORDMARK = require('../../../assets/mafWordmark.png');
const WORDMARK_RATIO = 984 / 213;

// Arabic rendering of the brand name, paired under the English wordmark image
// on the first slide's lockup - a brand asset, not language-driven UI copy, so
// it stays fixed the same way the wordmark image itself does not swap per
// currentLanguage.
const BRAND_WORDMARK_AR = 'مفقودات';

const LANGUAGE_CHIPS = [
  { code: 'en', nativeName: 'English' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'ar', nativeName: 'العربية' },
];

// Non-interactive labels illustrating what the browse filters cover - they get
// the same raised face as the real controls so the slide reads as one system.
const FILTER_PILLS = [
  { icon: 'earth', labelKey: 'country' },
  { icon: 'location', labelKey: 'city' },
  { icon: 'pricetag', labelKey: 'categories' },
];

// Fallback used only if /countries can't be reached during onboarding - keeps
// "Get Started" reachable rather than stranding a first-run user offline.
const FALLBACK_COUNTRIES = [
  { _id: 'fallback-ma', code: 'MA', names: { en: 'Morocco', fr: 'Maroc', ar: 'المغرب' }, flag: '🇲🇦' },
];

const OnboardingScreen = () => {
  const { selectCountry } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const { isDark, setThemeMode } = useTheme();
  const { completeOnboarding } = useOnboarding();
  const { t } = useTranslation();

  const tokens = isDark ? colorTokens.dark : colorTokens.light;

  // Two different notions of "RTL" have to coexist on this screen, and keeping
  // them apart is what makes it survive a language switch:
  //
  // - isRTL is the direction the PICKED LANGUAGE wants. It flips the instant
  //   Arabic is tapped, and it drives content only: which arrow glyph to show,
  //   which edge text hangs off.
  // - layoutIsRTL is the direction the view tree is ACTUALLY laid out in, which
  //   does NOT follow isRTL until the app is relaunched - and is MEASURED, not
  //   taken from I18nManager.isRTL, because after a JS-level relaunch the two
  //   disagree (see useMeasuredLayoutDirection). Reading the constant instead is
  //   what put Skip on the wrong side and reversed every row in Arabic.
  //
  // mirrorRows is true only while the two disagree. A row with flexDirection
  // 'row' ALREADY mirrors itself natively once the layout is RTL, so reversing
  // rows whenever isRTL is true double-flips them back to the wrong order.
  const [layoutIsRTL, directionProbe] = useMeasuredLayoutDirection();
  const isRTL = currentLanguage === 'ar';
  const mirrorRows = isRTL !== layoutIsRTL;

  const styles = useMemo(
    () => createStyles(tokens, mirrorRows, layoutIsRTL),
    [tokens, mirrorRows, layoutIsRTL]
  );

  // Position of the carousel measured in slides: 0 is slide 1, 2.5 is halfway
  // between slides 3 and 4. Drives translateX and the fades alike.
  const progress = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  // The pan handlers are created once and never re-created (a new PanResponder
  // mid-gesture drops the rest of it), so they read the live index and width
  // through refs rather than closing over state.
  const activeIndexRef = useRef(0);
  const dragStartIndex = useRef(0);
  // Measured rather than taken from Dimensions, so a split screen / foldable /
  // any inset that makes the carousel narrower than the window still pages by
  // exactly one slide.
  const [pagerWidth, setPagerWidth] = useState(SCREEN_WIDTH);
  const pagerWidthRef = useRef(SCREEN_WIDTH);
  // Own, JS-driven Animated.Values for the dot widths - 'width' isn't a style
  // property the native driver supports.
  const dotWidths = useRef(SLIDE_INDICES.map(() => new Animated.Value(8))).current;

  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [countryError, setCountryError] = useState('');
  const [showCountryList, setShowCountryList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePagerLayout = useCallback((event) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== pagerWidthRef.current) {
      pagerWidthRef.current = width;
      setPagerWidth(width);
    }
  }, []);

  const goToIndex = useCallback(
    (index) => {
      const target = clampIndex(index);
      activeIndexRef.current = target;
      setActiveIndex(target);
      Animated.timing(progress, {
        toValue: target,
        duration: PAGE_DURATION,
        easing: Easing.out(Easing.cubic),
        // 'progress' is written directly by the drag below, and a value can be
        // driven either from JS or natively but not both.
        useNativeDriver: false,
      }).start();
    },
    [progress]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Taps must reach the language chips / theme toggle / country list, so
        // the responder is only ever claimed on a clearly horizontal drag.
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > DRAG_ACTIVATION_DISTANCE &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * HORIZONTAL_DOMINANCE,
        onPanResponderGrant: () => {
          dragStartIndex.current = activeIndexRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          // Dragging left (negative dx) advances, in every language - the
          // carousel's motion is deliberately the same in RTL and LTR.
          const raw = dragStartIndex.current - gesture.dx / pagerWidthRef.current;
          progress.setValue(Math.min(SLIDE_COUNT - 1, Math.max(0, raw)));
        },
        onPanResponderRelease: (_, gesture) => {
          const threshold = pagerWidthRef.current * SWIPE_DISTANCE_RATIO;
          let target = dragStartIndex.current;
          if (gesture.dx <= -threshold || gesture.vx <= -SWIPE_VELOCITY) {
            target = dragStartIndex.current + 1;
          } else if (gesture.dx >= threshold || gesture.vx >= SWIPE_VELOCITY) {
            target = dragStartIndex.current - 1;
          }
          goToIndex(target);
        },
        // Settle back onto a whole slide if the gesture is taken away
        // mid-drag (a modal opening, the navigator moving on).
        onPanResponderTerminationRequest: () => true,
        onPanResponderTerminate: () => goToIndex(activeIndexRef.current),
      }),
    [goToIndex, progress]
  );

  const handleSkip = () => goToIndex(SLIDE_COUNT - 1);

  const handleNext = () => goToIndex(activeIndexRef.current + 1);

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

  // Rebuilt only when the carousel's width changes. translateX extrapolates
  // linearly on purpose, so slide i sits at exactly (i - progress) * width for
  // every progress value, however far away; the fade clamps instead, so
  // anything more than one slide out is simply invisible.
  const slideAnimatedStyles = useMemo(
    () =>
      SLIDE_INDICES.map((index) => {
        const center = index;
        const inputRange = [center - 1, center, center + 1];
        return {
          opacity: progress.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' }),
          transform: [
            {
              translateX: progress.interpolate({
                inputRange,
                outputRange: [pagerWidth, 0, -pagerWidth],
              }),
            },
            {
              translateY: progress.interpolate({ inputRange, outputRange: [16, 0, 16], extrapolate: 'clamp' }),
            },
          ],
        };
      }),
    [pagerWidth, progress]
  );

  const renderLanguageSlide = () => (
    <View style={styles.slideContent}>
      <Image
        source={BRAND_WORDMARK}
        resizeMode="contain"
        accessibilityLabel={t('brandName')}
        style={styles.brandWordmarkImg}
      />
      <Text style={styles.brandWordmarkAr}>{BRAND_WORDMARK_AR}</Text>

      <View style={styles.illustrationHolder}>
        <WelcomeMascotIllustration isDark={isDark} />
      </View>
      <Text style={styles.languageQuestionText}>{t('onboardingWelcomeHeadline')}</Text>

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
    </View>
  );

  const renderInfoSlide = (IllustrationComponent, headlineKey, bodyKey) => (
    <View style={styles.slideContent}>
      <View style={styles.illustrationHolder}>
        <IllustrationComponent isDark={isDark} />
      </View>
      <Text style={styles.headline}>{t(headlineKey)}</Text>
      <Text style={styles.body}>{t(bodyKey)}</Text>
    </View>
  );

  const renderFilterSlide = () => (
    <View style={styles.slideContent}>
      <View style={styles.illustrationHolder}>
        <FilterIllustration />
      </View>
      <Text style={styles.headline}>{t('onboardingFilterHeadline')}</Text>
      <Text style={styles.body}>{t('onboardingFilterBody')}</Text>

      <View style={[styles.filterPillsRow, mirrorRows && styles.rowReverse]}>
        {FILTER_PILLS.map((pill) => (
          <NeumorphicSurface
            key={pill.labelKey}
            isDark={isDark}
            radius={radiusTokens.md}
            contentStyle={styles.filterPill}
          >
            <Ionicons name={pill.icon} size={14} color={BRAND_BLUE} />
            <Text style={styles.filterPillText}>{t(pill.labelKey)}</Text>
          </NeumorphicSurface>
        ))}
      </View>
    </View>
  );

  const renderCountrySlide = () => (
    <View style={styles.slideContent}>
      <View style={styles.illustrationHolder}>
        <SecureIllustration />
      </View>
      <Text style={styles.headline}>{t('securePlatform')}</Text>
      <Text style={styles.body}>{t('securePlatformDesc')}</Text>

      <View style={styles.countrySection}>
        <Text style={styles.countryTitle}>{t('chooseCountryTitle')}</Text>
        <Text style={styles.countrySubtitle}>{t('chooseCountryDescription')}</Text>

        {countryError ? <Text style={styles.errorText}>{countryError}</Text> : null}

        <Pressable onPress={() => setShowCountryList((prev) => !prev)}>
          {({ pressed }) => (
            <NeumorphicSurface
              isDark={isDark}
              radius={radiusTokens.md}
              // Open reads as held down, which is also what the list below it
              // is: a well opened in the same surface.
              pressed={pressed || showCountryList}
              contentStyle={[styles.countryButton, mirrorRows && styles.rowReverse]}
            >
              <Text
                style={[
                  styles.countryButtonText,
                  !selectedCountry && styles.countryButtonPlaceholder,
                  isRTL ? styles.textRTL : styles.textLTR,
                ]}
                numberOfLines={1}
              >
                {selectedCountry
                  ? `${selectedCountry.flag || '🌍'} ${getCountryName(selectedCountry)}`
                  : t('chooseCountry')}
              </Text>
              <Ionicons
                name={showCountryList ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={selectedCountry ? BRAND_BLUE : tokens.ink}
              />
            </NeumorphicSurface>
          )}
        </Pressable>

        {showCountryList && (
          // Sunken face: the list is a well cut into the surface rather than a
          // card floating over it, so it belongs to the button that opened it.
          <NeumorphicSurface
            isDark={isDark}
            radius={radiusTokens.md}
            pressed
            style={styles.countryDropdown}
            contentStyle={styles.countryDropdownFace}
          >
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
                      style={[styles.countryItem, mirrorRows && styles.rowReverse]}
                      onPress={() => handleCountrySelect(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.countryFlag}>{item.flag || '🌍'}</Text>
                      <Text
                        style={[
                          styles.countryName,
                          isSelected && styles.countryNameSelected,
                          isRTL ? styles.textRTL : styles.textLTR,
                        ]}
                        numberOfLines={1}
                      >
                        {getCountryName(item)}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={18} color={BRAND_BLUE} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </NeumorphicSurface>
        )}
      </View>
    </View>
  );

  const renderSlideContent = (index) => {
    switch (index) {
      case 0:
        return renderLanguageSlide();
      case 1:
        return renderInfoSlide(ReportIllustration, 'onboardingReportHeadline', 'onboardingReportBody');
      case 2:
        return renderInfoSlide(FindIllustration, 'onboardingFindHeadline', 'onboardingFindBody');
      case 3:
        return renderFilterSlide();
      case 4:
      default:
        return renderCountrySlide();
    }
  };

  const isLastSlide = activeIndex === SLIDE_COUNT - 1;
  const isCtaDisabled = isLastSlide && (!selectedCountry || isSubmitting);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {directionProbe}

      <View style={[styles.header, mirrorRows && styles.headerRTL]}>
        {!isLastSlide ? (
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipText}>{t('skip')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      <View style={styles.pager} onLayout={handlePagerLayout} {...panResponder.panHandlers}>
        {SLIDE_INDICES.map((index) => (
          <Animated.View
            key={index}
            style={[styles.slide, { width: pagerWidth }, slideAnimatedStyles[index]]}
            // Off-screen slides are pushed outside the pager's clipped box, but
            // this also keeps their buttons out of the accessibility/touch tree.
            pointerEvents={activeIndex === index ? 'auto' : 'none'}
          >
            {renderSlideContent(index)}
          </Animated.View>
        ))}
      </View>

      <View style={styles.footer}>
        {/* The dots map to the slides' PHYSICAL order, which is left-to-right in
            every language because the carousel's translateX is - styles.dotsRow
            cancels any native mirroring so dot 0 stays on the left with slide 0. */}
        <View style={styles.dotsRow}>
          {SLIDE_INDICES.map((i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidths[i] }, activeIndex === i ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* The one accent-filled shape on the screen. It stays brand blue
            rather than becoming a neumorphic face: a soft UI needs a single
            element that clearly outranks the others, and a face painted in the
            page tone cannot be that. Disabled is the exception - it has nothing
            to outrank yet, so it drops to a sunken face like every other
            unavailable control here. */}
        {isCtaDisabled && !isSubmitting ? (
          <NeumorphicSurface isDark={isDark} radius={radiusTokens.md} pressed contentStyle={styles.ctaFace}>
            <Text style={[styles.ctaText, styles.ctaTextDisabled]}>
              {isLastSlide ? t('getStarted') : t('next')}
            </Text>
          </NeumorphicSurface>
        ) : (
          // Submitting keeps the filled button (with its spinner) and only
          // blocks the press - it is working, not unavailable.
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaFace]}
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
                  // Icons are never auto-mirrored, so this follows the PICKED
                  // language's reading direction and flips the moment Arabic is
                  // tapped - it does not track the carousel, whose motion is the
                  // same in both directions.
                  name={isRTL ? 'arrow-back' : 'arrow-forward'}
                  size={18}
                  color="#FFFFFF"
                  style={styles.ctaIcon}
                />
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (tokens, mirrorRows, layoutIsRTL) =>
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
    // The slides all sit on top of each other and are moved into place by
    // translateX, so the pager clips whatever is currently off to the side.
    pager: {
      flex: 1,
      overflow: 'hidden',
    },
    slide: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      // No left/right inset on purpose: the slide is exactly as wide as the
      // pager, so its static position is 0 whichever edge the layout starts
      // from, and there is nothing for RTL to swap.
    },
    slideContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    // The illustrations position their own parts with physical left/right, which
    // React Native swaps under an RTL layout (doLeftAndRightSwapInRTL). Pinning
    // the wrapper to LTR keeps every drawing identical in both directions - only
    // text and controls are supposed to follow the language.
    illustrationHolder: {
      direction: 'ltr',
      alignItems: 'center',
    },
    brandWordmarkImg: {
      height: 30,
      width: 30 * WORDMARK_RATIO,
      marginBottom: 4,
    },
    // Arabic half of the slide-1 lockup, directly under the English wordmark
    // image - same brand blue as the logo, Cairo (the display face) for a
    // proper Arabic headline weight rather than the body face.
    brandWordmarkAr: {
      fontFamily: fontFamilies.display,
      fontSize: 20,
      color: BRAND_BLUE,
      textAlign: 'center',
      // ~1cm gap down to the illustration (96 CSS px/in ÷ 2.54cm/in ≈ 38dp).
      marginBottom: 38,
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
    // "Choose your language" - shares font/size/color with themeLabel below
    // ("Choose your look") so the two section questions read as one matched
    // pair instead of one looking like a headline and the other a caption.
    languageQuestionText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
      textAlign: 'center',
      // ~1cm gap up from the illustration (96 CSS px/in ÷ 2.54cm/in ≈ 38dp).
      marginTop: 38,
      marginBottom: 8,
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
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
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
    // Faces carry padding/alignment only - the fill, radius and both shadows
    // come from NeumorphicSurface, and a background or border here would undo
    // the effect rather than add to it.
    filterPillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
      marginTop: 4,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    filterPillText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: tokens.ink,
      opacity: 0.8,
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
      height: 54,
      paddingHorizontal: 18,
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
    // Margin/positioning on the outer box, size on the face - see
    // NeumorphicSurface for why the two are split.
    countryDropdown: {
      marginTop: 10,
    },
    countryDropdownFace: {
      maxHeight: 260,
      paddingVertical: 4,
    },
    searchInput: {
      height: 44,
      marginHorizontal: 10,
      paddingHorizontal: 6,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: tokens.ink,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${tokens.ink}26`,
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
    countryFlag: {
      fontSize: 20,
    },
    countryName: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: tokens.ink,
    },
    // The rows sit inside the sunken list face, which is the same tone as
    // everything else - a tinted selected row would be the one fill contrast on
    // the screen, so selection is carried by the label and the checkmark.
    countryNameSelected: {
      fontFamily: fontFamilies.bodySemiBold,
      color: BRAND_BLUE,
    },
    // Stated explicitly in both directions rather than relying on the layout
    // default, which is right-aligned on a tree laid out RTL and would leave
    // English/French text hanging on the wrong edge. The literal 'right'/'left'
    // keyword is itself swapped once the layout really is mirrored, so it is
    // chosen against mirrorRows, exactly like the rows above.
    textRTL: {
      textAlign: mirrorRows ? 'right' : 'left',
      writingDirection: 'rtl',
    },
    textLTR: {
      textAlign: mirrorRows ? 'right' : 'left',
      writingDirection: 'ltr',
    },
    footer: {
      paddingHorizontal: 28,
      paddingBottom: 12,
      paddingTop: 8,
    },
    dotsRow: {
      // Cancels native mirroring so the dots read in the same physical order as
      // the carousel: dot 0 on the left, next to the left, always.
      flexDirection: layoutIsRTL ? 'row-reverse' : 'row',
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
    // Shared by the filled button and the sunken disabled face so the footer
    // never changes height between the two.
    ctaFace: {
      height: 54,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ctaButton: {
      borderRadius: radiusTokens.md,
      backgroundColor: BRAND_BLUE,
      shadowColor: BRAND_BLUE,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
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
    ctaTextDisabled: {
      color: tokens.ink,
      opacity: 0.4,
    },
    ctaIcon: {
      marginTop: 1,
    },
  });

export default OnboardingScreen;
