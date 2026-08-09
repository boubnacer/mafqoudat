/**
 * Overflow (☰) menu for AppHeader: everything that used to live as separate
 * icon buttons in the header bar - country, language, theme - now lives here
 * as rows, alongside the original Browse section (All Posts/Lost/Found -
 * jumps to Home already filtered), an account section (New Post/My Posts/
 * Profile - formerly bottom-tab buttons, now that the tab bar is gone),
 * Settings, the website's secondary pages (About, Help Center, Safety Tips,
 * Contact Us, Privacy Policy, Terms), and Sign Out. Mirrors the web app's
 * mobile Drawer (client/src/components/Navbar.jsx, <760px) which collapses
 * the same set of controls behind one menu icon.
 *
 * Implemented as a real slide-in side drawer (full height, opens from the
 * logical start edge - left in LTR, right in RTL) rather than the small
 * centered popover this used to be, so the longer content list (now
 * including full-name language options and Sign Out) has room to breathe.
 * Driven by RN's own Animated API (already used for entrance transitions in
 * HomeScreen.js/OnboardingScreen.js) rather than a new library: the Modal
 * itself has no animation, a translateX Animated.Value slides the drawer in/
 * out and a parallel opacity value fades the backdrop, with the Modal kept
 * mounted for the short exit animation before actually closing.
 *
 * Controlled by the parent (AppHeader): `visible`/`onClose` so AppHeader can
 * keep this and the country picker mutually exclusive - only one overlay open
 * at a time. `countryFlag`/`countryLabel`/`onOpenCountryPicker` are threaded
 * through from AppHeader since it already owns the controlled/self-managed
 * country state; theme and language are read directly from their own
 * contexts here since both are global, not per-header state.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking, Alert, ScrollView, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { WEB_BASE_URL } from '../config/api';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { logical, row, needsDirectionFlip } from '../utils/rtl';

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

// Full endonyms (each language's own name, in its own script) rather than
// short codes - shown the same regardless of the app's current language, so
// these are deliberately not routed through t(). Mirrors the web app's own
// hardcoded LANGUAGE_LABELS (client/src/features/auth/authShared.jsx).
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
// Comfortable drawer width, capped so it doesn't swallow the whole screen on
// wider devices/tablets.
const DRAWER_WIDTH = Math.min(360, SCREEN_WIDTH * 0.86);

const HeaderMenu = ({ visible, onClose, countryFlag, countryLabel, onOpenCountryPicker }) => {
  const insets = useSafeAreaInsets();
  const { isDark, setThemeMode } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { isSignedIn, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { floptions } = useReferenceData();
  const navigation = useNavigation();
  const isRTL = currentLanguage === 'ar';

  const styles = createStyles({ tokens, isDark, isRTL });
  const textStyle = isRTL ? styles.textRTL : null;

  // Off-screen resting position is on the far side of the drawer's own start
  // edge: in LTR that's to the left (negative translateX), in RTL - where the
  // drawer is anchored to the right via the `start: 0` logical style below -
  // it's to the right (positive translateX). transform values are raw pixels
  // and don't auto-flip for RTL the way `start`/`end` do, so this has to be
  // computed explicitly.
  const hiddenOffset = isRTL ? DRAWER_WIDTH : -DRAWER_WIDTH;
  const translateX = useRef(new Animated.Value(hiddenOffset)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  // Kept mounted a beat longer than `visible` so the close animation can play
  // out before the Modal actually unmounts (Modal's own `visible` prop has no
  // exit-transition concept).
  const [isMounted, setIsMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      translateX.setValue(hiddenOffset);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (isMounted) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: hiddenOffset, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setIsMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Same floptions source PostsListScreen/PostFilterSheet use (ReferenceDataContext,
  // fetched once app-wide) - looked up by code rather than mapping floptions in
  // API order, so Lost always precedes Found regardless of backend ordering.
  const lostOption = floptions.find((fl) => fl.code === 'LOST');
  const foundOption = floptions.find((fl) => fl.code === 'FOUND');

  const runAndClose = (action) => {
    onClose();
    action();
  };

  // All screens now live on one root stack (see App.js) - navigate() reaches
  // any of them from wherever this menu is opened. initialFl is read once on
  // mount to pre-apply the filter.
  const handleBrowse = (flId) => {
    runAndClose(() => {
      navigation.navigate('PostsListScreen', { initialFl: flId });
    });
  };

  // New Post/My Posts/Profile used to be bottom-tab buttons; now that the tab
  // bar is gone, this menu is their only entry point. Each screen still
  // self-guards on isSignedIn (redirecting a guest to Login), same as before.
  const handleNewPost = () => {
    runAndClose(() => navigation.navigate('NewPost'));
  };

  const handleMyPosts = () => {
    runAndClose(() => navigation.navigate('MyPosts'));
  };

  const handleProfile = () => {
    runAndClose(() => navigation.navigate('Profile'));
  };

  const handleNotifications = () => {
    runAndClose(() => navigation.navigate('Notifications'));
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

  const handleSignIn = () => {
    runAndClose(() => navigation.navigate('Login'));
  };

  const handleOpenCountryPicker = () => {
    onClose();
    onOpenCountryPicker();
  };

  const handleToggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const renderItem = ({ key, label, icon, iconColor, onPress, destructive, trailingCount }) => (
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
      {trailingCount > 0 ? (
        <View style={styles.itemCount}>
          <Text style={styles.itemCountText} numberOfLines={1}>
            {trailingCount > 99 ? '99+' : String(trailingCount)}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  if (!isMounted) return null;

  return (
    <Modal transparent visible={isMounted} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          <View style={[styles.drawerHeader, { paddingTop: insets.top + 14 }]}>
            <Text style={[styles.drawerTitle, textStyle]} numberOfLines={1}>
              {t('menu')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={10} accessibilityLabel={t('close')}>
              <Ionicons name="close" size={22} color={tokens.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
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

              <View style={styles.prefLangBlock}>
                <View style={styles.prefLangHeaderRow}>
                  <Ionicons name="language-outline" size={19} color={`${tokens.ink}99`} style={styles.itemIcon} />
                  <Text style={[styles.itemText, textStyle]} numberOfLines={1}>
                    {t('language')}
                  </Text>
                </View>
                <View style={styles.langOptionsWrap}>
                  {LANGUAGES.map((lang) => {
                    const active = currentLanguage === lang.code;
                    return (
                      <TouchableOpacity
                        key={lang.code}
                        onPress={() => setLanguage(lang.code)}
                        style={[styles.langOption, active && styles.langOptionActive]}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[styles.langOptionText, textStyle, active && styles.langOptionTextActive]}
                          numberOfLines={1}
                        >
                          {lang.label}
                        </Text>
                        {active ? <Ionicons name="checkmark" size={16} color={tokens.brandPrimary} /> : null}
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

            {renderItem({ key: 'newPost', label: t('createNewPost'), icon: 'add-circle-outline', onPress: handleNewPost })}
            {renderItem({ key: 'myPosts', label: t('myPosts'), icon: 'list-outline', onPress: handleMyPosts })}
            {/* Also reachable from the header bell, which carries the badge.
                Shown to guests too - like New Post/My Posts/Profile above and
                below it, the screen itself bounces a signed-out user to Login.
                Hiding it instead left a guest with no way to discover that
                match alerts exist at all. */}
            {renderItem({
              key: 'notifications',
              label: t('notifications'),
              icon: 'notifications-outline',
              trailingCount: unreadCount,
              onPress: handleNotifications,
            })}
            {renderItem({ key: 'profile', label: t('profile'), icon: 'person-outline', onPress: handleProfile })}
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

            {isSignedIn
              ? renderItem({
                  key: 'signOut',
                  label: t('logout'),
                  icon: 'log-out-outline',
                  onPress: handleSignOut,
                  destructive: true,
                })
              : renderItem({
                  key: 'signIn',
                  label: t('login'),
                  icon: 'log-in-outline',
                  onPress: handleSignIn,
                })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = ({ tokens, isDark, isRTL }) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    drawer: {
      position: 'absolute',
      ...logical(isRTL, { start: 0 }),
      top: 0,
      bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: tokens.surfaceRaised,
      // No border - separated from the backdrop by elevation alone, per the
      // platform-wide "no borders on containers" rule. Only the inner edge
      // (facing into the screen) is rounded since the outer/top/bottom edges
      // sit flush against the device edges.
      ...logical(isRTL, { borderTopEndRadius: radiusTokens.xl, borderBottomEndRadius: radiusTokens.xl }),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.55 : 0.2,
      shadowRadius: 20,
      elevation: 20,
    },
    // Direction-dependent styles go through the helpers in utils/rtl.js
    // (row()/logical()), which compensate only when the language's direction
    // differs from the one native is already mirroring - see that file. Do NOT
    // write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
    // cancels out native mirroring once forceRTL has taken effect on relaunch.
    drawerHeader: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    drawerTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 19,
      color: tokens.ink,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollArea: {
      flex: 1,
    },
    sectionHeader: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
      color: `${tokens.ink}99`,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 6,
    },
    item: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    itemIcon: {
      ...logical(isRTL, { marginEnd: 10 }),
    },
    itemText: {
      flex: 1,
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 15,
      color: tokens.ink,
    },
    // Unread pill on the Notifications row - same count the header bell shows.
    itemCount: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      backgroundColor: tokens.status.lost.main,
      justifyContent: 'center',
      alignItems: 'center',
      ...logical(isRTL, { marginStart: 8 }),
    },
    itemCountText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 11,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
    divider: {
      height: 1,
      backgroundColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      marginVertical: 6,
      marginHorizontal: 18,
    },
    prefsBox: {
      marginHorizontal: 12,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      overflow: 'hidden',
    },
    prefRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    prefRowLast: {
      borderBottomWidth: 0,
    },
    prefFlag: {
      fontSize: 18,
      ...logical(isRTL, { marginEnd: 10 }),
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
    prefLangBlock: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    prefLangHeaderRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      marginBottom: 8,
    },
    langOptionsWrap: {
      ...logical(isRTL, { paddingStart: 29 }),
      gap: 2,
    },
    langOption: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: radiusTokens.sm,
    },
    langOptionActive: {
      backgroundColor: `${tokens.brandPrimary}14`,
    },
    langOptionText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 14,
      color: `${tokens.ink}CC`,
    },
    langOptionTextActive: {
      fontFamily: fontFamilies.bodySemiBold,
      color: tokens.brandPrimary,
    },
  });

export default HeaderMenu;
