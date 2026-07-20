/**
 * Post Filter Sheet
 * Bottom-sheet modal for browsing filters: post type, country, categories, city.
 * Selections apply immediately (parent recomposes the query); this component only
 * owns the sheet's own UI state (open/closed, city search text, fetched city list).
 *
 * Post type (All/Lost/Found) is the first, most prominent section - it writes
 * through the same selectedFl/onSelectFl prop pair the active-filter chip and
 * HeaderMenu's Browse section use, so there's a single source of truth no
 * matter which surface changes it.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getLocalizedLabel } from '../context/ReferenceDataContext';

const PostFilterSheet = ({
  visible,
  onClose,
  t,
  currentLanguage,
  isRTL,
  floptions,
  categories,
  countries,
  getCities,
  countryId,
  onSelectCountry,
  selectedFl,
  onSelectFl,
  selectedCategoryIds,
  onToggleCategory,
  onClearCategories,
  selectedCityId,
  onSelectCity,
  onClearAll,
}) => {
  const { colors, spacing, radii, fontSizes } = useTheme();
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const styles = useMemo(() => createStyles({ colors, spacing, radii, fontSizes }), [colors, spacing, radii, fontSizes]);

  useEffect(() => {
    if (!visible || !countryId) return;
    let isMounted = true;
    setCitiesLoading(true);
    getCities(countryId).then((result) => {
      if (isMounted) {
        setCities(result);
        setCitiesLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, countryId]);

  const filteredCities = citySearch.trim()
    ? cities.filter((city) =>
        getLocalizedLabel(city, currentLanguage).toLowerCase().includes(citySearch.trim().toLowerCase())
      )
    : cities;

  // Looked up by code (not floptions.map order) so it's always All -> Lost ->
  // Found regardless of how the backend returns them.
  const lostOption = floptions.find((fl) => fl.code === 'LOST');
  const foundOption = floptions.find((fl) => fl.code === 'FOUND');
  const postTypeOptions = [
    { id: '', label: t('all'), color: colors.primary },
    lostOption && { id: lostOption._id, label: getLocalizedLabel(lostOption, currentLanguage), color: lostOption.color },
    foundOption && { id: foundOption._id, label: getLocalizedLabel(foundOption, currentLanguage), color: foundOption.color },
  ].filter(Boolean);

  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, textStyle]}>{t('filters')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={[styles.sectionLabel, textStyle, styles.firstSectionLabel]}>{t('postType')}</Text>
            <View style={styles.postTypeRow}>
              {postTypeOptions.map((option) => {
                const isSelected = selectedFl === option.id;
                return (
                  <TouchableOpacity
                    key={option.id || 'all'}
                    style={[
                      styles.postTypeOption,
                      { borderColor: option.color },
                      isSelected && { backgroundColor: option.color },
                    ]}
                    onPress={() => onSelectFl(option.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.postTypeOptionText,
                        { color: isSelected ? colors.primaryText : option.color },
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, textStyle]}>{t('country')}</Text>
            <View style={styles.chipsRow}>
              {countries.map((country) => {
                const id = country._id || country.id;
                const isSelected = id === countryId;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => onSelectCountry(id)}
                  >
                    {country.flag ? <Text style={styles.chipFlag}>{country.flag}</Text> : null}
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {getLocalizedLabel(country, currentLanguage)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, textStyle]}>{t('categories')}</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, selectedCategoryIds.length === 0 && styles.chipSelected]}
                onPress={onClearCategories}
              >
                <Text style={[styles.chipText, selectedCategoryIds.length === 0 && styles.chipTextSelected]}>
                  {t('all')}
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat._id);
                return (
                  <TouchableOpacity
                    key={cat._id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => onToggleCategory(cat._id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {getLocalizedLabel(cat, currentLanguage)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, textStyle]}>{t('city')}</Text>
            <TextInput
              style={[styles.searchInput, textStyle]}
              placeholder={t('searchCity')}
              placeholderTextColor={colors.placeholder}
              value={citySearch}
              onChangeText={setCitySearch}
              autoCapitalize="none"
            />
            {citiesLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.cityLoader} />
            ) : (
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, !selectedCityId && styles.chipSelected]}
                  onPress={() => onSelectCity(null)}
                >
                  <Text style={[styles.chipText, !selectedCityId && styles.chipTextSelected]}>
                    {t('allCities')}
                  </Text>
                </TouchableOpacity>
                {filteredCities.map((city) => {
                  const id = city.id || city._id;
                  const isSelected = selectedCityId === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => onSelectCity({ id, label: getLocalizedLabel(city, currentLanguage) })}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {getLocalizedLabel(city, currentLanguage)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
              <Text style={styles.clearButtonText}>{t('clearFilters')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = ({ colors, spacing, radii, fontSizes }) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      maxHeight: '85%',
      paddingBottom: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: fontSizes.lg,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.xs,
    },
    closeButtonText: {
      fontSize: fontSizes.lg,
      color: colors.textSecondary,
    },
    body: {
      paddingHorizontal: spacing.lg,
    },
    sectionLabel: {
      fontSize: fontSizes.xs,
      fontWeight: 'bold',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    firstSectionLabel: {
      marginTop: spacing.md,
    },
    postTypeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    postTypeOption: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    postTypeOptionText: {
      fontSize: fontSizes.sm,
      fontWeight: '700',
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.xl,
      backgroundColor: colors.inputBackground,
      marginEnd: spacing.sm,
      marginBottom: spacing.sm,
    },
    chipSelected: {
      backgroundColor: colors.primary,
    },
    chipFlag: {
      marginEnd: spacing.xs,
      fontSize: fontSizes.sm,
    },
    chipText: {
      fontSize: fontSizes.sm,
      color: colors.textPrimary,
    },
    chipTextSelected: {
      color: colors.primaryText,
      fontWeight: '600',
    },
    searchInput: {
      height: 44,
      backgroundColor: colors.inputBackground,
      borderRadius: radii.md,
      paddingHorizontal: spacing.lg,
      fontSize: fontSizes.sm,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    cityLoader: {
      marginVertical: spacing.md,
    },
    textRTL: {
      textAlign: 'right',
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    clearButton: {
      flex: 1,
      paddingVertical: spacing.md + 2,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      marginEnd: spacing.sm,
    },
    clearButtonText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: fontSizes.sm,
    },
    doneButton: {
      flex: 1,
      paddingVertical: spacing.md + 2,
      borderRadius: radii.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    doneButtonText: {
      color: colors.primaryText,
      fontWeight: 'bold',
      fontSize: fontSizes.sm,
    },
  });

export default PostFilterSheet;
