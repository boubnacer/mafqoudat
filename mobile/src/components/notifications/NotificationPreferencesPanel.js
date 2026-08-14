/**
 * Match-alert settings, shown inline on the notifications screen.
 * Mirrors: client/src/features/notifications/NotificationPreferences.jsx
 *
 * Saves on every change rather than behind a submit button - the controls are
 * few and independent of each other, so a save step would only add a way to
 * lose a change.
 *
 * The device-push row is the one control that is not purely an account setting:
 * the OS permission sits above it, so the row hides itself on a platform this
 * build does not deliver to, explains itself when the permission has been
 * denied, and asks for the permission when it is switched on for the first
 * time.
 *
 * The web version uses a slider for the confidence floor; here it is a row of
 * discrete options instead. That avoids pulling in a slider dependency the app
 * doesn't have, and a tap target is easier to hit accurately than a drag on a
 * phone. The options stop at 75 for the same reason the web slider does: a
 * shared category in the same city scores exactly that, and the product
 * guarantees that pair reaches its owner.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../../theme/tokens';
import { logical, row, needsDirectionFlip } from '../../utils/rtl';
import { fetchNotificationPreferences, updateNotificationPreferences } from '../../api/notificationsApi';
import { getPushPermissionStatus, registerForPushNotifications } from '../../utils/pushNotifications';

// Must stay in step with the server's cap (STRONG_MATCH_SCORE, enforced in
// notificationsController.updatePreferences) - offering a higher option would
// show a value the API silently clamps back down.
const SCORE_OPTIONS = [50, 60, 70, 75];

const NotificationPreferencesPanel = () => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ tokens, isDark, isRTL });

  const [preferences, setPreferences] = useState(null);
  const [hasEmail, setHasEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  // 'granted' | 'undetermined' | 'blocked' | 'unsupported'. The account-level
  // toggle is only half the story for device pushes: the OS permission sits
  // above it, and a user who denied that (or is on a platform this build does
  // not deliver to yet) needs to be told so rather than left flipping a switch
  // that changes nothing they can observe.
  const [pushPermission, setPushPermission] = useState('unsupported');

  useEffect(() => {
    let isActive = true;
    getPushPermissionStatus().then((status) => {
      if (isActive) setPushPermission(status);
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    fetchNotificationPreferences()
      .then((data) => {
        if (!isActive) return;
        setPreferences(data?.preferences || {});
        setHasEmail(!!data?.hasEmail);
      })
      .catch(() => {
        if (isActive) setLoadFailed(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const save = async (patch) => {
    const previous = preferences;
    // Applied locally first so a switch never lags behind the finger; rolled
    // back to the previous value if the request fails.
    setPreferences((current) => ({ ...current, ...patch }));
    setSaveFailed(false);
    try {
      const data = await updateNotificationPreferences(patch);
      if (data?.preferences) setPreferences(data.preferences);
    } catch (error) {
      setPreferences(previous);
      setSaveFailed(true);
    }
  };

  const textStyle = isRTL ? styles.textRTL : null;

  if (isLoading) {
    return (
      <View style={styles.loadingBlock}>
        <ActivityIndicator size="small" color={tokens.brandPrimary} />
      </View>
    );
  }

  if (loadFailed || !preferences) {
    return <Text style={[styles.errorText, textStyle]}>{t('notifPreferencesLoadError')}</Text>;
  }

  const matchAlerts = preferences.matchAlerts !== false;
  const emailAlerts = preferences.emailAlerts === true;
  const pushAlerts = preferences.pushAlerts !== false;
  const commentAlerts = preferences.commentAlerts !== false;
  const minScore = typeof preferences.minScore === 'number' ? preferences.minScore : 50;
  const emailDisabled = !hasEmail || !matchAlerts;
  const pushSupported = pushPermission !== 'unsupported';
  const pushBlocked = pushPermission === 'blocked';
  const pushDisabled = !matchAlerts || pushBlocked;

  // Turning the switch back on after the OS permission was never decided is the
  // natural moment to ask for it - the user has just said, in the app's own
  // words, that they want these.
  const handleTogglePush = async (value) => {
    await save({ pushAlerts: value });
    if (!value || pushPermission === 'granted') return;
    await registerForPushNotifications({ language: currentLanguage });
    setPushPermission(await getPushPermissionStatus());
  };

  return (
    <View>
      {saveFailed ? (
        <Text style={[styles.errorText, textStyle]}>{t('notifPreferencesSaveError')}</Text>
      ) : null}

      <View style={styles.settingRow}>
        <View style={styles.settingTextWrap}>
          <Text style={[styles.settingTitle, textStyle]}>{t('notifPrefMatchAlerts')}</Text>
          <Text style={[styles.settingDescription, textStyle]}>{t('notifPrefMatchAlertsDescription')}</Text>
        </View>
        <Switch
          value={matchAlerts}
          onValueChange={(value) => save({ matchAlerts: value })}
          trackColor={{ false: `${tokens.ink}33`, true: `${tokens.brandPrimary}80` }}
          thumbColor={matchAlerts ? tokens.brandPrimary : undefined}
        />
      </View>

      {pushSupported ? (
        <>
          <View style={styles.divider} />

          <View style={[styles.settingRow, pushDisabled && styles.settingRowDisabled]}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, textStyle]}>{t('notifPrefPushAlerts')}</Text>
              <Text style={[styles.settingDescription, textStyle]}>
                {pushBlocked ? t('notifPrefPushAlertsBlocked') : t('notifPrefPushAlertsDescription')}
              </Text>
              {pushBlocked ? (
                <TouchableOpacity onPress={() => Linking.openSettings()} activeOpacity={0.7}>
                  <Text style={[styles.linkText, textStyle]}>{t('notifPrefPushOpenSettings')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Switch
              value={pushAlerts && !pushBlocked}
              disabled={pushDisabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: `${tokens.ink}33`, true: `${tokens.brandPrimary}80` }}
              thumbColor={pushAlerts && !pushBlocked ? tokens.brandPrimary : undefined}
            />
          </View>
        </>
      ) : null}

      <View style={styles.divider} />

      <View style={[styles.settingRow, emailDisabled && styles.settingRowDisabled]}>
        <View style={styles.settingTextWrap}>
          <Text style={[styles.settingTitle, textStyle]}>{t('notifPrefEmailAlerts')}</Text>
          <Text style={[styles.settingDescription, textStyle]}>
            {hasEmail ? t('notifPrefEmailAlertsDescription') : t('notifPrefEmailAlertsNoEmail')}
          </Text>
        </View>
        <Switch
          value={emailAlerts && hasEmail}
          disabled={emailDisabled}
          onValueChange={(value) => save({ emailAlerts: value })}
          trackColor={{ false: `${tokens.ink}33`, true: `${tokens.brandPrimary}80` }}
          thumbColor={emailAlerts && hasEmail ? tokens.brandPrimary : undefined}
        />
      </View>

      <View style={styles.divider} />

      <View style={!matchAlerts && styles.settingRowDisabled} pointerEvents={matchAlerts ? 'auto' : 'none'}>
        <Text style={[styles.settingTitle, textStyle]}>{t('notifPrefMinScore')}</Text>
        <Text style={[styles.settingDescription, textStyle]}>{t('notifPrefMinScoreDescription')}</Text>

        <View style={styles.scoreOptionsRow}>
          {SCORE_OPTIONS.map((option) => {
            const active = minScore === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.scoreOption, active && styles.scoreOptionActive]}
                onPress={() => save({ minScore: option })}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.scoreOptionText, active && styles.scoreOptionTextActive]}>{`${option}%`}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.settingDescription, textStyle]}>
          {t('notifPrefMinScoreCurrent', { score: minScore })}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Independent of matchAlerts above - a comment is not a match lead, and
          turning off leads should not silently turn off comment replies too. */}
      <View style={styles.settingRow}>
        <View style={styles.settingTextWrap}>
          <Text style={[styles.settingTitle, textStyle]}>{t('notifPrefCommentAlerts')}</Text>
          <Text style={[styles.settingDescription, textStyle]}>{t('notifPrefCommentAlertsDescription')}</Text>
        </View>
        <Switch
          value={commentAlerts}
          onValueChange={(value) => save({ commentAlerts: value })}
          trackColor={{ false: `${tokens.ink}33`, true: `${tokens.brandPrimary}80` }}
          thumbColor={commentAlerts ? tokens.brandPrimary : undefined}
        />
      </View>
    </View>
  );
};

// Direction-dependent styles go through the helpers in utils/rtl.js
// (row()/logical()) - see that file's note on why a bare isRTL ternary breaks
// once native mirroring is active.
const createStyles = ({ tokens, isDark, isRTL }) =>
  StyleSheet.create({
    loadingBlock: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    settingRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingVertical: 10,
    },
    settingRowDisabled: {
      opacity: 0.5,
    },
    settingTextWrap: {
      flex: 1,
      ...logical(isRTL, { marginEnd: 12 }),
    },
    settingTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
    },
    settingDescription: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}99`,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      marginVertical: 6,
    },
    scoreOptionsRow: {
      flexDirection: row(isRTL),
      gap: 8,
      marginTop: 10,
      marginBottom: 8,
    },
    scoreOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 9,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0F`,
    },
    scoreOptionActive: {
      backgroundColor: tokens.brandPrimary,
    },
    scoreOptionText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
      color: `${tokens.ink}CC`,
    },
    scoreOptionTextActive: {
      color: '#FFFFFF',
    },
    errorText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      color: tokens.status.lost.main,
      marginBottom: 8,
    },
    linkText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: tokens.brandPrimary,
      marginTop: 4,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
  });

export default NotificationPreferencesPanel;
