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
import apiClient from '../app/api/apiService';
import { getLocalizedLabel } from '../context/ReferenceDataContext';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

const CityPickerModal = ({ visible, onClose, t, currentLanguage, isRTL, countryId, countryCode, getCities, onSelect }) => {
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
            <Text style={styles.headerTitle}>{t('selectCity')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.searchInput, textStyle]}
            placeholder={t('searchCity')}
            placeholderTextColor="#999"
            value={query}
            onChangeText={handleQueryChange}
            autoCapitalize="none"
            autoFocus
          />

          {citiesLoading || isSearching ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color="#2196F3" />
              {isSearching ? <Text style={[styles.loaderText, textStyle]}>{t('searchingCities')}</Text> : null}
            </View>
          ) : (
            <FlatList
              data={displayedCities}
              keyExtractor={(city, index) => city._id || city.id || city.code || `city-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.cityRow} onPress={() => handleSelect(item)}>
                  <Text style={[styles.cityRowText, textStyle]}>{getLocalizedLabel(item, currentLanguage)}</Text>
                  {!item._id && !item.id ? <Text style={styles.citySourceBadge}>{item.source || ''}</Text> : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, textStyle]}>{t('cityNoResults')}</Text>
              }
              style={styles.list}
              keyboardShouldPersistTaps="handled"
            />
          )}
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
    minHeight: '50%',
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
  searchInput: {
    height: 44,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
    margin: 16,
    marginBottom: 8,
  },
  textRTL: {
    textAlign: 'right',
  },
  loaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  loaderText: {
    marginLeft: 8,
    color: '#999',
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cityRowText: {
    fontSize: 15,
    color: '#333',
  },
  citySourceBadge: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
  },
});

export default CityPickerModal;
