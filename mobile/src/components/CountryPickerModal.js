/**
 * Country Picker Modal
 * Bottom-sheet country picker for SignUpScreen. Mirrors CityPickerModal's
 * structure/interaction, and CountrySelectionScreen/WelcomeScreen's GET
 * /countries fetch + response-shape parsing (SignUpScreen lives in the
 * unauthenticated stack, so ReferenceDataProvider - authenticated-stack only -
 * isn't available; this fetches independently, same as those two screens do).
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../api/apiService';
import { useTheme } from '../context/ThemeContext';
import { getLocalizedLabel } from '../context/ReferenceDataContext';

const CountryPickerModal = ({ visible, onClose, onSelect, selectedCountryId, t, currentLanguage, isRTL }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;

  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) {
      setQuery('');
      return;
    }

    let isMounted = true;
    const loadCountries = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const response = await apiClient.get('/countries', {
          params: { language: currentLanguage || 'en', active: true },
        });

        let countriesList = [];
        if (response.data?.ids && response.data?.entities) {
          countriesList = response.data.ids.map((id) => response.data.entities[id]);
        } else if (Array.isArray(response.data)) {
          countriesList = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          countriesList = response.data.data;
        }

        if (isMounted) setCountries(countriesList);
      } catch (error) {
        console.error('Error loading countries:', error);
        if (isMounted) setLoadError(t('errorLoadingCountries'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCountries();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, currentLanguage]);

  const filteredCountries = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return countries;
    return countries.filter((country) =>
      getLocalizedLabel(country, currentLanguage).toLowerCase().includes(trimmed)
    );
  }, [countries, query, currentLanguage]);

  const handleSelect = (country) => {
    const id = country._id || country.id;
    onSelect({ id, label: getLocalizedLabel(country, currentLanguage), flag: country.flag || '' });
  };

  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, textStyle]}>{t('selectCountry')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.searchInput, textStyle]}
            placeholder={t('searchCountry')}
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />

          {isLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loaderText, textStyle]}>{t('loadingCountries')}</Text>
            </View>
          ) : loadError ? (
            <Text style={[styles.emptyText, textStyle]}>{loadError}</Text>
          ) : (
            <FlatList
              data={filteredCountries}
              keyExtractor={(item, index) => item._id || item.id || item.code || `country-${index}`}
              renderItem={({ item }) => {
                const id = item._id || item.id;
                const isSelected = id === selectedCountryId;
                return (
                  <TouchableOpacity
                    style={[styles.countryRow, isSelected && styles.countryRowSelected]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.countryFlag}>{item.flag || '🌍'}</Text>
                    <Text style={[styles.countryRowText, textStyle, isSelected && styles.countryRowTextSelected]}>
                      {getLocalizedLabel(item, currentLanguage)}
                    </Text>
                    {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={[styles.emptyText, textStyle]}>{t('countryNoResults')}</Text>}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = ({ colors, spacing, radii, fontSizes }) => StyleSheet.create({
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
    minHeight: '50%',
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
  searchInput: {
    height: 44,
    backgroundColor: colors.inputBackground,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    margin: spacing.lg,
    marginBottom: spacing.sm,
  },
  textRTL: {
    textAlign: 'right',
  },
  loaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  loaderText: {
    marginStart: spacing.sm,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryRowSelected: {
    backgroundColor: colors.primarySoft,
  },
  countryFlag: {
    fontSize: fontSizes.lg,
    marginEnd: spacing.sm,
  },
  countryRowText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  countryRowTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
});

export default CountryPickerModal;
