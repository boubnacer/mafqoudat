/**
 * Country Selection Screen for Google OAuth
 * Mirrors: client/src/features/auth/CountrySelection.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiService';
import { getLocalizedLabel } from '../context/ReferenceDataContext';

const CountrySelectionScreen = ({ navigation }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { pendingToken, completeGoogleRegistration } = useAuth();
  const isRTL = currentLanguage === 'ar';

  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pendingToken) {
      navigation.replace('Login');
      return;
    }
    loadCountries();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = countries.filter(country => {
        const name = getCountryName(country);
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(countries);
    }
  }, [searchQuery, countries]);

  const loadCountries = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/countries', {
        params: {
          language: currentLanguage || 'en',
          active: true,
        },
      });

      // Handle different response structures
      let countriesList = [];
      if (response.data?.ids && response.data?.entities) {
        countriesList = response.data.ids.map(id => response.data.entities[id]);
      } else if (Array.isArray(response.data)) {
        countriesList = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        countriesList = response.data.data;
      }
      
      setCountries(countriesList);
      setFilteredCountries(countriesList);
    } catch (err) {
      console.error('Error loading countries:', err);
      setError(t('errorLoadingCountries'));
    } finally {
      setIsLoading(false);
    }
  };

  const getCountryName = (country) => {
    if (!country) return '';
    return getLocalizedLabel(country, currentLanguage) || country.name || '';
  };

  const handleSubmit = async () => {
    if (!selectedCountry) {
      setError(t('pleaseSelectCountry'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const countryId = selectedCountry._id || selectedCountry.id || selectedCountry;

      const result = await completeGoogleRegistration(countryId);

      if (!result.success) {
        // The pending token is a one-shot, 5-minute window (server-side in-memory map);
        // once it's dead there's nothing to retry here, so send the user back to restart
        // Google sign-in rather than leaving them stuck on this screen.
        if (result.code === 'TOKEN_EXPIRED' || result.code === 'INVALID_TOKEN') {
          Alert.alert(
            t('sessionExpired'),
            t('pendingTokenExpired'),
            [{ text: t('ok'), onPress: () => navigation.replace('Login') }]
          );
          return;
        }
        setError(result.error || t('registrationFailed'));
      }
      // On success, AuthContext's isSignedIn flip drives the RootNavigator to PostsListScreen.
    } catch (err) {
      console.error('Country selection error:', err);
      setError(t('registrationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCountry = ({ item }) => {
    const isSelected = selectedCountry?._id === item._id || 
                      selectedCountry?.id === item.id ||
                      selectedCountry === item._id ||
                      selectedCountry === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.countryItem,
          isSelected && styles.countryItemSelected
        ]}
        onPress={() => setSelectedCountry(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.countryFlag}>{item.flag || '🌍'}</Text>
        <Text
          style={[
            styles.countryName,
            isRTL && styles.textRTL,
            isSelected && styles.countryNameSelected
          ]}
        >
          {getCountryName(item)}
        </Text>
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>
          {t('loadingCountries')}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {t('chooseCountry')}
        </Text>
        <Text style={styles.subtitle}>
          {t('chooseCountryDescription')}
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, isRTL && styles.textRTL]}
            placeholder={t('searchCountry')}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        <FlatList
          data={filteredCountries}
          renderItem={renderCountry}
          keyExtractor={(item) => item._id || item.id || item.code}
          style={styles.countryList}
          contentContainerStyle={styles.countryListContent}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedCountry || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!selectedCountry || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t('continueToPosts')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  countryList: {
    flex: 1,
  },
  countryListContent: {
    paddingBottom: 16,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countryItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  countryFlag: {
    fontSize: 22,
    marginEnd: 12,
  },
  countryName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  countryNameSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  submitButton: {
    height: 50,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  textRTL: {
    textAlign: 'right',
  },
});

export default CountrySelectionScreen;

