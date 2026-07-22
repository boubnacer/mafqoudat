/**
 * Post Filter Sheet
 * Bottom-sheet modal for browsing filters: post type, country, categories, city.
 * Selections apply immediately (parent recomposes the query); this component only
 * owns the sheet's own UI state (open/closed, per-field search text, fetched city list).
 *
 * Country/Categories/City are each a searchable dropdown field (accordion-style,
 * inline within this sheet rather than a nested Modal - the app deliberately keeps
 * only one overlay open at a time, see AppHeader/HeaderMenu) - mirrors the web
 * app's Autocomplete-driven category/city filters in
 * client/src/features/posts/PostsList/PostsList.js: a search box filters the
 * option list, categories is multi-select with removable chips, city is
 * single-select. Only one dropdown is open at a time.
 *
 * Post type (All/Lost/Found) is the first, most prominent section - it writes
 * through the same selectedFl/onSelectFl prop pair the active-filter chip and
 * HeaderMenu's Browse section use, so there's a single source of truth no
 * matter which surface changes it.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getLocalizedLabel } from '../context/ReferenceDataContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';

const ALL_OPTION_ID = '__all__';

// Accordion-style searchable dropdown: a header row showing the current value
// (or placeholder) toggles an inline search box + filtered option list. Reused
// for country (single-select), categories (multi-select) and city (single-select).
const DropdownField = ({
  label,
  placeholder,
  searchPlaceholder,
  displayValue,
  isOpen,
  onToggle,
  query,
  onQueryChange,
  options,
  isSelected,
  onSelectOption,
  getOptionLabel,
  renderOptionLeading,
  noResultsText,
  loading,
  styles,
  tokens,
  isRTL,
}) => {
  const textStyle = isRTL ? styles.textRTL : null;
  return (
    <View style={styles.dropdownField}>
      <Text style={[styles.sectionLabel, textStyle]}>{label}</Text>
      <TouchableOpacity style={styles.dropdownHeader} onPress={onToggle} activeOpacity={0.75}>
        <Text
          style={[styles.dropdownHeaderText, !displayValue && styles.dropdownPlaceholderText, textStyle]}
          numberOfLines={1}
        >
          {displayValue || placeholder}
        </Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={`${tokens.ink}80`} />
      </TouchableOpacity>

      {isOpen ? (
        <View style={styles.dropdownPanel}>
          <TextInput
            style={[styles.dropdownSearchInput, textStyle]}
            placeholder={searchPlaceholder}
            placeholderTextColor={`${tokens.ink}66`}
            value={query}
            onChangeText={onQueryChange}
            autoCapitalize="none"
            autoFocus
          />
          {loading ? (
            <ActivityIndicator size="small" color={tokens.brandPrimary} style={styles.dropdownLoader} />
          ) : (
            <ScrollView
              style={styles.dropdownList}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {options.length === 0 ? (
                <Text style={[styles.dropdownEmptyText, textStyle]}>{noResultsText}</Text>
              ) : (
                options.map((option) => {
                  const selected = isSelected(option);
                  return (
                    <TouchableOpacity
                      key={option.id ?? ALL_OPTION_ID}
                      style={[styles.dropdownOption, selected && styles.dropdownOptionSelected]}
                      onPress={() => onSelectOption(option)}
                      activeOpacity={0.75}
                    >
                      {renderOptionLeading ? renderOptionLeading(option) : null}
                      <Text
                        style={[styles.dropdownOptionText, textStyle, selected && styles.dropdownOptionTextSelected]}
                        numberOfLines={1}
                      >
                        {getOptionLabel(option)}
                      </Text>
                      {selected ? <Ionicons name="checkmark" size={16} color={tokens.brandPrimary} /> : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
};

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
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Only one dropdown open at a time - opening one closes whichever else was open.
  const [openField, setOpenField] = useState(null);
  const [countryQuery, setCountryQuery] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const styles = useMemo(() => createStyles({ tokens, isDark }), [tokens, isDark]);

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

  // Collapse every dropdown and clear its search text whenever the sheet closes,
  // so reopening it always starts from the post-type section, not mid-search.
  useEffect(() => {
    if (!visible) {
      setOpenField(null);
      setCountryQuery('');
      setCategoryQuery('');
      setCitySearch('');
    }
  }, [visible]);

  const toggleField = (field) => {
    setOpenField((prev) => (prev === field ? null : field));
  };

  const filteredCountries = countryQuery.trim()
    ? countries.filter((country) =>
        getLocalizedLabel(country, currentLanguage).toLowerCase().includes(countryQuery.trim().toLowerCase())
      )
    : countries;

  const categoryOptions = [{ id: null, label: t('all') }, ...categories.map((cat) => ({
    id: cat._id,
    label: getLocalizedLabel(cat, currentLanguage),
  }))];
  const filteredCategoryOptions = categoryQuery.trim()
    ? categoryOptions.filter(
        (option) => option.id === null || option.label.toLowerCase().includes(categoryQuery.trim().toLowerCase())
      )
    : categoryOptions;
  const selectedCategoryChips = categories.filter((cat) => selectedCategoryIds.includes(cat._id));

  const filteredCities = citySearch.trim()
    ? cities.filter((city) =>
        getLocalizedLabel(city, currentLanguage).toLowerCase().includes(citySearch.trim().toLowerCase())
      )
    : cities;
  const cityOptions = [{ id: null, label: t('allCities') }, ...filteredCities.map((city) => ({
    id: city.id || city._id,
    label: getLocalizedLabel(city, currentLanguage),
  }))];

  const selectedCountry = countries.find((c) => (c._id || c.id) === countryId);
  const selectedCountryLabel = selectedCountry ? getLocalizedLabel(selectedCountry, currentLanguage) : '';

  const categoryDisplayValue = selectedCategoryChips.length > 0
    ? selectedCategoryChips.map((cat) => getLocalizedLabel(cat, currentLanguage)).join(', ')
    : '';

  // Looked up by code (not floptions.map order) so it's always All -> Lost ->
  // Found regardless of how the backend returns them.
  const lostOption = floptions.find((fl) => fl.code === 'LOST');
  const foundOption = floptions.find((fl) => fl.code === 'FOUND');
  const postTypeOptions = [
    { id: '', label: t('all'), tone: tokens.brandPrimary },
    lostOption && { id: lostOption._id, label: getLocalizedLabel(lostOption, currentLanguage), tone: tokens.status.lost.main },
    foundOption && { id: foundOption._id, label: getLocalizedLabel(foundOption, currentLanguage), tone: tokens.status.found.main },
  ].filter(Boolean);

  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, textStyle]}>{t('filters')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Ionicons name="close" size={20} color={`${tokens.ink}CC`} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            <Text style={[styles.sectionLabel, textStyle, styles.firstSectionLabel]}>{t('postType')}</Text>
            <View style={styles.postTypeRow}>
              {postTypeOptions.map((option) => {
                const isSelected = selectedFl === option.id;
                return (
                  <TouchableOpacity
                    key={option.id || 'all'}
                    style={[
                      styles.postTypeOption,
                      { borderColor: option.tone },
                      isSelected && { backgroundColor: option.tone },
                    ]}
                    onPress={() => onSelectFl(option.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.postTypeOptionText,
                        { color: isSelected ? '#FFFFFF' : option.tone },
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <DropdownField
              label={t('country')}
              placeholder={t('selectCountry')}
              searchPlaceholder={t('searchCountry')}
              displayValue={selectedCountryLabel}
              isOpen={openField === 'country'}
              onToggle={() => toggleField('country')}
              query={countryQuery}
              onQueryChange={setCountryQuery}
              options={filteredCountries.map((c) => ({ id: c._id || c.id, label: getLocalizedLabel(c, currentLanguage), flag: c.flag }))}
              isSelected={(option) => option.id === countryId}
              onSelectOption={(option) => {
                onSelectCountry(option.id);
                setOpenField(null);
                setCountryQuery('');
              }}
              getOptionLabel={(option) => option.label}
              renderOptionLeading={(option) =>
                option.flag ? <Text style={styles.optionFlag}>{option.flag}</Text> : null
              }
              noResultsText={t('countryNoResults')}
              styles={styles}
              tokens={tokens}
              isRTL={isRTL}
            />

            <DropdownField
              label={t('categories')}
              placeholder={t('selectCategories')}
              searchPlaceholder={t('searchCategories')}
              displayValue={categoryDisplayValue}
              isOpen={openField === 'categories'}
              onToggle={() => toggleField('categories')}
              query={categoryQuery}
              onQueryChange={setCategoryQuery}
              options={filteredCategoryOptions}
              isSelected={(option) => (option.id === null ? selectedCategoryIds.length === 0 : selectedCategoryIds.includes(option.id))}
              onSelectOption={(option) => {
                if (option.id === null) {
                  onClearCategories();
                } else {
                  onToggleCategory(option.id);
                }
              }}
              getOptionLabel={(option) => option.label}
              noResultsText={t('noSearchResults')}
              styles={styles}
              tokens={tokens}
              isRTL={isRTL}
            />
            {selectedCategoryChips.length > 0 ? (
              <View style={styles.chipsRow}>
                {selectedCategoryChips.map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={styles.selectedChip}
                    onPress={() => onToggleCategory(cat._id)}
                  >
                    <Text style={styles.selectedChipText}>{getLocalizedLabel(cat, currentLanguage)}</Text>
                    <Ionicons name="close" size={13} color={tokens.brandPrimary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <DropdownField
              label={t('city')}
              placeholder={t('allCities')}
              searchPlaceholder={t('searchCity')}
              displayValue={selectedCityId ? selectedCityLabelFor(cities, selectedCityId, currentLanguage) : ''}
              isOpen={openField === 'city'}
              onToggle={() => toggleField('city')}
              query={citySearch}
              onQueryChange={setCitySearch}
              options={cityOptions}
              isSelected={(option) => (option.id === null ? !selectedCityId : selectedCityId === option.id)}
              onSelectOption={(option) => {
                if (option.id === null) {
                  onSelectCity(null);
                } else {
                  onSelectCity({ id: option.id, label: option.label });
                }
                setOpenField(null);
                setCitySearch('');
              }}
              getOptionLabel={(option) => option.label}
              noResultsText={t('noSearchResults')}
              loading={citiesLoading}
              styles={styles}
              tokens={tokens}
              isRTL={isRTL}
            />
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

// selectedCityLabel is tracked by the parent (PostsListScreen) from the moment
// of selection, but that value can go stale after a country switch clears the
// fetched city list - falling back to a fresh lookup here keeps the header in
// sync with whatever `cities` currently holds.
const selectedCityLabelFor = (cities, selectedCityId, currentLanguage) => {
  const match = cities.find((city) => (city.id || city._id) === selectedCityId);
  return match ? getLocalizedLabel(match, currentLanguage) : '';
};

const createStyles = ({ tokens, isDark }) =>
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
      backgroundColor: tokens.surfaceRaised,
      borderTopLeftRadius: radiusTokens.xl,
      borderTopRightRadius: radiusTokens.xl,
      maxHeight: '85%',
      paddingBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    headerTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 19,
      color: tokens.ink,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0A`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    body: {
      paddingHorizontal: 20,
    },
    sectionLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: `${tokens.ink}99`,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 22,
      marginBottom: 8,
    },
    firstSectionLabel: {
      marginTop: 16,
    },
    postTypeRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 4,
    },
    postTypeOption: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radiusTokens.lg,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    postTypeOptionText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
    },
    textRTL: {
      textAlign: 'right',
    },

    // Dropdown field (accordion)
    dropdownField: {
      marginBottom: 4,
    },
    dropdownHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 46,
      paddingHorizontal: 14,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.surfaceBase,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    dropdownHeaderText: {
      flex: 1,
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 14,
      color: tokens.ink,
    },
    dropdownPlaceholderText: {
      color: `${tokens.ink}80`,
      fontFamily: fontFamilies.body,
    },
    dropdownPanel: {
      marginTop: 8,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      backgroundColor: tokens.surfaceBase,
      overflow: 'hidden',
    },
    dropdownSearchInput: {
      height: 42,
      paddingHorizontal: 12,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: tokens.ink,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    dropdownLoader: {
      paddingVertical: 20,
    },
    dropdownList: {
      maxHeight: 220,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '14' : '0D'}`,
    },
    dropdownOptionSelected: {
      backgroundColor: `${tokens.brandPrimary}14`,
    },
    dropdownOptionText: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: tokens.ink,
    },
    dropdownOptionTextSelected: {
      fontFamily: fontFamilies.bodySemiBold,
      color: tokens.brandPrimary,
    },
    dropdownEmptyText: {
      textAlign: 'center',
      paddingVertical: 20,
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}80`,
    },
    optionFlag: {
      fontSize: 16,
    },

    // Selected category chips (mirrors web's Autocomplete renderTags)
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    selectedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radiusTokens.xl,
      backgroundColor: `${tokens.brandPrimary}1F`,
    },
    selectedChipText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 12,
      color: tokens.brandPrimary,
    },

    footer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    clearButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: tokens.brandPrimary,
      alignItems: 'center',
      marginEnd: 10,
    },
    clearButtonText: {
      color: tokens.brandPrimary,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
    },
    doneButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      alignItems: 'center',
    },
    doneButtonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
    },
  });

export default PostFilterSheet;
