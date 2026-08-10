/**
 * Blocked Users Screen
 *
 * Management side of the block action on PostDetailScreen. Google Play's UGC
 * policy asks for the ability to block another user; a block the user cannot
 * find again or undo is not really a control, so this screen exists to list and
 * reverse them.
 *
 * Styling follows SettingsScreen (Phase 9: parent cards borderless and
 * shadowless), and direction-dependent styles go through utils/rtl.js.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import AppHeader from '../components/AppHeader';
import DataStateView from '../components/DataStateView';
import { logical, row, needsDirectionFlip } from '../utils/rtl';

const BlockedUsersScreen = ({ navigation }) => {
  const { currentLanguage } = useLanguage();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';

  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark, isRTL), [tokens, isDark, isRTL]);
  const textStyle = isRTL ? styles.textRTL : null;

  const [blocked, setBlocked] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // A translation *key*, not a translated string. useTranslation() builds a new
  // `t` on every render, so translating at fetch time would force `t` into this
  // callback's dependencies - and that is what made this screen spin: a new `t`
  // gave a new loadBlocked, which gave useFocusEffect a new callback, which
  // re-ran the effect, which set state and re-rendered. An endless refetch loop.
  // Storing the key and translating at render keeps the fetch free of `t`
  // entirely, matching how PostDetailScreen's loadPost already handles this.
  const [errorKey, setErrorKey] = useState('');
  // Per-row, so unblocking one entry never greys out the rest of the list.
  const [pendingId, setPendingId] = useState(null);

  const loadBlocked = useCallback(async () => {
    setIsLoading(true);
    setErrorKey('');
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.BLOCKS);
      setBlocked(response.data?.blocked || []);
    } catch (err) {
      console.error('Error loading blocked users:', err);
      setErrorKey(err.response ? 'blockedUsersError' : 'networkError');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch on focus: the user can block someone from PostDetailScreen and come
  // straight back here, and this screen stays mounted in the stack meanwhile.
  useFocusEffect(
    useCallback(() => {
      loadBlocked();
    }, [loadBlocked])
  );

  const handleUnblock = (item) => {
    Alert.alert(t('unblockUserConfirmTitle'), t('unblockUserConfirmMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('unblockUser'),
        onPress: async () => {
          setPendingId(item.id);
          try {
            await apiClient.delete(API_ENDPOINTS.USERS.UNBLOCK(item.id));
            setBlocked((prev) => prev.filter((entry) => entry.id !== item.id));
          } catch (err) {
            console.error('Error unblocking user:', err);
            Alert.alert(t('error'), err.response?.data?.message || t('unblockUserError'));
          } finally {
            setPendingId(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const fullName = [item.firstName, item.lastName].filter(Boolean).join(' ');
    return (
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={18} color={`${tokens.ink}99`} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.username, textStyle]} numberOfLines={1}>
            {item.username}
          </Text>
          {fullName ? (
            <Text style={[styles.fullName, textStyle]} numberOfLines={1}>
              {fullName}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => handleUnblock(item)}
          disabled={pendingId === item.id}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('unblockUser')}
        >
          {pendingId === item.id ? (
            <ActivityIndicator size="small" color={tokens.brandPrimary} />
          ) : (
            <Text style={styles.unblockButtonText}>{t('unblockUser')}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('blockedUsers')} showMenu={false} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.brandPrimary} />
        </View>
      ) : errorKey ? (
        <DataStateView
          variant="error"
          message={t(errorKey)}
          actionLabel={t('retry')}
          onAction={loadBlocked}
          isRTL={isRTL}
        />
      ) : blocked.length === 0 ? (
        <DataStateView message={t('blockedUsersEmptyMessage')} isRTL={isRTL} />
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={[styles.intro, textStyle]}>{t('blockedUsersIntro')}</Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const createStyles = (tokens, isDark, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
    },
    intro: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      lineHeight: 20,
      color: `${tokens.ink}99`,
      marginBottom: 16,
    },
    // Direction-dependent styles go through the helpers in utils/rtl.js
    // (row()/logical()), which compensate only when the language's direction
    // differs from the one native is already mirroring - see that file. Do NOT
    // write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
    // cancels out native mirroring once forceRTL has taken effect on relaunch.
    row: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.lg,
      padding: 14,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: `${tokens.ink}0A`,
      alignItems: 'center',
      justifyContent: 'center',
      ...logical(isRTL, { marginEnd: 12 }),
    },
    rowText: {
      flex: 1,
    },
    username: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
    },
    fullName: {
      marginTop: 2,
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
    },
    unblockButton: {
      minWidth: 84,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: tokens.brandPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      ...logical(isRTL, { marginStart: 10 }),
    },
    unblockButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: tokens.brandPrimary,
    },
    separator: {
      height: 10,
    },
  });

export default BlockedUsersScreen;
