/**
 * Post Filter Sheet
 * Bottom-sheet modal for browsing filters: post type, country, categories, city.
 * Selections apply immediately (parent recomposes the query); this component only
 * owns the sheet's own UI state (open/closed, per-field search text, fetched city list).
 *
 * Country/Categories/City are each a dropdown field (accordion-style, inline
 * within this sheet rather than a nested Modal - the app deliberately keeps
 * only one overlay open at a time, see AppHeader/HeaderMenu) - mirrors the web
 * app's Autocomplete-driven category/city filters in
 * client/src/features/posts/PostsList/PostsList.js: categories is multi-select
 * with removable chips, city is single-select. Only one dropdown is open at a
 * time.
 *
 * Country and City carry a search box (their lists are long); Categories does
 * not - it is a plain checkbox list, since the set is short enough to scan and
 * a search box there only cost the user the soft keyboard over the options.
 *
 * Keyboard: the search inputs do NOT autofocus, so opening a dropdown always
 * shows its options first and the keyboard appears only when the user taps the
 * search box. When it does open, the same three-part treatment PostForm uses
 * (keyboardHeight padding + per-field offsets + scroll-into-view) keeps the
 * open dropdown above it - Android under edge-to-edge never resizes the window
 * for the keyboard, so without this the option list sits behind it.
 *
 * Post type (All/Lost/Found) is the first, most prominent section - it writes
 * through the same selectedFl/onSelectFl prop pair the active-filter chip and
 * HeaderMenu's Browse section use, so there's a single source of truth no
 * matter which surface changes it.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getLocalizedLabel } from '../context/ReferenceDataContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { logical, row, needsDirectionFlip } from '../utils/rtl';

const ALL_OPTION_ID = '__all__';

// Breathing room left above a dropdown scrolled into view, so its section label
// stays visible rather than sitting flush against the sheet header.
const FIELD_SCROLL_MARGIN = 12;

// Mirrors PostsListScreen's getElevation (client's designTokens.js elevationTokens
// as RN shadow/elevation props) so the sheet and its raised controls read as the
// same depth language as the rest of the app.
const getElevation = (isDark, level = 1) =>
  level === 2
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.5 : 0.14,
        shadowRadius: 24,
        elevation: 8,
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.4 : 0.08,
        shadowRadius: 6,
        elevation: 3,
      };

// Accordion-style dropdown: a header row showing the current value (or
// placeholder) toggles an inline option list, optionally preceded by a search
// box. Reused for country (single-select + search), categories (multi-select,
// checkbox rows, no search) and city (single-select + search).
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
  searchable = true,
  multiSelect = false,
  compactList = false,
  onLayout,
  onSearchFocus,
  styles,
  tokens,
  isRTL,
}) => {
  const textStyle = isRTL ? styles.textRTL : null;
  return (
    <View style={styles.dropdownField} onLayout={onLayout}>
      <Text style={[styles.sectionLabel, textStyle]}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownHeader, isOpen && styles.dropdownHeaderActive]}
        onPress={onToggle}
        activeOpacity={0.75}
      >
        <Text
          style={[styles.dropdownHeaderText, !displayValue && styles.dropdownPlaceholderText, textStyle]}
          numberOfLines={1}
        >
          {displayValue || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={isOpen ? tokens.brandPrimary : `${tokens.ink}80`}
        />
      </TouchableOpacity>

      {isOpen ? (
        <View style={styles.dropdownPanel}>
          {searchable ? (
            <View style={styles.dropdownSearchRow}>
              <Ionicons name="search-outline" size={16} color={`${tokens.ink}80`} style={styles.dropdownSearchIcon} />
              {/* Deliberately not autoFocus: the keyboard would cover the very
                  options the user opened the dropdown to read. */}
              <TextInput
                style={[styles.dropdownSearchInput, textStyle]}
                placeholder={searchPlaceholder}
                placeholderTextColor={`${tokens.ink}66`}
                value={query}
                onChangeText={onQueryChange}
                onFocus={onSearchFocus}
                autoCapitalize="none"
              />
            </View>
          ) : null}
          {loading ? (
            <ActivityIndicator size="small" color={tokens.brandPrimary} style={styles.dropdownLoader} />
          ) : (
            <ScrollView
              style={[styles.dropdownList, compactList && styles.dropdownListCompact]}
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
                      {multiSelect ? (
                        // Same checkbox as SelectModal's multi-select rows, so a
                        // tickable list reads the same wherever it appears.
                        <View style={[styles.optionCheckbox, selected && styles.optionCheckboxChecked]}>
                          {selected ? <Ionicons name="checkmark" size={13} color={tokens.surfaceRaised} /> : null}
                        </View>
                      ) : selected ? (
                        <Ionicons name="checkmark" size={16} color={tokens.brandPrimary} />
                      ) : null}
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
  const [citySearch, setCitySearch] = useState('');

  // Keyboard handling, same three-part treatment as PostForm (see the note
  // there): pad the scroll content by the keyboard height so scrollTo isn't
  // clamped short, record each field's offset on layout, and scroll the open
  // field to the top of the body whenever it opens or its search box focuses.
  const bodyRef = useRef(null);
  const fieldOffsets = useRef({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const styles = useMemo(() => createStyles({ tokens, isDark, isRTL }), [tokens, isDark, isRTL]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollFieldIntoView = (field) => {
    const y = fieldOffsets.current[field];
    if (y == null) return;
    bodyRef.current?.scrollTo({ y: Math.max(y - FIELD_SCROLL_MARGIN, 0), animated: true });
  };

  // Re-runs once the keyboard padding has been committed and the sheet has
  // finished shrinking, so the offset isn't clamped by a stale content height.
  useEffect(() => {
    if (keyboardHeight === 0 || !openField) return undefined;
    const timer = setTimeout(() => scrollFieldIntoView(openField), 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardHeight, openField]);

  const handleFieldLayout = (field) => (event) => {
    fieldOffsets.current[field] = event.nativeEvent.layout.y;
  };

  // Dismiss explicitly rather than relying on the Modal unmount to blur the
  // focused search box - on Android the keyboard otherwise stays up over the
  // posts list the sheet just closed onto.
  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

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
      setCitySearch('');
    }
  }, [visible]);

  const toggleField = (field) => {
    const next = openField === field ? null : field;
    setOpenField(next);
    // Moving between fields leaves the previous field's search box focused
    // otherwise, so the keyboard would stay up over the newly opened list.
    Keyboard.dismiss();
    if (next) {
      // After the panel has rendered, so the content is tall enough to scroll to.
      setTimeout(() => scrollFieldIntoView(next), 60);
    }
  };

  const filteredCountries = countryQuery.trim()
    ? countries.filter((country) =>
        getLocalizedLabel(country, currentLanguage).toLowerCase().includes(countryQuery.trim().toLowerCase())
      )
    : countries;

  // No search box on categories: the list is short enough to scan, and the
  // keyboard it raised covered the options themselves.
  const categoryOptions = [{ id: null, label: t('all') }, ...categories.map((cat) => ({
    id: cat._id,
    label: getLocalizedLabel(cat, currentLanguage),
  }))];
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
    { id: '', label: t('all'), tone: tokens.brandPrimary, icon: 'apps-outline' },
    lostOption && {
      id: lostOption._id,
      label: getLocalizedLabel(lostOption, currentLanguage),
      tone: tokens.status.lost.main,
      icon: 'search-outline',
    },
    foundOption && {
      id: foundOption._id,
      label: getLocalizedLabel(foundOption, currentLanguage),
      tone: tokens.status.found.main,
      icon: 'checkmark-circle-outline',
    },
  ].filter(Boolean);

  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior="padding"
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.grabHandle} />
          <View style={styles.header}>
            <Text style={[styles.headerTitle, textStyle]}>{t('filters')}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('close')}>
              <Ionicons name="close" size={20} color={`${tokens.ink}CC`} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={bodyRef}
            style={styles.body}
            contentContainerStyle={[styles.bodyContent, keyboardHeight > 0 && { paddingBottom: keyboardHeight }]}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
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
                      isSelected && { backgroundColor: option.tone, ...getElevation(isDark, 1) },
                    ]}
                    onPress={() => onSelectFl(option.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={option.icon}
                      size={16}
                      color={isSelected ? '#FFFFFF' : option.tone}
                      style={styles.postTypeOptionIcon}
                    />
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
                Keyboard.dismiss();
              }}
              getOptionLabel={(option) => option.label}
              renderOptionLeading={(option) =>
                option.flag ? <Text style={styles.optionFlag}>{option.flag}</Text> : null
              }
              noResultsText={t('countryNoResults')}
              compactList={keyboardHeight > 0}
              onLayout={handleFieldLayout('country')}
              onSearchFocus={() => scrollFieldIntoView('country')}
              styles={styles}
              tokens={tokens}
              isRTL={isRTL}
            />

            <DropdownField
              label={t('categories')}
              placeholder={t('selectCategories')}
              displayValue={categoryDisplayValue}
              isOpen={openField === 'categories'}
              onToggle={() => toggleField('categories')}
              options={categoryOptions}
              searchable={false}
              multiSelect
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
              onLayout={handleFieldLayout('categories')}
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
                Keyboard.dismiss();
              }}
              getOptionLabel={(option) => option.label}
              noResultsText={t('noSearchResults')}
              loading={citiesLoading}
              compactList={keyboardHeight > 0}
              onLayout={handleFieldLayout('city')}
              onSearchFocus={() => scrollFieldIntoView('city')}
              styles={styles}
              tokens={tokens}
              isRTL={isRTL}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={onClearAll} activeOpacity={0.75}>
              <Text style={styles.clearButtonText}>{t('clearFilters')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={handleClose} activeOpacity={0.85}>
              <Text style={styles.doneButtonText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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

const createStyles = ({ tokens, isDark, isRTL }) =>
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
      ...getElevation(isDark, 2),
    },
    grabHandle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      marginTop: 10,
      backgroundColor: `${tokens.ink}26`,
    },
    // Direction-dependent styles go through the helpers in utils/rtl.js
    // (row()/logical()), which compensate only when the language's direction
    // differs from the one native is already mirroring - see that file. Do NOT
    // write `isRTL ? 'row-reverse' : 'row'` here: that flips unconditionally and
    // cancels out native mirroring once forceRTL has taken effect on relaunch.
    header: {
      flexDirection: row(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 18,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    headerTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 20,
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
    bodyContent: {
      paddingBottom: 8,
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
      flexDirection: row(isRTL),
      paddingVertical: 12,
      borderRadius: radiusTokens.xl,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    postTypeOptionIcon: {
      ...logical(isRTL, { marginEnd: 6 }),
    },
    postTypeOptionText: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },

    // Dropdown field (accordion)
    dropdownField: {
      marginBottom: 4,
    },
    dropdownHeader: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 48,
      paddingHorizontal: 14,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.surfaceBase,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      ...getElevation(isDark, 1),
    },
    dropdownHeaderActive: {
      borderColor: tokens.brandPrimary,
      borderWidth: 1.5,
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
    dropdownSearchRow: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    dropdownSearchIcon: {
      ...logical(isRTL, { marginEnd: 8 }),
    },
    dropdownSearchInput: {
      flex: 1,
      height: 42,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      color: tokens.ink,
    },
    dropdownLoader: {
      paddingVertical: 20,
    },
    dropdownList: {
      maxHeight: 220,
    },
    // With the keyboard up the sheet has far less room, and a list taller than
    // that room can't be scrolled past from inside itself (it's a nested
    // ScrollView) - shortening it keeps the whole list reachable.
    dropdownListCompact: {
      maxHeight: 160,
    },
    dropdownOption: {
      flexDirection: row(isRTL),
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
    optionCheckbox: {
      width: 20,
      height: 20,
      borderRadius: radiusTokens.sm / 1.5,
      borderWidth: 1.5,
      borderColor: `${tokens.ink}40`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionCheckboxChecked: {
      backgroundColor: tokens.brandPrimary,
      borderColor: tokens.brandPrimary,
    },

    // Selected category chips (mirrors web's Autocomplete renderTags)
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    selectedChip: {
      flexDirection: row(isRTL),
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
      borderRadius: radiusTokens.xl,
      borderWidth: 1.5,
      borderColor: tokens.brandPrimary,
      alignItems: 'center',
      ...logical(isRTL, { marginEnd: 10 }),
    },
    clearButtonText: {
      color: tokens.brandPrimary,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
    },
    doneButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radiusTokens.xl,
      backgroundColor: tokens.brandPrimary,
      alignItems: 'center',
      ...getElevation(isDark, 1),
    },
    doneButtonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
    },
  });

export default PostFilterSheet;
