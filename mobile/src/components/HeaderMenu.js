/**
 * Overflow (☰) menu for AppHeader: everything that used to live as separate
 * icon buttons in the header bar - country, language, theme - now lives here
 * as rows, alongside the original Browse section (All Posts/Lost/Found -
 * jumps to Home already filtered), Settings, the website's secondary pages
 * (About, Help Center, Safety Tips, Contact Us, Privacy Policy, Terms), and
 * Sign Out. Mirrors the web app's mobile Drawer (client/src/components/Navbar.jsx,
 * <760px) which collapses the same set of controls behind one menu icon.
 * Follows LanguageDropdown's modal-popover pattern (transparent Modal,
 * tap-outside/back to dismiss) rather than a real navigation drawer.
 *
 * Controlled by the parent (AppHeader): `visible`/`onClose` so AppHeader can
 * keep this and the country picker mutually exclusive - only one overlay open
 * at a time. `countryFlag`/`countryLabel`/`onOpenCountryPicker` are threaded
 * through from AppHeader since it already owns the controlled/self-managed
 * country state; theme and language are read directly from their own
 * contexts here since both are global, not per-header state.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { WEB_BASE_URL } from '../config/api';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';

// Website pages, in the order they should appear in the menu. Opened via the
// site's own base URL (EXPO_PUBLIC_WEB_BASE_URL) rather than a hardcoded domain.
const WEBSITE_LINKS = [
  { key: 'about', path: '/about', icon: 'information-circle-outline' },
  { key: 'helpCenter', path: '/help', icon: 'help-circle-outline' },
  { key: 'safetyTips', path: '/safety', icon: 'shield-checkmark-outline' },
  { key: 'contactUs', path: '/contact', icon: 'mail-outline' },
  { key: 'privacyPolicy', path: '/privacy', icon: 'lock-closed-outline' },
  { key: 'termsOfService', path: '/terms', icon: 'document-text-outline' },
];

const LANGUAGES = [
  { code: 'en', short: 'EN' },
  { code: 'fr', short: 'FR' },
  { code: 'ar', short: 'AR' },
];

// Roughly the header's own content height (a single title/controls row), so
// the menu pops open just under it rather than overlapping.
const HEADER_CONTENT_HEIGHT = 60;

const HeaderMenu = ({ visible, onClose, countryFlag, countryLabel, onOpenCountryPicker }) => {
  const insets = useSafeAreaInsets();
  const { isDark, setThemeMode } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { floptions } = useReferenceData();
  const navigation = useNavigation();
  const isRTL = currentLanguage === 'ar';

  const styles = createStyles({ tokens, isDark });
  const textStyle = isRTL ? styles.textRTL : null;

  // Same floptions source PostsListScreen/PostFilterSheet use (ReferenceDataContext,
  // fetched once app-wide) - looked up by code rather than mapping floptions in
  // API order, so Lost always precedes Found regardless of backend ordering.
  const lostOption = floptions.find((fl) => fl.code === 'LOST');
  const foundOption = floptions.find((fl) => fl.code === 'FOUND');

  const runAndClose = (action) => {
    onClose();
    action();
  };

  // PostsListScreen lives on the root stack (a sibling of MainTabs, pushed
  // from HomeScreen's "See all" links) - navigate() bubbles up from wherever
  // this menu is opened (any of the 4 tabs, nested inside MainTabs) to find
  // it there. initialFl is read once on mount to pre-apply the filter.
  const handleBrowse = (flId) => {
    runAndClose(() => {
      navigation.navigate('PostsListScreen', { initialFl: flId });
    });
  };

  const handleSettings = () => {
    runAndClose(() => navigation.navigate('SettingsScreen'));
  };

  const handleOpenLink = (path) => {
    runAndClose(() => {
      Linking.openURL(`${WEB_BASE_URL}${path}`).catch(() => {
        Alert.alert(t('error'), t('failedToLoadFormData'));
      });
    });
  };

  const handleSignOut = () => {
    runAndClose(() => {
      Alert.alert(t('logout'), t('signOutConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: signOut },
      ]);
    });
  };

  const handleOpenCountryPicker = () => {
    onClose();
    onOpenCountryPicker();
  };

  const handleToggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const renderItem = ({ key, label, icon, iconColor, onPress, destructive }) => (
    <TouchableOpacity key={key} style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={icon}
        size={19}
        color={destructive ? tokens.status.lost.main : iconColor || `${tokens.ink}99`}
        style={styles.itemIcon}
      />
      <Text style={[styles.itemText, textStyle, destructive && { color: tokens.status.lost.main }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.menu, { top: insets.top + HEADER_CONTENT_HEIGHT }]}>
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={[styles.sectionHeader, textStyle]}>{t('browse')}</Text>
            {renderItem({ key: 'browseAll', label: t('allPosts'), icon: 'apps-outline', onPress: () => handleBrowse('') })}
            {lostOption
              ? renderItem({
                  key: 'browseLost',
                  label: getLocalizedLabel(lostOption, currentLanguage),
                  icon: 'help-buoy-outline',
                  iconColor: lostOption.color,
                  onPress: () => handleBrowse(lostOption._id),
                })
              : null}
            {foundOption
              ? renderItem({
                  key: 'browseFound',
                  label: getLocalizedLabel(foundOption, currentLanguage),
                  icon: 'gift-outline',
                  iconColor: foundOption.color,
                  onPress: () => handleBrowse(foundOption._id),
                })
              : null}

            <View style={styles.divider} />

            {/* Preferences cluster - country, language, theme. Visually boxed
                so it reads as one group, mirroring the web mobile drawer's
                own Preferences box. */}
            <View style={styles.prefsBox}>
              <TouchableOpacity style={styles.prefRow} onPress={handleOpenCountryPicker} activeOpacity={0.7}>
                <Text style={styles.prefFlag}>{countryFlag}</Text>
                <View style={styles.prefTextWrap}>
                  <Text style={[styles.itemText, textStyle]} numberOfLines={1}>
                    {t('country')}
                  </Text>
                  {countryLabel ? (
                    <Text style={[styles.prefSubtext, textStyle]} numberOfLines={1}>
                      {countryLabel}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={`${tokens.ink}66`} />
              </TouchableOpacity>

              <View style={styles.prefRow}>
                <Ionicons name="language-outline" size={19} color={`${tokens.ink}99`} style={styles.itemIcon} />
                <Text style={[styles.itemText, textStyle, styles.prefTextWrap]} numberOfLines={1}>
                  {t('language')}
                </Text>
                <View style={styles.langPills}>
                  {LANGUAGES.map((lang) => {
                    const active = currentLanguage === lang.code;
                    return (
                      <TouchableOpacity
                        key={lang.code}
                        onPress={() => setLanguage(lang.code)}
                        style={[styles.langPill, active && { backgroundColor: tokens.brandPrimary }]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.langPillText, active && styles.langPillTextActive]}>{lang.short}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity style={[styles.prefRow, styles.prefRowLast]} onPress={handleToggleTheme} activeOpacity={0.7}>
                <Ionicons
                  name={isDark ? 'sunny-outline' : 'moon-outline'}
                  size={19}
                  color={`${tokens.ink}99`}
                  style={styles.itemIcon}
                />
                <Text style={[styles.itemText, textStyle]} numberOfLines={1}>
                  {isDark ? t('themeLight') : t('themeDark')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {renderItem({ key: 'settings', label: t('settings'), icon: 'settings-outline', onPress: handleSettings })}

            <View style={styles.divider} />

            {WEBSITE_LINKS.map((link) =>
              renderItem({
                key: link.key,
                label: t(link.key),
                icon: link.icon,
                onPress: () => handleOpenLink(link.path),
              })
            )}

            <View style={styles.divider} />

            {renderItem({
              key: 'signOut',
              label: t('logout'),
              icon: 'log-out-outline',
              onPress: handleSignOut,
              destructive: true,
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = ({ tokens, isDark }) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    menu: {
      position: 'absolute',
      end: 16,
      width: 264,
      maxWidth: '85%',
      maxHeight: 520,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      paddingVertical: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    scrollArea: {
      // maxHeight on the ScrollView itself (not just the outer menu View) is
      // what actually makes RN cap and scroll the content on short screens.
      maxHeight: 520,
    },
    sectionHeader: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      color: `${tokens.ink}99`,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 6,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    itemIcon: {
      marginEnd: 10,
    },
    itemText: {
      flex: 1,
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 14,
      color: tokens.ink,
    },
    textRTL: {
      textAlign: 'right',
    },
    divider: {
      height: 1,
      backgroundColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      marginVertical: 4,
      marginHorizontal: 14,
    },
    prefsBox: {
      marginHorizontal: 8,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      overflow: 'hidden',
    },
    prefRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    prefRowLast: {
      borderBottomWidth: 0,
    },
    prefFlag: {
      fontSize: 18,
      marginEnd: 10,
    },
    prefTextWrap: {
      flex: 1,
    },
    prefSubtext: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}80`,
      marginTop: 1,
    },
    langPills: {
      flexDirection: 'row',
      gap: 4,
    },
    langPill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
      backgroundColor: `${tokens.ink}0F`,
    },
    langPillText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      color: `${tokens.ink}99`,
    },
    langPillTextActive: {
      color: '#FFFFFF',
    },
  });

export default HeaderMenu;
