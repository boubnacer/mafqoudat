/**
 * City Picker Modal
 * Two ways to pick a city, in order of complexity (mirrors NewPostForm.js):
 *  (a) a plain list fed by GET /cities-public?countryId=... (via ReferenceDataContext.getCities,
 *      cached per country)
 *  (b) once the user types >= 2 characters, a type-ahead search against
 *      GET /cities/search?q=...&countryCode=...&language=... for cities not in the local list.
 * A search result with no Mongo _id (API-sourced, GeoNames/Google) is returned to the caller
 * as { id: null, isApi: true, code, raw } so the caller can submit it as `city`/`cityData`.
 * "Create custom city" (web's dynamic-city creation dialog) is intentionally out of scope for v1.
 * Visual language mirrors SelectModal.js (colorTokens-based sheet/search/row styling), so this
 * picker reads as the same component family even though its search logic is bespoke.
 */

import React, { useEffect, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/apiService';
import { getLocalizedLabel } from '../context/ReferenceDataContext';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, radiusTokens, fontFamilies } from '../theme/tokens';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

const CityPickerModal = ({ visible, onClose, t, currentLanguage, isRTL, countryId, countryCode, getCities, onSelect }) => {
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const styles = useMemoStyles(tokens, isDark);

  const [plainCities, setPlainCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!visible || !countryId) return;
    let isMounted = true;
    setCitiesLoading(true);
    getCities(countryId).then((result) => {
      if (isMounted) {
        setPlainCities(result);
        setCitiesLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, countryId]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [visible]);

  const performSearch = async (searchQuery, requestId) => {
    try {
      const response = await apiClient.get('/cities/search', {
        params: {
          q: searchQuery,
          language: currentLanguage || 'en',
          limit: 10,
          ...(countryCode && { countryCode }),
        },
      });
      if (requestId !== requestIdRef.current) return;
      setSearchResults(response.data?.data || []);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error searching cities:', error);
      setSearchResults([]);
    } finally {
      if (requestId === requestIdRef.current) setIsSearching(false);
    }
  };

  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    debounceRef.current = setTimeout(() => performSearch(text.trim(), requestId), SEARCH_DEBOUNCE_MS);
  };

  const isActivelySearching = query.trim().length >= MIN_SEARCH_LENGTH;
  const localMatches = query.trim() && !isActivelySearching
    ? plainCities.filter((city) =>
        getLocalizedLabel(city, currentLanguage).toLowerCase().includes(query.trim().toLowerCase())
      )
    : plainCities;
  const displayedCities = isActivelySearching ? searchResults : localMatches;

  const handleSelect = (city) => {
    const id = city._id || city.id || null;
    const label = getLocalizedLabel(city, currentLanguage);
    if (id) {
      onSelect({ id, isApi: false, label });
    } else {
      onSelect({ id: null, isApi: true, code: city.code, raw: city, label });
    }
  };

  const textStyle = isRTL ? styles.textRTL : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, textStyle]} numberOfLines={1}>
              {t('selectCity')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Ionicons name="close" size={20} color={tokens.ink} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={`${tokens.ink}80`} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, textStyle]}
              placeholder={t('searchCity')}
              placeholderTextColor={`${tokens.ink}80`}
              value={query}
              onChangeText={handleQueryChange}
              autoCapitalize="none"
              autoFocus
            />
          </View>

          {citiesLoading || isSearching ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color={tokens.brandPrimary} />
              {isSearching ? <Text style={[styles.loaderText, textStyle]}>{t('searchingCities')}</Text> : null}
            </View>
          ) : (
            <FlatList
              data={displayedCities}
              keyExtractor={(city, index) => city._id || city.id || city.code || `city-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.7}>
                  <Text style={[styles.rowLabel, textStyle]} numberOfLines={1}>
                    {getLocalizedLabel(item, currentLanguage)}
                  </Text>
                  {!item._id && !item.id ? (
                    <Text style={styles.citySourceBadge}>{item.source || ''}</Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, textStyle]}>{t('cityNoResults')}</Text>
              }
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// Small inline hook so createStyles is memoized without pulling in useMemo
// at every call site above - keeps the component body focused on logic.
function useMemoStyles(tokens, isDark) {
  const ref = useRef({ tokens: null, isDark: null, styles: null });
  if (ref.current.tokens !== tokens || ref.current.isDark !== isDark) {
    ref.current = { tokens, isDark, styles: createStyles(tokens, isDark) };
  }
  return ref.current.styles;
}

const createStyles = (tokens, isDark) =>
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
      minHeight: '50%',
      paddingBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
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
      marginStart: 8,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${tokens.ink}0A`,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      marginHorizontal: 16,
      marginTop: 14,
      marginBottom: 6,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginEnd: 8,
    },
    searchInput: {
      flex: 1,
      height: 44,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
    },
    textRTL: {
      textAlign: 'right',
    },
    loaderRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 28,
    },
    loaderText: {
      marginStart: 8,
      color: `${tokens.ink}99`,
      fontFamily: fontFamilies.body,
      fontSize: 13,
    },
    list: {
      paddingHorizontal: 16,
    },
    listContent: {
      paddingVertical: 8,
      paddingBottom: 16,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '14' : '0F'}`,
    },
    rowLabel: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
    },
    citySourceBadge: {
      fontSize: 11,
      color: `${tokens.ink}80`,
      textTransform: 'uppercase',
      marginStart: 8,
    },
    emptyText: {
      textAlign: 'center',
      color: `${tokens.ink}80`,
      fontFamily: fontFamilies.body,
      marginTop: 32,
    },
  });

export default CityPickerModal;
