/**
 * Welcome Screen - Root page for mobile app
 * Mirrors: client/src/components/WelcomePage.jsx
 * Beautiful welcome screen with country selection
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';
import { storage } from '../utils/storage';
import apiClient from '../api/apiService';
import LanguageDropdown from '../components/LanguageDropdown';
import { getLocalizedLabel } from '../context/ReferenceDataContext';

const BRAND_MARK = require('../../assets/icon.png');

const WelcomeScreen = ({ navigation }) => {
  const { currentLanguage } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const isRTL = currentLanguage === 'ar';

  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [error, setError] = useState('');

  // Country code to name mapping for fallback
  const countryCodeToName = {
    'MA': { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' },
    'DZ': { en: 'Algeria', ar: 'الجزائر', fr: 'Algérie' },
    'TN': { en: 'Tunisia', ar: 'تونس', fr: 'Tunisie' },
    'EG': { en: 'Egypt', ar: 'مصر', fr: 'Égypte' },
    'SA': { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', fr: 'Arabie Saoudite' },
    'AE': { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', fr: 'Émirats Arabes Unis' },
    'QA': { en: 'Qatar', ar: 'قطر', fr: 'Qatar' },
    'KW': { en: 'Kuwait', ar: 'الكويت', fr: 'Koweït' },
    'BH': { en: 'Bahrain', ar: 'البحرين', fr: 'Bahreïn' },
    'OM': { en: 'Oman', ar: 'عُمان', fr: 'Oman' },
    'JO': { en: 'Jordan', ar: 'الأردن', fr: 'Jordanie' },
    'LB': { en: 'Lebanon', ar: 'لبنان', fr: 'Liban' },
    'SY': { en: 'Syria', ar: 'سوريا', fr: 'Syrie' },
    'IQ': { en: 'Iraq', ar: 'العراق', fr: 'Irak' },
    'PS': { en: 'Palestine', ar: 'فلسطين', fr: 'Palestine' },
    'LY': { en: 'Libya', ar: 'ليبيا', fr: 'Libye' },
    'SD': { en: 'Sudan', ar: 'السودان', fr: 'Soudan' },
    'SO': { en: 'Somalia', ar: 'الصومال', fr: 'Somalie' },
    'DJ': { en: 'Djibouti', ar: 'جيبوتي', fr: 'Djibouti' },
    'KM': { en: 'Comoros', ar: 'جزر القمر', fr: 'Comores' },
    'MR': { en: 'Mauritania', ar: 'موريتانيا', fr: 'Mauritanie' },
  };

  // Fallback countries in case API fails
  const fallbackCountries = [
    { _id: '68b0b774dcafb50aec949f4e', code: 'MA', label: 'Morocco', labels: { en: 'MA', ar: 'MA', fr: 'MA' }, names: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' }, flag: '🇲🇦', isActive: true },
  ];

  useEffect(() => {
    loadCountries();
    checkStoredCountry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload countries when language changes
  useEffect(() => {
    if (!isLoading && countries.length > 0) {
      loadCountries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);

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
  }, [searchQuery, countries, currentLanguage]);

  const checkStoredCountry = async () => {
    try {
      // This screen only ever mounts while signed out (RootNavigator swaps to the
      // authenticated stack otherwise), so a stored country alone means the user
      // already picked one on a previous cold start - skip straight to Login.
      const countryId = await storage.getCurrentCountry();
      if (countryId) {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Error checking stored country:', error);
    }
  };

  const loadCountries = async () => {
    try {
      setIsLoading(true);
      setError('');
      
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
      
      const validCountries = countriesList.length > 0 ? countriesList : fallbackCountries;
      setCountries(validCountries);
      setFilteredCountries(validCountries);
    } catch (err) {
      console.error('Error loading countries:', err);
      setError(t('errorLoadingCountries'));
      // Use fallback countries
      setCountries(fallbackCountries);
      setFilteredCountries(fallbackCountries);
    } finally {
      setIsLoading(false);
    }
  };

  const getCountryName = (country) => {
    if (!country) return '';
    const currentLang = currentLanguage || 'en';

    // getLocalizedLabel handles the standard names/labels/code fallback chain;
    // the extra check below is specific to this app's country data, where
    // `labels[lang]` sometimes stores a 2-letter placeholder code rather than
    // an actual name - in that case prefer the static country-name mapping.
    const label = getLocalizedLabel(country, currentLang);
    if (label && label.length === 2 && label === label.toUpperCase()) {
      return countryCodeToName[label]?.[currentLang] || country.code || label;
    }

    return label || countryCodeToName[country.code]?.[currentLang] || country.code || '';
  };

  const handleContinue = async () => {
    if (!selectedCountry) {
      setError(t('pleaseSelectCountry'));
      return;
    }

    try {
      // Store the selected country
      const countryId = selectedCountry._id || selectedCountry.id;
      await storage.setCurrentCountry(countryId);

      // Navigate to login screen
      navigation.replace('Login');
    } catch (err) {
      console.error('Error saving country:', err);
      setError(t('failedToSaveCountry'));
    }
  };

  const renderCountry = ({ item }) => {
    const isSelected = selectedCountry?._id === item._id || 
                      selectedCountry?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.countryItem,
          isSelected && styles.countryItemSelected
        ]}
        onPress={() => {
          setSelectedCountry(item);
          setShowCountryDropdown(false);
          setSearchQuery('');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.countryFlag}>
          {item.flag || '🌍'}
        </Text>
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

  if (isLoading && countries.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {t('loadingCountries')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Controls */}
          <View style={styles.topControls}>
            <LanguageDropdown />
          </View>

          {/* Logo and Welcome Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image source={BRAND_MARK} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.brandName}>{t('brandName')}</Text>
            <Text style={styles.welcomeMessage}>
              {t('welcomeMessage')}
            </Text>
          </View>

          {/* Country Selection Section */}
          <View style={styles.countrySection}>
            <Text style={styles.sectionTitle}>
              {t('chooseCountryTitle')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {t('chooseCountryDescription')}
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Country Dropdown Button */}
            <TouchableOpacity
              style={[
                styles.countryButton,
                selectedCountry && styles.countryButtonSelected
              ]}
              onPress={() => setShowCountryDropdown(!showCountryDropdown)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.countryButtonText,
                  isRTL && styles.textRTL,
                  !selectedCountry && styles.countryButtonPlaceholder
                ]}
              >
                {selectedCountry 
                  ? `${selectedCountry.flag || '🌍'} ${getCountryName(selectedCountry)}`
                  : t('chooseCountry')
                }
              </Text>
              <Text style={styles.dropdownArrow}>
                {showCountryDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {/* Country Search and List */}
            {showCountryDropdown && (
              <View style={styles.countryDropdown}>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={[styles.searchInput, isRTL && styles.textRTL]}
                    placeholder={t('searchCountry')}
                    placeholderTextColor={colors.placeholder}
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
                  maxHeight={200}
                  nestedScrollEnabled
                />
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedCountry && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              disabled={!selectedCountry}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {t('continueToPosts')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  countrySection: {
    paddingHorizontal: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: colors.dangerBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  countryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.inputBackground,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  countryButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  countryButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  countryButtonPlaceholder: {
    color: colors.placeholder,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.textSecondary,
    marginStart: 8,
  },
  countryDropdown: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    height: 44,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
  countryList: {
    maxHeight: 200,
  },
  countryListContent: {
    paddingVertical: 8,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryItemSelected: {
    backgroundColor: colors.primarySoft,
  },
  countryFlag: {
    fontSize: 24,
    marginEnd: 12,
  },
  countryName: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  countryNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
    marginStart: 8,
  },
  textRTL: {
    textAlign: 'right',
  },
  continueButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreen;

