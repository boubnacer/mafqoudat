/**
 * Overflow (⋮) menu for AppHeader: a Browse section (All Posts/Lost/Found -
 * jumps to Home already filtered), Settings, the website's secondary pages
 * (About, Help Center, Safety Tips, Contact Us, Privacy Policy, Terms), and
 * Sign Out. Follows LanguageDropdown's modal-popover pattern (transparent
 * Modal, tap-outside/back to dismiss) rather than a real navigation drawer.
 *
 * Controlled by the parent (AppHeader): `visible`/`onClose` so AppHeader can
 * keep this, the country picker, and the language dropdown mutually
 * exclusive - only one overlay open at a time.
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

// Roughly the header's own content height (a single title/controls row), so
// the menu pops open just under it rather than overlapping.
const HEADER_CONTENT_HEIGHT = 60;

const HeaderMenu = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, radii, fontSizes } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { floptions } = useReferenceData();
  const navigation = useNavigation();
  const isRTL = currentLanguage === 'ar';

  const styles = createStyles({ colors, spacing, radii, fontSizes });
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

  const renderItem = ({ key, label, icon, iconColor, onPress, destructive }) => (
    <TouchableOpacity key={key} style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={icon}
        size={fontSizes.md}
        color={destructive ? colors.danger : iconColor || colors.textSecondary}
        style={styles.itemIcon}
      />
      <Text style={[styles.itemText, textStyle, destructive && { color: colors.danger }]} numberOfLines={1}>
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

const createStyles = ({ colors, spacing, radii, fontSizes }) =>
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
      end: spacing.lg,
      width: 240,
      maxWidth: '80%',
      maxHeight: 440,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    scrollArea: {
      // maxHeight on the ScrollView itself (not just the outer menu View) is
      // what actually makes RN cap and scroll the content on short screens.
      maxHeight: 440,
    },
    sectionHeader: {
      fontSize: fontSizes.xs,
      fontWeight: 'bold',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    itemIcon: {
      marginEnd: spacing.sm,
    },
    itemText: {
      flex: 1,
      fontSize: fontSizes.sm,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    textRTL: {
      textAlign: 'right',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.xs,
      marginHorizontal: spacing.md,
    },
  });

export default HeaderMenu;
