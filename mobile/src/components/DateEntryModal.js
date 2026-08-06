/**
 * Date Entry Modal
 * Two-step, plain-language replacement for a calendar date picker / free-typed
 * date, used by PostForm for the optional "when was it lost/found" field on
 * both the create and edit flows. Step 1 takes the day as a number (skippable
 * when the user only remembers the month), step 2 takes the month by name and
 * the year. Everything defaults to today.
 *
 * Mirrors the web dialog (client/src/components/DateEntryDialog.jsx) - same
 * two steps, same validation, and the same stored string, so a post created on
 * one platform reads back correctly on the other. Month names are hardcoded
 * here rather than taken from Intl: Hermes builds ship without full ICU data
 * depending on platform/config, and the stored string must not vary by device.
 *
 * Visual language (surfaceRaised sheet, ink-alpha borders, brandPrimary
 * accents) mirrors SelectModal.js.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { logical, row, needsDirectionFlip } from '../utils/rtl';

// Arabic uses the Maghrebi Gregorian month names (ماي/يوليوز/غشت/شتنبر/نونبر/
// دجنبر) our users actually say, matching the web's 'ar-MA' locale output.
const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'],
};

// Month names stored in posts created before the switch to the Maghrebi set.
// Only used when reading a value back, never when writing one.
const LEGACY_AR_MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export const MIN_YEAR = 1900;

export const getMonthNames = (language) => MONTH_NAMES[language] || MONTH_NAMES.en;

// The string saved as the post's mainDate (free text server-side). Spelled-out
// month names on purpose - the whole point of this modal is that "03/04/2026"
// is ambiguous across dd/mm and mm/dd users.
export const formatDateValue = ({ day, month, year }, language) => {
  const monthName = getMonthNames(language)[month];
  if (!day) return `${monthName} ${year}`;
  if (language === 'en') return `${monthName} ${day}, ${year}`;
  return `${day} ${monthName} ${year}`;
};

// Best-effort read of a string previously produced by formatDateValue, so
// reopening the modal starts from what is already saved. Month names are
// matched across all languages (the user may have switched language, or the
// post may have been created on the web in another language).
export const parseDateValue = (value) => {
  if (!value || typeof value !== 'string') return null;

  const yearMatch = value.match(/\b(\d{4})\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);

  let month = null;
  [...Object.values(MONTH_NAMES), LEGACY_AR_MONTH_NAMES].forEach((names) => {
    if (month !== null) return;
    const index = names.findIndex((name) => value.toLowerCase().includes(name.toLowerCase()));
    if (index !== -1) month = index;
  });
  if (month === null) return null;

  // Any 1-2 digit standalone number left over is the day (the year is 4 digits).
  const dayMatch = value.replace(yearMatch[0], '').match(/\b(\d{1,2})\b/);
  const day = dayMatch ? Number(dayMatch[1]) : null;

  return { day, month, year };
};

const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();

const digitsOnly = (input, maxLength) => input.replace(/[^\d]/g, '').slice(0, maxLength);

const DateEntryModal = ({ visible, value, language, isRTL, onClose, onConfirm }) => {
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemo(() => createStyles(tokens, isDark, isRTL), [tokens, isDark, isRTL]);
  const textStyle = isRTL ? styles.textRTL : null;
  const monthNames = getMonthNames(language);

  const today = new Date();
  const currentYear = today.getFullYear();

  const [stage, setStage] = useState(0); // 0 = day, 1 = month + year
  const [day, setDay] = useState('');
  const [dayUnknown, setDayUnknown] = useState(false);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(String(currentYear));
  const [error, setError] = useState(null);

  // Seed from the saved value (or today) each time the sheet opens, so it never
  // reopens on a half-edited state from the previous opening.
  const handleShow = () => {
    const parsed = parseDateValue(value);
    setStage(0);
    setError(null);
    if (parsed) {
      setDay(parsed.day ? String(parsed.day) : '');
      setDayUnknown(!parsed.day);
      setMonth(parsed.month);
      setYear(String(parsed.year));
    } else {
      setDay(String(today.getDate()));
      setDayUnknown(false);
      setMonth(today.getMonth());
      setYear(String(currentYear));
    }
  };

  const handleNextFromDay = () => {
    if (!dayUnknown) {
      const dayNumber = Number(day);
      if (!day || Number.isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) {
        setError('datePickerInvalidDay');
        return;
      }
    }
    setError(null);
    setStage(1);
  };

  const handleSkipDay = () => {
    setDay('');
    setDayUnknown(true);
    setError(null);
    setStage(1);
  };

  const handleConfirm = () => {
    const yearNumber = Number(year);
    if (!year || Number.isNaN(yearNumber) || yearNumber < MIN_YEAR || yearNumber > currentYear) {
      setError({ key: 'datePickerInvalidYear', params: { min: MIN_YEAR, max: currentYear } });
      return;
    }

    const dayNumber = dayUnknown ? null : Number(day);
    if (dayNumber) {
      const maxDay = daysInMonth(month, yearNumber);
      if (dayNumber > maxDay) {
        setError({
          key: 'datePickerInvalidDayForMonth',
          params: { month: monthNames[month], year: yearNumber, days: maxDay },
        });
        return;
      }
    }

    // A lost/found item can't have happened in the future.
    const candidate = new Date(yearNumber, month, dayNumber || 1);
    const isFuture = dayNumber
      ? candidate.getTime() > today.getTime()
      : yearNumber > currentYear || (yearNumber === currentYear && month > today.getMonth());
    if (isFuture) {
      setError('datePickerFutureDate');
      return;
    }

    setError(null);
    onConfirm(formatDateValue({ day: dayNumber, month, year: yearNumber }, language));
  };

  const previewValue = (() => {
    const yearNumber = Number(year);
    if (!year || Number.isNaN(yearNumber)) return null;
    const dayNumber = dayUnknown ? null : Number(day) || null;
    return formatDateValue({ day: dayNumber, month, year: yearNumber }, language);
  })();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={handleShow}>
      <DateEntryModalBody
        styles={styles}
        tokens={tokens}
        textStyle={textStyle}
        stage={stage}
        day={day}
        year={year}
        month={month}
        monthNames={monthNames}
        error={error}
        previewValue={previewValue}
        currentYear={currentYear}
        onClose={onClose}
        onChangeDay={(text) => {
          setDay(digitsOnly(text, 2));
          setDayUnknown(false);
          setError(null);
        }}
        onChangeYear={(text) => {
          setYear(digitsOnly(text, 4));
          setError(null);
        }}
        onPickMonth={(index) => {
          setMonth(index);
          setError(null);
        }}
        onSkipDay={handleSkipDay}
        onBack={() => {
          setError(null);
          setStage(0);
        }}
        onNext={handleNextFromDay}
        onConfirm={handleConfirm}
      />
    </Modal>
  );
};

// Split out purely so the sheet's markup stays readable - it renders only
// inside <Modal>, so its state/effects unmount with the sheet.
const DateEntryModalBody = ({
  styles,
  tokens,
  textStyle,
  stage,
  day,
  year,
  month,
  monthNames,
  error,
  previewValue,
  currentYear,
  onClose,
  onChangeDay,
  onChangeYear,
  onPickMonth,
  onSkipDay,
  onBack,
  onNext,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const errorText = error
    ? typeof error === 'string'
      ? t(error)
      : t(error.key, error.params)
    : null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Ionicons name="calendar-outline" size={18} color={tokens.brandPrimary} style={styles.headerIcon} />
            <Text style={[styles.headerTitle, textStyle]} numberOfLines={1}>
              {t('datePickerTitle')}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <Ionicons name="close" size={20} color={tokens.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          <View style={styles.progressRow}>
            {[0, 1].map((index) => (
              <View key={index} style={[styles.progressSegment, index <= stage && styles.progressSegmentActive]} />
            ))}
          </View>
          <Text style={[styles.progressLabel, textStyle]}>
            {t('wizardStepProgressShort', { current: stage + 1, total: 2 })}
          </Text>

          {stage === 0 ? (
            <>
              <Text style={[styles.stepTitle, textStyle]}>{t('datePickerStepDayTitle')}</Text>
              <Text style={[styles.stepSubtitle, textStyle]}>{t('datePickerStepDaySubtitle')}</Text>

              <Text style={[styles.fieldLabel, textStyle]}>{t('datePickerDayLabel')}</Text>
              <TextInput
                style={styles.bigInput}
                value={day}
                onChangeText={onChangeDay}
                placeholder="1 - 31"
                placeholderTextColor={`${tokens.ink}66`}
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
              />

              <TouchableOpacity style={styles.skipButton} onPress={onSkipDay} activeOpacity={0.7}>
                <Ionicons name="help-circle-outline" size={18} color={tokens.brandPrimary} />
                <Text style={[styles.skipButtonText, textStyle]}>{t('datePickerSkipDay')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.stepTitle, textStyle]}>{t('datePickerStepMonthYearTitle')}</Text>
              <Text style={[styles.stepSubtitle, textStyle]}>{t('datePickerStepMonthYearSubtitle')}</Text>

              <Text style={[styles.fieldLabel, textStyle]}>{t('datePickerMonthLabel')}</Text>
              <View style={styles.monthGrid}>
                {monthNames.map((name, index) => {
                  const selected = index === month;
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[styles.monthChip, selected && styles.monthChipSelected]}
                      onPress={() => onPickMonth(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.monthChipText, selected && styles.monthChipTextSelected]} numberOfLines={1}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, textStyle]}>{t('datePickerYearLabel')}</Text>
              <TextInput
                style={styles.bigInput}
                value={year}
                onChangeText={onChangeYear}
                placeholder={String(currentYear)}
                placeholderTextColor={`${tokens.ink}66`}
                keyboardType="number-pad"
                maxLength={4}
              />

              {previewValue ? (
                <View style={styles.previewBox}>
                  <Text style={[styles.previewText, textStyle]}>
                    {t('datePickerSummary', { date: previewValue })}
                  </Text>
                </View>
              ) : null}
            </>
          )}

          {errorText ? <Text style={[styles.errorText, textStyle]}>{errorText}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={stage === 0 ? onClose : onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>{stage === 0 ? t('cancel') : t('back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={stage === 0 ? onNext : onConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{stage === 0 ? t('wizardNext') : t('confirm')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (tokens, isDark, isRTL) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: tokens.surfaceRaised,
      borderTopLeftRadius: radiusTokens.xl,
      borderTopRightRadius: radiusTokens.xl,
      maxHeight: '85%',
      paddingBottom: 16,
    },
    // Direction-dependent styles go through the helpers in utils/rtl.js
    // (row()/logical()) - see SelectModal.js for why raw `isRTL ? ... : ...`
    // flips are wrong here.
    header: {
      flexDirection: row(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    headerTitleWrap: {
      flex: 1,
      flexDirection: row(isRTL),
      alignItems: 'center',
    },
    headerIcon: {
      ...logical(isRTL, { marginEnd: 8 }),
    },
    headerTitle: {
      flex: 1,
      fontFamily: fontFamilies.displayRegular,
      fontWeight: '700',
      fontSize: 18,
      color: tokens.ink,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      justifyContent: 'center',
      alignItems: 'center',
      ...logical(isRTL, { marginStart: 8 }),
    },
    body: {
      paddingHorizontal: 20,
    },
    bodyContent: {
      paddingTop: 16,
      paddingBottom: 8,
    },
    progressRow: {
      flexDirection: row(isRTL),
      gap: 6,
      marginBottom: 8,
    },
    progressSegment: {
      flex: 1,
      height: 6,
      borderRadius: radiusTokens.sm,
      backgroundColor: `${tokens.ink}${isDark ? '1A' : '14'}`,
    },
    progressSegmentActive: {
      backgroundColor: tokens.brandPrimary,
    },
    progressLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: `${tokens.ink}99`,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },
    stepTitle: {
      marginTop: 18,
      fontFamily: fontFamilies.displayRegular,
      fontWeight: '700',
      fontSize: 17,
      color: tokens.brandPrimary,
    },
    stepSubtitle: {
      marginTop: 6,
      marginBottom: 16,
      fontFamily: fontFamilies.body,
      fontSize: 13,
      lineHeight: 19,
      color: `${tokens.ink}99`,
    },
    fieldLabel: {
      marginBottom: 8,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
    },
    bigInput: {
      height: 60,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '30' : '20'}`,
      backgroundColor: `${tokens.ink}0A`,
      textAlign: 'center',
      fontFamily: fontFamilies.displayRegular,
      fontWeight: '700',
      fontSize: 24,
      color: tokens.ink,
    },
    skipButton: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: 16,
      paddingVertical: 8,
    },
    skipButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.brandPrimary,
      ...logical(isRTL, { marginStart: 8 }),
    },
    monthGrid: {
      flexDirection: row(isRTL),
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    monthChip: {
      minWidth: '30%',
      flexGrow: 1,
      paddingVertical: 11,
      paddingHorizontal: 8,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '30' : '20'}`,
      backgroundColor: `${tokens.ink}0A`,
      alignItems: 'center',
    },
    monthChipSelected: {
      backgroundColor: tokens.brandPrimary,
      borderColor: tokens.brandPrimary,
    },
    monthChipText: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: tokens.ink,
    },
    monthChipTextSelected: {
      color: '#fff',
      fontFamily: fontFamilies.bodySemiBold,
    },
    previewBox: {
      marginTop: 18,
      padding: 12,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.brandPrimary}${isDark ? '26' : '14'}`,
    },
    previewText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
    },
    errorText: {
      marginTop: 12,
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: tokens.status.lost.main,
    },
    footer: {
      flexDirection: row(isRTL),
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    secondaryButton: {
      flex: 1,
      height: 50,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '30' : '20'}`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.ink,
    },
    primaryButton: {
      flex: 1,
      height: 50,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#fff',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
    },
  });

export default DateEntryModal;
