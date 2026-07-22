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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { storage } from '../utils/storage';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import CountryPickerModal from './CountryPickerModal';
import HeaderMenu from './HeaderMenu';

const BRAND_MARK = require('../../assets/icon.png');
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
  const theme = useTheme();
  const { isDark, setThemeMode } = theme;
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
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

  const styles = createStyles({ tokens, isDark });
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

const createStyles = ({ tokens, isDark }) =>
  StyleSheet.create({
    container: {
      backgroundColor: tokens.surfaceRaised,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    brand: {
      flexDirection: 'row',
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
      marginEnd: 10,
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
      marginEnd: 8,
    },
    title: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 17,
      color: tokens.ink,
      flexShrink: 1,
    },
    textRTL: {
      textAlign: 'right',
    },
    spacer: {
      flex: 1,
    },
    menuButton: {
      width: 38,
      height: 38,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      justifyContent: 'center',
      alignItems: 'center',
      marginStart: 8,
    },
  });

export default AppHeader;
