/**
 * Shared header for the four bottom-tab screens (Home, New Post, My Posts,
 * Profile) plus stack screens that push on top of them (e.g. PostsListScreen).
 * Mirrors the web app's Navbar (client/src/components/Navbar.jsx) in its
 * mobile/responsive (<760px) form: brand logo on the start side, a single
 * overflow "menu" icon on the end - everything else (country, theme,
 * language, browse shortcuts, settings, sign out) lives behind that menu,
 * same as the web navbar's mobile Drawer.
 *
 * Country selection can be controlled or self-managed:
 * - Controlled (pass `countryId` + `onSelectCountry`): used by PostsListScreen,
 *   which already owns "current browsing country" state and its own
 *   storage-resync-on-focus effect. Wiring the header into that existing state
 *   keeps a single source of truth and updates the list immediately, even
 *   while Home stays focused (a focus-effect alone wouldn't catch that case).
 * - Self-managed (props omitted): used by the other three tabs, which have no
 *   country state of their own. The header reads/writes storage directly and
 *   re-reads it on focus, so a change made elsewhere (including Home) shows up
 *   here, and a change made here is picked up by Home's existing resync effect
 *   the next time Home regains focus.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useNotifications } from '../context/NotificationsContext';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { storage } from '../utils/storage';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import CountryPickerModal from './CountryPickerModal';
import HeaderMenu from './HeaderMenu';
import { logical, row, needsDirectionFlip } from '../utils/rtl';

// The in-app logo, NOT the launcher icon. assets/icon.png is the Android/iOS
// app icon and has to be an opaque square with the glyph inset, which is the
// wrong shape for a UI element: rendered here it showed a white box covering
// the tinted tile behind it, with a visibly smaller glyph. brandMark.png is
// the same artwork cropped tight to the glyph and left transparent.
const BRAND_MARK = require('../../assets/brandMark.png');
const BRAND_WORDMARK = require('../../assets/mafWordmark.png');
const WORDMARK_RATIO = 984 / 213;

// Mirrors PostsListScreen's own resolveCountry: the onboarding-selected
// country takes priority, falling back to the account's registered country.
const resolveBrowsingCountry = async () => {
  const onboardingCountry = await storage.getCurrentCountry();
  if (onboardingCountry) return onboardingCountry;
  const userData = await storage.getUserData();
  return userData?.country || null;
};

const AppHeader = ({
  title,
  rightActions,
  countryId: controlledCountryId,
  onSelectCountry: controlledOnSelectCountry,
  showMenu = true,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  // The bell is hidden on the notifications screen itself - a control that
  // navigates to where you already are is just a dead target.
  const isOnNotificationsScreen = useRoute().name === 'Notifications';
  const theme = useTheme();
  const { isDark, setThemeMode } = theme;
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const { countries } = useReferenceData();
  const isRTL = currentLanguage === 'ar';
  const isControlled = controlledCountryId !== undefined;

  const [selfCountryId, setSelfCountryId] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const countryId = isControlled ? controlledCountryId : selfCountryId;

  // Self-managed mode only: re-read the persisted country whenever this tab
  // regains focus, so a change made on another tab's header (or Home's filter
  // sheet) shows up here without needing its own live-update channel.
  useFocusEffect(
    useCallback(() => {
      if (isControlled) return undefined;
      let isActive = true;
      resolveBrowsingCountry().then((id) => {
        if (isActive) setSelfCountryId(id);
      });
      return () => {
        isActive = false;
      };
    }, [isControlled])
  );

  const handleSelectCountry = ({ id }) => {
    setPickerVisible(false);
    if (isControlled) {
      controlledOnSelectCountry(id);
    } else {
      setSelfCountryId(id);
      storage.setCurrentCountry(id);
    }
  };

  const handleToggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const openCountryPicker = () => {
    setMenuVisible(false);
    setPickerVisible(true);
  };

  const openMenu = () => setMenuVisible(true);

  const countryRef = countries.find((c) => (c._id || c.id) === countryId);
  const countryLabel = countryRef ? getLocalizedLabel(countryRef, currentLanguage) : '';
  const countryFlag = countryRef?.flag || '🌍';

  const styles = createStyles({ tokens, isDark, isRTL });
  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel={t('back')} hitSlop={8}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={tokens.ink} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.brand}
            onPress={() => navigation.navigate('Home')}
            accessibilityLabel={t('brandName')}
            activeOpacity={0.75}
          >
            <View style={styles.brandMark}>
              <Image source={BRAND_MARK} style={styles.brandMarkImg} resizeMode="contain" />
            </View>
            <Image source={BRAND_WORDMARK} style={styles.brandWordmarkImg} resizeMode="contain" />
          </TouchableOpacity>
        )}

        {onBack && title ? (
          <Text style={[styles.title, textStyle]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}

        <View style={styles.spacer} />

        {rightActions}

        {/* Match alerts, in the bar rather than only in the overflow menu
            because the badge is only useful if it is visible without opening
            anything first.
            Shown to guests as well: NotificationsContext polls only while a
            session exists, so a signed-out user simply sees an unbadged bell,
            and tapping it lands on the screen's own Login guard - the same
            behaviour as New Post/My Posts/Profile. Gating it on isSignedIn
            instead made the whole feature invisible to anyone browsing
            signed out, with nothing to explain why. */}
        {!isOnNotificationsScreen ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.bellButton}
            accessibilityLabel={t('notifications')}
            hitSlop={8}
          >
            <Ionicons
              name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
              size={20}
              color={unreadCount > 0 ? tokens.brandPrimary : tokens.ink}
            />
            {unreadCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText} numberOfLines={1}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}

        {showMenu ? (
          <TouchableOpacity onPress={openMenu} style={styles.menuButton} accessibilityLabel={t('menu')} hitSlop={8}>
            <Ionicons name="menu-outline" size={22} color={tokens.ink} />
          </TouchableOpacity>
        ) : null}
      </View>

      <CountryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectCountry}
        selectedCountryId={countryId}
        t={t}
        currentLanguage={currentLanguage}
        isRTL={isRTL}
      />

      {showMenu ? (
        <HeaderMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          countryFlag={countryFlag}
          countryLabel={countryLabel}
          onOpenCountryPicker={openCountryPicker}
        />
      ) : null}
    </View>
  );
};

const createStyles = ({ tokens, isDark, isRTL }) =>
  StyleSheet.create({
    container: {
      backgroundColor: tokens.surfaceRaised,
      paddingHorizontal: 16,
      paddingBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    // Direction-dependent styles go through the helpers in utils/rtl.js
    // (row()/logical()), which compensate only when the language's direction
    // differs from the one native is already mirroring - see that file. Do NOT
    // write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
    // cancels out native mirroring once forceRTL has taken effect on relaunch.
    topRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
    },
    brand: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      flexShrink: 1,
    },
    brandMark: {
      width: 40,
      height: 40,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.brandPrimary}1F`,
      justifyContent: 'center',
      alignItems: 'center',
      ...logical(isRTL, { marginEnd: 10 }),
    },
    brandMarkImg: {
      width: 23,
      height: 23,
    },
    brandWordmarkImg: {
      height: 26,
      width: 26 * WORDMARK_RATIO,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      justifyContent: 'center',
      alignItems: 'center',
      ...logical(isRTL, { marginEnd: 8 }),
    },
    title: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 17,
      color: tokens.ink,
      flexShrink: 1,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
    spacer: {
      flex: 1,
    },
    menuButton: {
      width: 38,
      height: 38,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      justifyContent: 'center',
      alignItems: 'center',
      ...logical(isRTL, { marginStart: 8 }),
    },
    bellButton: {
      width: 38,
      height: 38,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      justifyContent: 'center',
      alignItems: 'center',
      ...logical(isRTL, { marginStart: 8 }),
    },
    bellBadge: {
      position: 'absolute',
      top: 2,
      // Pinned to the button's logical end corner so it stays on the outer
      // side of the icon in both directions.
      ...logical(isRTL, { end: 2 }),
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: tokens.status.lost.main,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bellBadgeText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 9,
      lineHeight: 12,
    },
  });

export default AppHeader;
