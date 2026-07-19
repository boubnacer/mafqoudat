/**
 * New Post Screen
 * Simplified port of client/src/features/posts/NewPost/NewPostForm.js: same field set
 * and wire contract, but a single scrolling form instead of a multi-step wizard.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../app/api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { storage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import CityPickerModal from '../components/CityPickerModal';

const MAX_IMAGE_DIMENSION = 1920;
const TARGET_IMAGE_BYTES = 1024 * 1024; // 1MB - the target we compress toward
const HARD_CAP_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB - the server's hard limit
const MAX_CATEGORIES = 10;
const FIELD_ORDER = ['foundLost', 'categories', 'country', 'city', 'exactLocation', 'contact'];

const formatDateDisplay = (date) => {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Resizes to <=1920px on the long edge, then steps compression quality down
// until the result is <=1MB (matching the web's browser-image-compression
// options). Returns null if even the most aggressive pass can't get under
// the server's hard 2MB cap, so the caller can reject client-side.
const compressImageAsset = async (asset) => {
  const needsResize = (asset.width || 0) > MAX_IMAGE_DIMENSION || (asset.height || 0) > MAX_IMAGE_DIMENSION;
  const resizeAction = needsResize
    ? [{ resize: asset.width >= asset.height ? { width: MAX_IMAGE_DIMENSION } : { height: MAX_IMAGE_DIMENSION } }]
    : [];

  let quality = 0.8;
  let result = await ImageManipulator.manipulateAsync(asset.uri, resizeAction, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  let size = new File(result.uri).size;

  while (size > TARGET_IMAGE_BYTES && quality > 0.35) {
    quality -= 0.15;
    result = await ImageManipulator.manipulateAsync(asset.uri, resizeAction, {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    size = new File(result.uri).size;
  }

  if (size > HARD_CAP_IMAGE_BYTES) {
    return null;
  }

  return { uri: result.uri, width: result.width, height: result.height, size };
};

const NewPostScreen = ({ navigation }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { floptions, categories, countries, getCities, isLoading: referenceDataLoading } = useReferenceData();
  const isRTL = currentLanguage === 'ar';

  const [userId, setUserId] = useState(null);
  const [foundLost, setFoundLost] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [countryId, setCountryId] = useState('');
  const [cityValue, setCityValue] = useState(null);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [exactLocation, setExactLocation] = useState('');
  const [dateValue, setDateValue] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [image, setImage] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollViewRef = useRef(null);
  const fieldOffsetsRef = useRef({});

  // Prefill country + contact from the account profile (falls back to the
  // onboarding/account country already on the JWT if the profile fetch fails).
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      const userData = await storage.getUserData();
      if (!userData?.id) return;
      if (isMounted) setUserId(userData.id);
      if (isMounted && userData.country) setCountryId(userData.country);

      try {
        const response = await apiClient.get(`/users/${userData.id}`);
        const profile = response.data;
        if (!isMounted) return;
        if (profile?.phone) setContact(profile.phone);
        else if (profile?.email) setContact(profile.email);
        const profileCountryId = profile?.country?._id || profile?.country;
        if (profileCountryId) setCountryId(profileCountryId);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSelectFoundLost = (id) => {
    setFoundLost(id);
    clearFieldError('foundLost');
  };

  const handleToggleCategory = (id) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= MAX_CATEGORIES) {
        Alert.alert(t('error'), t('maxCategoriesReached'));
        return prev;
      }
      return [...prev, id];
    });
    clearFieldError('categories');
  };

  const handleSelectCountry = (id) => {
    if (id === countryId) return;
    setCountryId(id);
    setCityValue(null);
    clearFieldError('country');
  };

  const handleSelectCity = (value) => {
    setCityValue(value);
    setCityPickerVisible(false);
    clearFieldError('city');
  };

  const handleDateChange = (event, selected) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type !== 'dismissed' && selected) {
      setDateValue(selected);
    }
  };

  const selectedFloption = floptions.find((fl) => fl._id === foundLost);
  const isFoundType = selectedFloption?.code === 'FOUND';

  const confirmAndPickImage = () => {
    if (isProcessingImage) return;
    Alert.alert(
      t('imageWarningTitle'),
      isFoundType ? t('imageWarningDescriptionFound') : t('imageWarningDescriptionLost'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('continue'), onPress: pickImage },
      ]
    );
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t('error'), t('imagePickerPermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setIsProcessingImage(true);
    try {
      const compressed = await compressImageAsset(result.assets[0]);
      if (!compressed) {
        Alert.alert(t('error'), t('imageTooLarge'));
        return;
      }
      setImage(compressed);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert(t('error'), t('errorCreatingPostMessage'));
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = () => setImage(null);

  const registerFieldOffset = (field) => (event) => {
    fieldOffsetsRef.current[field] = event.nativeEvent.layout.y;
  };

  const validate = () => {
    const errors = {};
    if (!foundLost) errors.foundLost = true;
    if (selectedCategoryIds.length === 0) errors.categories = true;
    if (!countryId) errors.country = true;
    if (!cityValue) errors.city = true;
    if (!exactLocation.trim()) errors.exactLocation = true;
    if (!contact.trim()) errors.contact = true;
    return errors;
  };

  const scrollToFirstError = (errors) => {
    const firstKey = FIELD_ORDER.find((key) => errors[key]);
    const offset = firstKey !== undefined ? fieldOffsetsRef.current[firstKey] : undefined;
    if (offset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(offset - 16, 0), animated: true });
    }
  };

  const buildPostData = () => {
    const postData = {
      user: userId,
      country: countryId,
      categories: selectedCategoryIds,
      category: selectedCategoryIds[0] || null,
      foundLost,
      contact: contact.trim(),
      exactLocation: exactLocation.trim(),
      exactDate: dateValue ? formatDateDisplay(dateValue) : '',
      description: description.trim(),
      // Matches the web form's current submission (NewPostForm.js) so mobile-
      // and web-created posts behave identically; fixing the underlying
      // contactPreferences bug is out of scope here.
      contactPreferences: { whatsapp: true },
    };

    if (cityValue) {
      if (cityValue.isApi) {
        postData.city = cityValue.code;
        postData.cityData = cityValue.raw;
      } else {
        postData.city = cityValue.id;
      }
    }

    return postData;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError({ type: 'validation', message: t('pleaseCompleteRequiredFields') });
      scrollToFirstError(errors);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('postData', JSON.stringify(buildPostData()));
      if (image) {
        formData.append('image', { uri: image.uri, name: 'post-image.jpg', type: 'image/jpeg' });
      }

      // apiClient defaults to Content-Type: application/json; FormData needs the
      // multipart boundary the RN networking layer generates when it sees this
      // exact content-type family, so this one request must override it (no
      // boundary is set manually here - the runtime fills in the real one).
      const response = await apiClient.post(API_ENDPOINTS.POSTS.CREATE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const postId = response.data?.postId;
      navigation.replace('PostDetailScreen', { id: postId });
    } catch (err) {
      if (err.response?.status === 429) {
        setSubmitError({ type: 'ratelimit', message: err.response.data?.message || t('postingLimitReached') });
      } else if (err.response?.status === 400) {
        const missing = err.response.data?.missing;
        setSubmitError({
          type: 'validation',
          message: missing?.length
            ? `${t('pleaseCompleteRequiredFields')}: ${missing.join(', ')}`
            : t('errorCreatingPostMessage'),
        });
      } else if (!err.response) {
        setSubmitError({ type: 'network', message: t('networkError') });
      } else {
        setSubmitError({ type: 'generic', message: err.response?.data?.message || t('errorCreatingPostMessage') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const textStyle = isRTL ? styles.textRTL : null;

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {t('createNewPost')}
      </Text>
      <View style={styles.backButton} />
    </View>
  );

  if (referenceDataLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View onLayout={registerFieldOffset('foundLost')}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('postType')} *</Text>
            <View style={styles.chipsRow}>
              {floptions.map((fl) => {
                const isSelected = foundLost === fl._id;
                return (
                  <TouchableOpacity
                    key={fl._id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleSelectFoundLost(fl._id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {getLocalizedLabel(fl, currentLanguage)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {fieldErrors.foundLost ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
          </View>

          <View onLayout={registerFieldOffset('categories')} style={styles.section}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('selectCategories')} *</Text>
            <View style={styles.chipsRow}>
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat._id);
                return (
                  <TouchableOpacity
                    key={cat._id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleToggleCategory(cat._id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {getLocalizedLabel(cat, currentLanguage)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {fieldErrors.categories ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
          </View>

          <View onLayout={registerFieldOffset('country')} style={styles.section}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('country')} *</Text>
            <View style={styles.chipsRow}>
              {countries.map((country) => {
                const id = country._id || country.id;
                const isSelected = id === countryId;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleSelectCountry(id)}
                  >
                    {country.flag ? <Text style={styles.chipFlag}>{country.flag}</Text> : null}
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {getLocalizedLabel(country, currentLanguage)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {fieldErrors.country ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
          </View>

          <View onLayout={registerFieldOffset('city')} style={styles.section}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('city')} *</Text>
            <TouchableOpacity
              style={[styles.selectButton, !countryId && styles.selectButtonDisabled]}
              disabled={!countryId}
              onPress={() => setCityPickerVisible(true)}
            >
              <Text style={[styles.selectButtonText, !cityValue && styles.selectButtonPlaceholder, textStyle]}>
                {cityValue ? cityValue.label : t('selectCity')}
              </Text>
            </TouchableOpacity>
            {fieldErrors.city ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
          </View>

          <View onLayout={registerFieldOffset('exactLocation')} style={styles.section}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('location')} *</Text>
            <TextInput
              style={[styles.textInput, textStyle, fieldErrors.exactLocation && styles.inputError]}
              placeholder={t('exactLocationPlaceholder')}
              placeholderTextColor="#999"
              value={exactLocation}
              onChangeText={(text) => {
                setExactLocation(text);
                clearFieldError('exactLocation');
              }}
              maxLength={200}
            />
            {fieldErrors.exactLocation ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('date')}</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.selectButtonText, !dateValue && styles.selectButtonPlaceholder, textStyle]}>
                {dateValue ? formatDateDisplay(dateValue) : t('selectDate')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('description')}</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, textStyle]}
              placeholder={t('descriptionPlaceholder')}
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
          </View>

          <View onLayout={registerFieldOffset('contact')} style={styles.section}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('contactSeller')} *</Text>
            <TextInput
              style={[styles.textInput, textStyle, fieldErrors.contact && styles.inputError]}
              placeholder={t('contactPlaceholder')}
              placeholderTextColor="#999"
              value={contact}
              onChangeText={(text) => {
                setContact(text);
                clearFieldError('contact');
              }}
              maxLength={100}
              autoCapitalize="none"
            />
            {fieldErrors.contact ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('itemImage')}</Text>
            <Text style={[styles.helperText, textStyle]}>{t('imageOptionalMessage')}</Text>
            {image ? (
              <View>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
                <View style={styles.imageButtonsRow}>
                  <TouchableOpacity
                    style={styles.imageSecondaryButton}
                    onPress={confirmAndPickImage}
                    disabled={isProcessingImage}
                  >
                    <Text style={styles.imageSecondaryButtonText}>{t('changeImage')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageSecondaryButton} onPress={handleRemoveImage}>
                    <Text style={styles.imageSecondaryButtonText}>{t('removeImage')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addImageButton} onPress={confirmAndPickImage} disabled={isProcessingImage}>
                {isProcessingImage ? (
                  <>
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Text style={styles.addImageButtonText}>{t('compressingImage')}</Text>
                  </>
                ) : (
                  <Text style={styles.addImageButtonText}>{t('addImage')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {submitError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{submitError.message}</Text>
              {submitError.type !== 'validation' ? (
                <TouchableOpacity onPress={handleSubmit} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>{t('retry')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.submitButtonText, styles.submitButtonTextLoading]}>{t('submitting')}</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>{t('publishPost')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && Platform.OS === 'android' ? (
        <DateTimePicker value={dateValue || new Date()} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerSheet}>
              <DateTimePicker
                value={dateValue || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
              <TouchableOpacity style={styles.datePickerDoneButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerDoneText}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}

      <CityPickerModal
        visible={cityPickerVisible}
        onClose={() => setCityPickerVisible(false)}
        t={t}
        currentLanguage={currentLanguage}
        isRTL={isRTL}
        countryId={countryId}
        countryCode={countries.find((c) => (c._id || c.id) === countryId)?.code}
        getCities={getCities}
        onSelect={handleSelectCity}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textRTL: {
    textAlign: 'right',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
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
  selectButton: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  selectButtonText: {
    fontSize: 15,
    color: '#333',
  },
  selectButtonPlaceholder: {
    color: '#999',
  },
  textInput: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#c62828',
  },
  fieldError: {
    color: '#c62828',
    fontSize: 12,
    marginTop: 6,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  imageButtonsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  imageSecondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    marginRight: 10,
  },
  imageSecondaryButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 13,
  },
  addImageButton: {
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 14,
    marginTop: 24,
  },
  errorBannerText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#c62828',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  submitButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonTextLoading: {
    marginLeft: 10,
  },
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  datePickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  datePickerDoneButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 4,
  },
  datePickerDoneText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NewPostScreen;
