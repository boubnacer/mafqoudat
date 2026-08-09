/**
 * The two small presentational pieces every mobile match surface shares: the
 * confidence badge and the "why we paired these" reason chips.
 * Mirrors: client/src/features/notifications/MatchMeta.jsx
 *
 * Both are borderless pills carrying a small shadow of their own, per the
 * platform-wide treatment where depth reads from a card's sub-elements rather
 * than from the card (CLAUDE.md, Phase 9).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../../theme/tokens';
import { logical, row, needsDirectionFlip } from '../../utils/rtl';
import { REASON_ICONS, REASON_LABEL_KEYS, TIER_LABEL_KEYS, getTierTone } from './matchDisplay';

// Mirrors client/src/designTokens.js's elevationTokens e1, as RN shadow props -
// same helper every other mobile screen defines locally.
const getElevation = (isDark) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: isDark ? 0.4 : 0.06,
  shadowRadius: 2,
  elevation: 2,
});

/**
 * Confidence band + score. The band is the label; the percentage rides along as
 * secondary text, because a bare number ("62") tells a reader nothing.
 */
export const ConfidenceBadge = ({ tier, score, compact = false }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const tone = getTierTone(tokens, isDark, tier);
  const styles = createStyles({ isDark, isRTL });

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }, compact && styles.badgeCompact]}>
      <Ionicons name="shield-checkmark-outline" size={compact ? 12 : 14} color={tone.main} style={styles.badgeIcon} />
      <Text style={[styles.badgeText, { color: tone.main }, compact && styles.badgeTextCompact]} numberOfLines={1}>
        {t(TIER_LABEL_KEYS[tier] || TIER_LABEL_KEYS.possible)}
        {typeof score === 'number' ? ` · ${score}%` : ''}
      </Text>
    </View>
  );
};

/**
 * Every signal that contributed to the pairing, as chips. Showing the reasons
 * is what makes an automated alert trustworthy - a bare "possible match" with
 * no explanation reads as a guess.
 */
export const MatchReasons = ({ reasons = [], max = 6 }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';
  const styles = createStyles({ isDark, isRTL });

  const known = reasons.filter((reason) => REASON_LABEL_KEYS[reason]).slice(0, max);
  if (known.length === 0) return null;

  return (
    <View style={styles.reasonsWrap}>
      {known.map((reason) => (
        <View key={reason} style={[styles.reasonChip, { backgroundColor: `${tokens.ink}${isDark ? '1F' : '0F'}` }]}>
          <Ionicons
            name={REASON_ICONS[reason] || 'ellipse-outline'}
            size={12}
            color={tokens.brandPrimary}
            style={styles.reasonChipIcon}
          />
          <Text style={[styles.reasonChipText, { color: tokens.ink }]} numberOfLines={1}>
            {t(REASON_LABEL_KEYS[reason])}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Direction-dependent styles go through the helpers in utils/rtl.js
// (row()/logical()), which compensate only when the language's direction
// differs from the one native is already mirroring - see that file. Do NOT
// write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
// cancels out native mirroring once forceRTL has taken effect on relaunch.
const createStyles = ({ isDark, isRTL }) =>
  StyleSheet.create({
    badge: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radiusTokens.sm,
      ...getElevation(isDark),
    },
    badgeCompact: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    badgeIcon: {
      ...logical(isRTL, { marginEnd: 5 }),
    },
    badgeText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
    },
    badgeTextCompact: {
      fontSize: 11,
    },
    reasonsWrap: {
      flexDirection: row(isRTL),
      flexWrap: 'wrap',
      gap: 6,
    },
    reasonChip: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
      ...getElevation(isDark),
    },
    reasonChipIcon: {
      ...logical(isRTL, { marginEnd: 4 }),
    },
    reasonChipText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 11,
    },
  });

export default MatchReasons;
