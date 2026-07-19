/**
 * Post Filter Sheet
 * Bottom-sheet modal for browsing filters: country, lost/found, categories, city.
 * Selections apply immediately (parent recomposes the query); this component only
 * owns the sheet's own UI state (open/closed, city search text, fetched city list).
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
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
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');

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

  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('filters')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
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

            <Text style={[styles.sectionLabel, textStyle]}>{t('postType')}</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, selectedFl === '' && styles.chipSelected]}
                onPress={() => onSelectFl('')}
              >
                <Text style={[styles.chipText, selectedFl === '' && styles.chipTextSelected]}>{t('all')}</Text>
              </TouchableOpacity>
              {floptions.map((fl) => {
                const isSelected = selectedFl === fl._id;
                return (
                  <TouchableOpacity
                    key={fl._id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => onSelectFl(fl._id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {getLocalizedLabel(fl, currentLanguage)}
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
              placeholderTextColor="#999"
              value={citySearch}
              onChangeText={setCitySearch}
              autoCapitalize="none"
            />
            {citiesLoading ? (
              <ActivityIndicator size="small" color="#2196F3" style={styles.cityLoader} />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  body: {
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#2196F3',
  },
  chipFlag: {
    marginRight: 4,
    fontSize: 14,
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  searchInput: {
    height: 44,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  cityLoader: {
    marginVertical: 12,
  },
  textRTL: {
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
    marginRight: 8,
  },
  clearButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 15,
  },
  doneButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default PostFilterSheet;
