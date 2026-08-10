/**
 * Delete Account Screen
 *
 * Self-service account deletion, reached from Settings. Google Play's User Data
 * policy requires an app that creates accounts to offer deletion from inside the
 * app (and to actually erase the data collected under the account, which the
 * server does - see usersController.purgeUserData).
 *
 * Deliberately a screen rather than an Alert: the user has to be able to read
 * what is about to be erased before agreeing to it, and the confirmation is a
 * typed username rather than a single tap. Typing the username also works for
 * Google/Facebook accounts, which have no password to re-authenticate with.
 *
 * Styling follows SettingsScreen/EditProfileScreen - Phase 9 parent cards
 * (borderless, shadowless), form inputs keep their border, and every
 * direction-dependent style goes through utils/rtl.js.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import AppHeader from '../components/AppHeader';
import { logical, row, needsDirectionFlip } from '../utils/rtl';

// Mirrors what purgeUserData actually removes server-side. Kept in step with it
// on purpose: a deletion screen that overstates or understates what it erases is
// the thing Play's reviewers read first.
const ERASED_ITEMS = [
  { key: 'deleteAccountItemPosts', icon: 'document-text-outline' },
  { key: 'deleteAccountItemPhotos', icon: 'image-outline' },
  { key: 'deleteAccountItemAlerts', icon: 'notifications-outline' },
  { key: 'deleteAccountItemProfile', icon: 'person-outline' },
  { key: 'deleteAccountItemMessages', icon: 'mail-outline' },
];

const DeleteAccountScreen = ({ navigation }) => {
  const { user, signOutLocally } = useAuth();
  const { currentLanguage } = useLanguage();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';

  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark, isRTL), [tokens, isDark, isRTL]);
  const textStyle = isRTL ? styles.textRTL : null;

  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const username = user?.username || '';
  // Case-insensitive, matching the server's own comparison, so a phone keyboard
  // auto-capitalising the first letter doesn't block a correct confirmation.
  const canDelete =
    username.length > 0 &&
    confirmText.trim().toLowerCase() === username.toLowerCase() &&
    !isDeleting;

  const runDeletion = async () => {
    setIsDeleting(true);
    setError('');

    try {
      await apiClient.delete(API_ENDPOINTS.USERS.DELETE_ME, {
        data: { confirmUsername: confirmText.trim() },
      });

      // The account is gone, so there is no session left to invalidate against
      // the server - clear it locally and drop back to the Login screen.
      await signOutLocally();
      Alert.alert(t('deleteAccountDoneTitle'), t('deleteAccountDoneMessage'));
    } catch (err) {
      console.error('Error deleting account:', err);
      if (!err.response) {
        setError(t('networkError'));
      } else if (err.response.status === 400) {
        setError(t('deleteAccountConfirmMismatch'));
      } else {
        setError(err.response?.data?.message || t('deleteAccountError'));
      }
      setIsDeleting(false);
    }
  };

  // Second gate. The typed username proves intent; this catches the tap that
  // followed it by reflex.
  const handleDeletePress = () => {
    if (!canDelete) return;

    Alert.alert(t('deleteAccountConfirmTitle'), t('deleteAccountConfirmMessage'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('deleteAccountConfirmAction'), style: 'destructive', onPress: runDeletion },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('deleteAccount')} showMenu={false} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.warningCard}>
            <Ionicons
              name="warning-outline"
              size={22}
              color={tokens.status.lost.main}
              style={styles.warningIcon}
            />
            <Text style={[styles.warningText, textStyle]}>{t('deleteAccountWarning')}</Text>
          </View>

          <Text style={[styles.sectionLabel, textStyle]}>{t('deleteAccountWhatIsErased')}</Text>
          <View style={styles.card}>
            {ERASED_ITEMS.map((item, index) => (
              <View key={item.key}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.itemRow}>
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={`${tokens.ink}99`}
                    style={styles.itemIcon}
                  />
                  <Text style={[styles.itemText, textStyle]}>{t(item.key)}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionLabel, textStyle]}>{t('deleteAccountConfirmLabel')}</Text>
          <View style={styles.card}>
            <Text style={[styles.helperText, textStyle]}>
              {t('deleteAccountConfirmHelper')}
            </Text>
            <View style={styles.usernameChip}>
              <Text style={styles.usernameChipText} selectable>
                {username}
              </Text>
            </View>
            <TextInput
              style={[styles.input, textStyle, error ? styles.inputError : null]}
              value={confirmText}
              onChangeText={(value) => {
                setConfirmText(value);
                if (error) setError('');
              }}
              placeholder={t('deleteAccountConfirmPlaceholder')}
              placeholderTextColor={`${tokens.ink}66`}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isDeleting}
              accessibilityLabel={t('deleteAccountConfirmLabel')}
            />
            {error ? <Text style={[styles.errorText, textStyle]}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, !canDelete && styles.deleteButtonDisabled]}
            onPress={handleDeletePress}
            disabled={!canDelete}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('deleteAccount')}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteButtonText}>{t('deleteAccountAction')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isDeleting}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('cancel')}
          >
            <Text style={[styles.cancelButtonText, textStyle]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (tokens, isDark, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    flex: {
      flex: 1,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    // Direction-dependent styles go through the helpers in utils/rtl.js
    // (row()/logical()), which compensate only when the language's direction
    // differs from the one native is already mirroring - see that file. Do NOT
    // write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
    // cancels out native mirroring once forceRTL has taken effect on relaunch.
    warningCard: {
      flexDirection: row(isRTL),
      alignItems: 'flex-start',
      backgroundColor: tokens.status.lost.bg,
      borderRadius: radiusTokens.lg,
      padding: 14,
      marginBottom: 22,
    },
    warningIcon: {
      ...logical(isRTL, { marginEnd: 10 }),
      marginTop: 1,
    },
    warningText: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      lineHeight: 21,
      color: tokens.status.lost.main,
    },
    sectionLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: `${tokens.ink}99`,
      marginBottom: 10,
      marginTop: 4,
    },
    card: {
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 14,
      marginBottom: 22,
    },
    itemRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingVertical: 10,
    },
    itemIcon: {
      ...logical(isRTL, { marginEnd: 12 }),
    },
    itemText: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      lineHeight: 20,
      color: tokens.ink,
    },
    divider: {
      height: 1,
      backgroundColor: `${tokens.ink}12`,
    },
    helperText: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      lineHeight: 20,
      color: `${tokens.ink}99`,
      marginBottom: 12,
    },
    usernameChip: {
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
      backgroundColor: `${tokens.ink}0A`,
      borderRadius: radiusTokens.sm,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 12,
    },
    usernameChipText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
    },
    // Form inputs keep their border - the Phase 8/9 borderless-surface rule
    // covers cards and panels, not controls.
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      borderRadius: radiusTokens.md,
      paddingHorizontal: 14,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      backgroundColor: `${tokens.ink}0A`,
      color: tokens.ink,
    },
    inputError: {
      borderColor: tokens.status.lost.main,
    },
    errorText: {
      marginTop: 8,
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: tokens.status.lost.main,
    },
    deleteButton: {
      height: 52,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.status.lost.main,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteButtonDisabled: {
      opacity: 0.45,
    },
    deleteButtonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
    },
    cancelButton: {
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    cancelButtonText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 15,
      color: `${tokens.ink}99`,
    },
  });

export default DeleteAccountScreen;
