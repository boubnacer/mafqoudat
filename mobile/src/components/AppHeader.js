/**
 * Shared header for the four bottom-tab screens (Home, New Post, My Posts,
 * Profile). Carries the screen title, the current browsing-country chip
 * (opens CountryPickerModal), the language toggle, and the theme toggle -
 * mirroring the web app's Navbar (client/src/components/Navbar).
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
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { storage } from '../utils/storage';
import LanguageDropdown from './LanguageDropdown';
import CountryPickerModal from './CountryPickerModal';
import HeaderMenu from './HeaderMenu';

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
}) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, spacing, radii, fontSizes, isDark, setThemeMode } = theme;
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { countries } = useReferenceData();
  const isRTL = currentLanguage === 'ar';
  const isControlled = controlledCountryId !== undefined;

  const [selfCountryId, setSelfCountryId] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  // Bumped whenever the country picker or overflow menu opens, to force-close
  // LanguageDropdown's own internally-managed dropdown - keeps all three
  // overlays mutually exclusive without lifting LanguageDropdown's state out.
  const [closeLanguageDropdownSignal, setCloseLanguageDropdownSignal] = useState(0);

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

  // Keeps the country picker, the overflow menu, and LanguageDropdown's own
  // dropdown mutually exclusive - opening one closes the other two.
  const openCountryPicker = () => {
    setMenuVisible(false);
    setCloseLanguageDropdownSignal((n) => n + 1);
    setPickerVisible(true);
  };

  const openMenu = () => {
    setPickerVisible(false);
    setCloseLanguageDropdownSignal((n) => n + 1);
    setMenuVisible(true);
  };

  const handleLanguageDropdownOpen = () => {
    setPickerVisible(false);
    setMenuVisible(false);
  };

  const countryRef = countries.find((c) => (c._id || c.id) === countryId);
  const countryLabel = countryRef ? getLocalizedLabel(countryRef, currentLanguage) : '';
  const countryFlag = countryRef?.flag || '🌍';

  const styles = createStyles({ colors, spacing, radii, fontSizes });
  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, textStyle]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.controls}>
          {rightActions}
          <TouchableOpacity
            onPress={handleToggleTheme}
            style={styles.iconButton}
            accessibilityLabel={isDark ? t('themeLight') : t('themeDark')}
            hitSlop={8}
          >
            <Text style={styles.iconButtonText}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <LanguageDropdown compact onOpen={handleLanguageDropdownOpen} closeSignal={closeLanguageDropdownSignal} />
          {showMenu ? (
            <TouchableOpacity
              onPress={openMenu}
              style={styles.iconButton}
              accessibilityLabel={t('moreOptions')}
              hitSlop={8}
            >
              <Ionicons name="ellipsis-vertical" size={fontSizes.md} color={colors.primaryText} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <TouchableOpacity style={styles.countryChip} onPress={openCountryPicker}>
        <Text style={styles.countryFlag}>{countryFlag}</Text>
        <Text style={[styles.countryLabel, textStyle]} numberOfLines={1}>
          {countryLabel || t('selectCountry')}
        </Text>
      </TouchableOpacity>

      <CountryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectCountry}
        selectedCountryId={countryId}
        t={t}
        currentLanguage={currentLanguage}
        isRTL={isRTL}
      />

      {showMenu ? <HeaderMenu visible={menuVisible} onClose={() => setMenuVisible(false)} /> : null}
    </View>
  );
};

const createStyles = ({ colors, spacing, radii, fontSizes }) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      flex: 1,
      fontSize: fontSizes.xl,
      fontWeight: 'bold',
      color: colors.primaryText,
      marginEnd: spacing.sm,
    },
    textRTL: {
      textAlign: 'right',
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButtonText: {
      fontSize: fontSizes.md,
    },
    countryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.full,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
      maxWidth: '100%',
    },
    countryFlag: {
      fontSize: fontSizes.md,
      marginEnd: spacing.xs,
    },
    countryLabel: {
      color: colors.primaryText,
      fontSize: fontSizes.sm,
      fontWeight: '600',
      flexShrink: 1,
    },
  });

export default AppHeader;
