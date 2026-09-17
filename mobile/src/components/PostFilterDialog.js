/**
 * Post Filter Dialog
 * Mirrors the mobile/tablet filter panel in
 * client/src/features/posts/PostsList/PostsList.js: a centered "SaaS panel"
 * card (brand-tinted border/glow, gradient header icon) rather than a
 * sliding bottom sheet, holding Type/Category/City only - country lives in
 * AppHeader's own picker on this screen, exactly as on web the country
 * selector is outside this panel.
 *
 * Same staged-draft logic as web: opening the dialog seeds its own draft
 * state from whatever is currently applied, every field inside edits that
 * draft, and nothing reaches the posts query until Apply is pressed. Reset
 * only clears the draft; Cancel/backdrop/close discard it untouched.
 *
 * Country and City each carried a search box on the old bottom sheet;
 * Category was a plain checkbox list (no search - the set is short enough to
 * scan and a search box only cost the user the keyboard over the options).
 * Category and City keep that shape here. Country's accordion + search
 * plumbing was dropped along with the field itself.
 *
 * Keyboard: search inputs do NOT autofocus, so opening a dropdown always
 * shows its options first. When the keyboard does appear, the same
 * three-part treatment PostForm uses (keyboard-height padding + per-field
 * offsets + scroll-into-view) keeps the open dropdown above it.
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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { getLocalizedLabel } from '../context/ReferenceDataContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';
import { logical, row, needsDirectionFlip } from '../utils/rtl';

// Breathing room left above a dropdown scrolled into view, so its section
// label stays visible rather than sitting flush against the dialog header.
const FIELD_SCROLL_MARGIN = 12;

/** Mixes a hex color toward white - RN has no equivalent of MUI's lighten(),
 * which the web panel uses for its gradient/glow accents. */
const lighten = (hex, amount) => {
  const value = hex.replace('#', '');
  const channel = (index) => {
    const start = parseInt(value.slice(index * 2, index * 2 + 2), 16);
    return Math.round(start + (255 - start) * amount)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(1)}${channel(2)}`;
};

// Mirrors PostsListScreen's own getElevation (client's designTokens.js
// elevationTokens as RN shadow/elevation props).
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
// placeholder) toggles an inline option list, optionally preceded by a
// search box. Reused for post type (single-select, no search, a tone-colored
// leading icon per row - mirrors web's TypePickerField), categories
// (multi-select, checkbox rows, no search) and city (single-select + search).
const DropdownField = ({
  label,
  firstField = false,
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
      <Text style={[styles.sectionLabel, firstField && styles.firstSectionLabel, textStyle]}>{label}</Text>
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
                      key={option.id ?? 'all'}
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

const cityLabelFor = (cities, cityId, currentLanguage) => {
  const match = cities.find((city) => (city.id || city._id) === cityId);
  return match ? getLocalizedLabel(match, currentLanguage) : '';
};

const PostFilterDialog = ({
  visible,
  onClose,
  onApply,
  t,
  currentLanguage,
  isRTL,
  floptions,
  categories,
  getCities,
  countryId,
  appliedSelectedFl,
  appliedSelectedCategoryIds,
  appliedSelectedCityId,
  appliedSelectedCityLabel,
}) => {
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const brand = tokens.brandPrimary;
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Draft state - seeded from the applied filters whenever the dialog opens,
  // and never written back until Apply is pressed.
  const [draftFl, setDraftFl] = useState('');
  const [draftCategoryIds, setDraftCategoryIds] = useState([]);
  const [draftCityId, setDraftCityId] = useState(null);
  const [citySearchTerm, setCitySearchTerm] = useState('');

  // Only one dropdown open at a time - opening one closes whichever else was open.
  const [openField, setOpenField] = useState(null);

  const bodyRef = useRef(null);
  const fieldOffsets = useRef({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const styles = useMemo(() => createStyles({ tokens, isDark, isRTL }), [tokens, isDark, isRTL]);

  // Seed the draft from whatever is currently applied every time the dialog
  // opens - same as web's handleOpenFilterDialog.
  useEffect(() => {
    if (!visible) return;
    setDraftFl(appliedSelectedFl || '');
    setDraftCategoryIds(appliedSelectedCategoryIds || []);
    setDraftCityId(appliedSelectedCityId || null);
    setCitySearchTerm(appliedSelectedCityLabel || '');
    setOpenField(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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

  useEffect(() => {
    if (keyboardHeight === 0 || !openField) return undefined;
    const timer = setTimeout(() => scrollFieldIntoView(openField), 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardHeight, openField]);

  const handleFieldLayout = (field) => (event) => {
    fieldOffsets.current[field] = event.nativeEvent.layout.y;
  };

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

  const toggleField = (field) => {
    const next = openField === field ? null : field;
    setOpenField(next);
    Keyboard.dismiss();
    if (next) {
      setTimeout(() => scrollFieldIntoView(next), 60);
    }
  };

  const handleToggleDraftCategory = (id) => {
    setDraftCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleSelectDraftCity = (city) => {
    if (city) {
      setDraftCityId(city.id);
      setCitySearchTerm(city.label);
    } else {
      setDraftCityId(null);
      setCitySearchTerm('');
    }
  };

  const handleReset = () => {
    setDraftFl('');
    setDraftCategoryIds([]);
    setDraftCityId(null);
    setCitySearchTerm('');
  };

  const handleApply = () => {
    Keyboard.dismiss();
    const cityLabel = draftCityId ? cityLabelFor(cities, draftCityId, currentLanguage) || citySearchTerm : '';
    onApply({ fl: draftFl, categoryIds: draftCategoryIds, cityId: draftCityId, cityLabel });
  };

  const hasDraftFilters = Boolean(draftFl || draftCategoryIds.length > 0 || draftCityId);

  // No search box on categories: the list is short enough to scan, and the
  // keyboard it raised covered the options themselves.
  const categoryOptions = [{ id: null, label: t('all') }, ...categories.map((cat) => ({
    id: cat._id,
    label: getLocalizedLabel(cat, currentLanguage),
  }))];
  const selectedCategoryChips = categories.filter((cat) => draftCategoryIds.includes(cat._id));
  const categoryDisplayValue = selectedCategoryChips.length > 0
    ? selectedCategoryChips.map((cat) => getLocalizedLabel(cat, currentLanguage)).join(', ')
    : '';

  const filteredCities = citySearchTerm.trim() && draftCityId == null
    ? cities.filter((city) =>
        getLocalizedLabel(city, currentLanguage).toLowerCase().includes(citySearchTerm.trim().toLowerCase())
      )
    : cities;
  const cityOptions = [{ id: null, label: t('allCities') }, ...filteredCities.map((city) => ({
    id: city.id || city._id,
    label: getLocalizedLabel(city, currentLanguage),
  }))];

  // Looked up by code (not floptions.map order) so it's always All -> Lost ->
  // Found regardless of how the backend returns them - same as web's typeOptions.
  const lostOption = floptions.find((fl) => fl.code === 'LOST');
  const foundOption = floptions.find((fl) => fl.code === 'FOUND');
  const postTypeOptions = [
    { id: '', label: t('all'), tone: brand, icon: 'apps-outline' },
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
  const selectedTypeOption = postTypeOptions.find((option) => option.id === draftFl) || postTypeOptions[0];

  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={[brand, lighten(brand, 0.45)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIcon}
              >
                <Ionicons name="options" size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.headerTitle, textStyle]}>{t('filters')}</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('close')}
            >
              <Ionicons name="close" size={18} color={`${tokens.ink}CC`} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={bodyRef}
            style={styles.body}
            contentContainerStyle={[styles.bodyContent, keyboardHeight > 0 && { paddingBottom: keyboardHeight }]}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <DropdownField
              label={t('postType')}
              firstField
              placeholder={t('all')}
              displayValue={selectedTypeOption.label}
              isOpen={openField === 'postType'}
              onToggle={() => toggleField('postType')}
              options={postTypeOptions}
              searchable={false}
              isSelected={(option) => option.id === draftFl}
              onSelectOption={(option) => {
                setDraftFl(option.id);
                setOpenField(null);
              }}
              getOptionLabel={(option) => option.label}
              renderOptionLeading={(option) => <Ionicons name={option.icon} size={16} color={option.tone} />}
              noResultsText={t('noSearchResults')}
              onLayout={handleFieldLayout('postType')}
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
              isSelected={(option) => (option.id === null ? draftCategoryIds.length === 0 : draftCategoryIds.includes(option.id))}
              onSelectOption={(option) => {
                if (option.id === null) {
                  setDraftCategoryIds([]);
                } else {
                  handleToggleDraftCategory(option.id);
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
                    onPress={() => handleToggleDraftCategory(cat._id)}
                  >
                    <Text style={styles.selectedChipText}>{getLocalizedLabel(cat, currentLanguage)}</Text>
                    <Ionicons name="close" size={13} color={brand} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <DropdownField
              label={t('city')}
              placeholder={t('allCities')}
              searchPlaceholder={t('searchCity')}
              displayValue={draftCityId ? cityLabelFor(cities, draftCityId, currentLanguage) : ''}
              isOpen={openField === 'city'}
              onToggle={() => toggleField('city')}
              query={citySearchTerm}
              onQueryChange={setCitySearchTerm}
              options={cityOptions}
              isSelected={(option) => (option.id === null ? !draftCityId : draftCityId === option.id)}
              onSelectOption={(option) => {
                handleSelectDraftCity(option.id === null ? null : { id: option.id, label: option.label });
                setOpenField(null);
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
            <TouchableOpacity
              style={[styles.resetButton, !hasDraftFilters && styles.resetButtonDisabled]}
              onPress={handleReset}
              disabled={!hasDraftFilters}
              activeOpacity={0.75}
            >
              <Text style={styles.resetButtonText}>{t('clearFilters')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButtonWrap} onPress={handleApply} activeOpacity={0.85}>
              <LinearGradient
                colors={[brand, lighten(brand, 0.15)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.applyButton}
              >
                <Text style={styles.applyButtonText}>{t('applyFilters')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = ({ tokens, isDark, isRTL }) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)',
    },
    // The "SaaS panel" card - surfaceRaised + a brand-tinted border, mirroring
    // web's glowing Dialog PaperProps (a true CSS radial-gradient glow has no
    // RN equivalent, so the border + shadow alone carry the brand accent).
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '85%',
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.xl,
      borderWidth: 1,
      borderColor: `${tokens.brandPrimary}${isDark ? '59' : '24'}`,
      overflow: 'hidden',
      ...getElevation(isDark, 2),
    },
    header: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 14,
    },
    headerLeft: {
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 10,
      flexShrink: 1,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: radiusTokens.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 18,
      color: tokens.ink,
      flexShrink: 1,
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
      marginTop: 20,
      marginBottom: 8,
    },
    firstSectionLabel: {
      marginTop: 4,
    },
    textRTL: {
      textAlign: needsDirectionFlip(isRTL) ? 'right' : 'left',
      writingDirection: 'rtl',
    },

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
      maxHeight: 200,
    },
    dropdownListCompact: {
      maxHeight: 140,
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
      flexDirection: row(isRTL),
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    resetButton: {
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: tokens.brandPrimary,
      alignItems: 'center',
    },
    resetButtonDisabled: {
      opacity: 0.4,
    },
    resetButtonText: {
      color: tokens.brandPrimary,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
    },
    applyButtonWrap: {
      flex: 1,
      borderRadius: radiusTokens.md,
      overflow: 'hidden',
      ...getElevation(isDark, 1),
    },
    applyButton: {
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
    },
  });

export default PostFilterDialog;
