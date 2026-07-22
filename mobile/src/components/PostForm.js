/**
 * Post Form
 * Shared field set for creating and editing a post - extracted so NewPostScreen
 * and EditPostScreen aren't two divergent copies of the same ~450-line form.
 * This component only collects and validates fields; the two screens that use it
 * own the actual API call (the wire contract differs: POST is always multipart,
 * PATCH is JSON unless the image changed) and pass isSubmitting/submitError down.
 *
 * Presented as a 4-step wizard (Item -> Location -> Photo -> Review), mirroring
 * the web app's NewPost wizard (client/src/features/posts/NewPost/NewPostForm.js)
 * so the create/edit flow feels the same on both platforms. Type, Categories and
 * Country are searchable dropdowns (SelectModal); City keeps its own bespoke
 * local+remote type-ahead (CityPickerModal), just restyled to match.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../api/apiService';
import { API_BASE_URL } from '../config/api';
import { storage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { useReferenceData, getLocalizedLabel } from '../context/ReferenceDataContext';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, radiusTokens, fontFamilies, lightColors, darkColors } from '../theme/tokens';
import { getCategoryConfig } from '../config/categories';
import CityPickerModal from './CityPickerModal';
import SelectModal from './SelectModal';

const MAX_IMAGE_DIMENSION = 1920;
const TARGET_IMAGE_BYTES = 1024 * 1024; // 1MB - the target we compress toward
const HARD_CAP_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB - the server's hard limit
const MAX_CATEGORIES = 10;

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

// initialPost.city is either a populated {id, code, labels, isDynamic} object, a
// raw free-text string (legacy posts with no linked City document), or absent.
const buildInitialCityValue = (post, lang) => {
  if (!post?.city) return null;
  if (typeof post.city === 'string') {
    return { id: null, code: null, raw: null, label: post.city };
  }
  return {
    id: post.city.id || null,
    code: null,
    raw: null,
    label: post.cityName || getLocalizedLabel(post.city, lang) || post.city.code || '',
  };
};

const PostForm = ({ mode, initialPost, isSubmitting, submitError, submitButtonLabel, onSubmit }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const legacy = isDark ? darkColors : lightColors;
  const styles = useMemo(() => createStyles(tokens, legacy, isDark), [tokens, legacy, isDark]);
  const {
    floptions,
    categories,
    countries,
    getCities,
    isLoading: referenceDataLoading,
    error: referenceDataError,
    retry: retryReferenceData,
  } = useReferenceData();
  const isRTL = currentLanguage === 'ar';
  const isEdit = mode === 'edit';
  const textStyle = isRTL ? styles.textRTL : null;

  const [userId, setUserId] = useState(null);
  const [foundLost, setFoundLost] = useState(initialPost?.foundLost || '');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(
    Array.isArray(initialPost?.Categories) ? initialPost.Categories.map((c) => c._id) : []
  );
  const [countryId, setCountryId] = useState(initialPost?.country || '');
  const [cityValue, setCityValue] = useState(buildInitialCityValue(initialPost, currentLanguage));
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [exactLocation, setExactLocation] = useState(initialPost?.exactLocation || '');
  const [exactDateText, setExactDateText] = useState(initialPost?.mainDate || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState(initialPost?.description || '');
  const [contact, setContact] = useState(initialPost?.contact || '');
  const [imageAsset, setImageAsset] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [validationError, setValidationError] = useState(null);

  // Edit mode lands directly on the Review step - the user is changing an
  // existing, already-complete post, not filling one out from scratch, so
  // every earlier step is "reached" and reviewable/editable immediately.
  const [activeStep, setActiveStep] = useState(isEdit ? 3 : 0);
  const [maxStepReached, setMaxStepReached] = useState(isEdit ? 3 : 0);
  const scrollViewRef = useRef(null);

  // Prefill country + contact from the account profile - only relevant for a
  // brand new post; edit mode already has everything it needs from initialPost.
  useEffect(() => {
    if (isEdit) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleConfirmCategories = (ids) => {
    setSelectedCategoryIds(ids);
    if (ids.length > 0) clearFieldError('categories');
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
      setExactDateText(formatDateDisplay(selected));
    }
  };

  // Best-effort parse of whatever's currently in exactDateText just to seed
  // where the wheel/calendar opens - falls back to today if it isn't a real
  // date (free text from a legacy web-created post, or simply empty).
  const datePickerValue = () => {
    if (exactDateText) {
      const parsed = new Date(exactDateText);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const selectedFloption = floptions.find((fl) => fl._id === foundLost);
  const isFoundType = selectedFloption?.code === 'FOUND';
  const foundLostTone = foundLost ? (isFoundType ? tokens.status.found : tokens.status.lost) : null;

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
      setImageAsset(compressed);
      setImageRemoved(false);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert(t('error'), t('errorCreatingPostMessage'));
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageAsset(null);
    if (isEdit) setImageRemoved(true);
  };

  // Per-step validators - each returns only the errors relevant to the
  // fields shown on that step, so "Next" can gate a step without touching
  // fields the user hasn't reached yet.
  const validateItemStep = () => {
    const errors = {};
    if (!foundLost) errors.foundLost = true;
    if (selectedCategoryIds.length === 0) errors.categories = true;
    return errors;
  };
  const validateLocationStep = () => {
    const errors = {};
    if (!countryId) errors.country = true;
    if (!cityValue) errors.city = true;
    if (!exactLocation.trim()) errors.exactLocation = true;
    return errors;
  };
  const validateReviewStep = () => {
    const errors = {};
    if (!contact.trim()) errors.contact = true;
    return errors;
  };
  const STEP_VALIDATORS = [validateItemStep, validateLocationStep, () => ({}), validateReviewStep];

  const goToStep = (index) => {
    setActiveStep(index);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleNextStep = () => {
    const errors = STEP_VALIDATORS[activeStep]();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setValidationError(t('pleaseCompleteRequiredFields'));
      return;
    }
    setFieldErrors({});
    setValidationError(null);
    setMaxStepReached((m) => Math.max(m, activeStep + 1));
    goToStep(activeStep + 1);
  };

  const handleBackStep = () => {
    setFieldErrors({});
    setValidationError(null);
    goToStep(activeStep - 1);
  };

  // Only lets the user jump back to a step they've already passed validation
  // for, never ahead of it (used by the Review step's per-section Edit link).
  const handleEditStep = (index) => {
    if (index <= maxStepReached) goToStep(index);
  };

  const buildPostData = () => {
    const postData = {
      user: isEdit ? initialPost.user : userId,
      country: countryId,
      categories: selectedCategoryIds,
      category: selectedCategoryIds[0] || null,
      foundLost,
      contact: contact.trim(),
      exactLocation: exactLocation.trim(),
      exactDate: exactDateText.trim(),
      description: description.trim(),
      // Matches the web form's current submission (NewPostForm.js/EditPostForm.js)
      // so posts behave identically regardless of platform; fixing the underlying
      // contactPreferences bug is out of scope here.
      contactPreferences: { whatsapp: true },
    };

    if (cityValue) {
      if (cityValue.id) {
        postData.city = cityValue.id;
      } else if (cityValue.code) {
        postData.city = cityValue.code;
        postData.cityData = cityValue.raw;
      } else if (cityValue.label) {
        postData.city = cityValue.label;
      }
    }

    if (isEdit) {
      postData.id = initialPost._id;
      // The dedicated "mark as returned" action owns this transition; edit
      // just resends whatever the post's current value already was.
      postData.returned = initialPost.returned === true;
    }

    return postData;
  };

  // Final safety net before submit (mirrors the web wizard's handleSubmit):
  // re-checks every step in case a field was cleared after its step already
  // passed, and jumps to the earliest offending step rather than just
  // blocking submission silently.
  const handleSubmit = () => {
    const itemErrors = validateItemStep();
    const locationErrors = validateLocationStep();
    const reviewErrors = validateReviewStep();
    const errors = { ...itemErrors, ...locationErrors, ...reviewErrors };

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setValidationError(t('pleaseCompleteRequiredFields'));
      if (Object.keys(itemErrors).length > 0) goToStep(0);
      else if (Object.keys(locationErrors).length > 0) goToStep(1);
      else goToStep(3);
      return;
    }

    setFieldErrors({});
    setValidationError(null);
    onSubmit({
      postData: buildPostData(),
      imageAsset,
      imageRemoved: isEdit ? imageRemoved : false,
    });
  };

  if (referenceDataLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={tokens.brandPrimary} />
      </View>
    );
  }

  if (referenceDataError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorBannerText, textStyle]}>{t('failedToLoadFormData')}</Text>
        <TouchableOpacity onPress={retryReferenceData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const existingImageUri =
    isEdit && initialPost?.image && !imageRemoved && !imageAsset
      ? initialPost.image.startsWith('http')
        ? initialPost.image
        : `${API_BASE_URL}/${initialPost.image}`
      : null;
  const displayImageUri = imageAsset?.uri || existingImageUri;
  const bannerMessage = validationError || submitError?.message;
  const showRetry = !validationError && submitError && submitError.type !== 'validation';

  const steps = [
    { key: 'item', title: t('wizardStepItemTitle'), subtitle: t('wizardStepItemSubtitle') },
    { key: 'location', title: t('wizardStepLocationTitle'), subtitle: t('wizardStepLocationSubtitle') },
    { key: 'photo', title: t('wizardStepPhotoTitle'), subtitle: t('wizardStepPhotoSubtitle') },
    { key: 'review', title: t('wizardStepReviewTitle'), subtitle: t('wizardStepReviewSubtitle') },
  ];

  const selectedCountry = countries.find((c) => (c._id || c.id) === countryId) || null;
  const countryLabel = selectedCountry
    ? `${selectedCountry.flag ? `${selectedCountry.flag} ` : ''}${getLocalizedLabel(selectedCountry, currentLanguage)}`
    : '';
  const typeLabel = selectedFloption ? getLocalizedLabel(selectedFloption, currentLanguage) : '';
  const selectedCategories = categories.filter((cat) => selectedCategoryIds.includes(cat._id));
  const isLastStep = activeStep === steps.length - 1;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.progressBlock}>
        <View style={styles.progressRow}>
          {steps.map((step, index) => (
            <View
              key={step.key}
              style={[styles.progressSegment, index <= activeStep && styles.progressSegmentActive]}
            />
          ))}
        </View>
        <Text style={[styles.progressLabel, textStyle]}>
          {t('wizardStepProgressShort', { current: activeStep + 1, total: steps.length })}
        </Text>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.stepHeader}>
          <Text style={[styles.stepTitle, textStyle]}>{steps[activeStep].title}</Text>
          <Text style={[styles.stepSubtitle, textStyle]}>{steps[activeStep].subtitle}</Text>
        </View>

        {bannerMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{bannerMessage}</Text>
            {showRetry ? (
              <TouchableOpacity onPress={handleSubmit} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>{t('retry')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {activeStep === 0 && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, textStyle]}>
                {t('postType')}
                <Text style={styles.requiredMark}> *</Text>
              </Text>
              <Text style={[styles.helperText, textStyle]}>{t('haveYouLostOrFoundSomething')}</Text>
              <FieldButton
                styles={styles}
                textStyle={textStyle}
                label={typeLabel}
                placeholder={t('selectType')}
                error={fieldErrors.foundLost}
                onPress={() => setTypePickerVisible(true)}
                leading={
                  foundLostTone ? (
                    <Ionicons name={isFoundType ? 'checkmark-circle' : 'search'} size={18} color={foundLostTone.main} />
                  ) : null
                }
                tone={foundLostTone}
              />
              {fieldErrors.foundLost ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, textStyle]}>
                {t('categories')}
                <Text style={styles.requiredMark}> *</Text>
              </Text>
              <Text style={[styles.helperText, textStyle]}>
                {foundLost ? (isFoundType ? t('specifyItemTypeFound') : t('specifyItemTypeLost')) : t('selectCategories')}
              </Text>
              <FieldButton
                styles={styles}
                textStyle={textStyle}
                label={selectedCategories.map((c) => getLocalizedLabel(c, currentLanguage)).join(', ')}
                placeholder={t('selectCategories')}
                error={fieldErrors.categories}
                onPress={() => setCategoryPickerVisible(true)}
                leading={<Ionicons name="pricetags-outline" size={18} color={`${tokens.ink}99`} />}
                badge={selectedCategories.length > 0 ? String(selectedCategories.length) : null}
              />
              {selectedCategories.length > 0 ? (
                <View style={styles.chipsRow}>
                  {selectedCategories.map((cat) => {
                    const config = getCategoryConfig(cat.code);
                    return (
                      <TouchableOpacity
                        key={cat._id}
                        style={[
                          styles.categoryChip,
                          { backgroundColor: isDark ? `${config.color}33` : config.backgroundColor, borderColor: config.color },
                        ]}
                        onPress={() => handleToggleCategory(cat._id)}
                      >
                        <Ionicons name={config.icon} size={13} color={config.color} style={styles.categoryChipIcon} />
                        <Text style={[styles.categoryChipText, { color: config.color }]} numberOfLines={1}>
                          {getLocalizedLabel(cat, currentLanguage)}
                        </Text>
                        <Ionicons name="close" size={13} color={config.color} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
              {fieldErrors.categories ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, textStyle]}>
                {t('description')} ({t('optional')})
              </Text>
              <Text style={[styles.helperText, textStyle]}>
                {isFoundType ? t('descriptionOptionalFoundMessage') : t('descriptionOptionalLostMessage')}
              </Text>
              {isFoundType ? (
                <View style={styles.warningBanner}>
                  <Text style={[styles.warningBannerText, textStyle]}>{t('descriptionSensitiveInfoWarning')}</Text>
                </View>
              ) : null}
              <TextInput
                style={[styles.textInput, styles.textArea, textStyle]}
                placeholder={t('descriptionPlaceholder')}
                placeholderTextColor={`${tokens.ink}80`}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={2000}
              />
            </View>
          </>
        )}

        {activeStep === 1 && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, textStyle]}>
                {t('country')}
                <Text style={styles.requiredMark}> *</Text>
              </Text>
              <Text style={[styles.helperText, textStyle]}>
                {isFoundType ? t('chooseCountryFound') : t('chooseCountryLost')}
              </Text>
              <FieldButton
                styles={styles}
                textStyle={textStyle}
                label={countryLabel}
                placeholder={t('selectCountry')}
                error={fieldErrors.country}
                onPress={() => setCountryPickerVisible(true)}
                leading={<Ionicons name="flag-outline" size={18} color={`${tokens.ink}99`} />}
              />
              {fieldErrors.country ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, textStyle]}>
                {t('city')}
                <Text style={styles.requiredMark}> *</Text>
              </Text>
              <Text style={[styles.helperText, textStyle]}>
                {!countryId ? t('selectCountryFirst') : isFoundType ? t('chooseCityFound') : t('chooseCityLost')}
              </Text>
              <FieldButton
                styles={styles}
                textStyle={textStyle}
                label={cityValue?.label}
                placeholder={t('selectCity')}
                error={fieldErrors.city}
                disabled={!countryId}
                onPress={() => setCityPickerVisible(true)}
                leading={<Ionicons name="location-outline" size={18} color={`${tokens.ink}99`} />}
              />
              {fieldErrors.city ? <Text style={styles.fieldError}>{t('thisFieldRequired')}</Text> : null}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, textStyle]}>
                {t('location')}
                <Text style={styles.requiredMark}> *</Text>
              </Text>
              <Text style={[styles.helperText, textStyle]}>
                {isFoundType ? t('exactLocationHintFound') : t('exactLocationHintLost')}
              </Text>
              <TextInput
                style={[styles.textInput, textStyle, fieldErrors.exactLocation && styles.inputError]}
                placeholder={t('exactLocationPlaceholder')}
                placeholderTextColor={`${tokens.ink}80`}
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
              <Text style={[styles.sectionLabel, textStyle]}>
                {isFoundType ? t('exactDateFound') : t('exactDateLost')} ({t('optional')})
              </Text>
              <Text style={[styles.helperText, textStyle]}>
                {isFoundType ? t('exactDateFoundPlaceholderOptional') : t('exactDateLostPlaceholderOptional')}
              </Text>
              <FieldButton
                styles={styles}
                textStyle={textStyle}
                label={exactDateText}
                placeholder={t('selectDate')}
                onPress={() => setShowDatePicker(true)}
                leading={<Ionicons name="calendar-outline" size={18} color={`${tokens.ink}99`} />}
              />
            </View>
          </>
        )}

        {activeStep === 2 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, textStyle]}>{t('itemImage')}</Text>
            <Text style={[styles.helperText, textStyle]}>{t('imageOptionalMessage')}</Text>
            {displayImageUri ? (
              <View>
                <Image source={{ uri: displayImageUri }} style={styles.imagePreview} resizeMode="cover" />
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
                    <ActivityIndicator size="small" color={tokens.brandPrimary} />
                    <Text style={styles.addImageButtonText}>{t('compressingImage')}</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={28} color={tokens.brandPrimary} />
                    <Text style={styles.addImageButtonText}>{t('addImage')}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeStep === 3 && (
          <>
            <ReviewSection styles={styles} title={steps[0].title} onEdit={() => handleEditStep(0)} t={t}>
              <ReviewRow styles={styles} label={t('postType')} value={typeLabel || '-'} />
              <ReviewRow
                styles={styles}
                label={t('categories')}
                value={selectedCategories.map((c) => getLocalizedLabel(c, currentLanguage)).join(', ') || '-'}
              />
              {description ? <ReviewRow styles={styles} label={t('description')} value={description} /> : null}
            </ReviewSection>

            <ReviewSection styles={styles} title={steps[1].title} onEdit={() => handleEditStep(1)} t={t}>
              <ReviewRow styles={styles} label={t('country')} value={countryLabel || '-'} />
              <ReviewRow styles={styles} label={t('city')} value={cityValue?.label || '-'} />
              <ReviewRow styles={styles} label={t('location')} value={exactLocation || '-'} />
              {exactDateText ? (
                <ReviewRow
                  styles={styles}
                  label={isFoundType ? t('exactDateFound') : t('exactDateLost')}
                  value={exactDateText}
                />
              ) : null}
            </ReviewSection>

            <ReviewSection styles={styles} title={steps[2].title} onEdit={() => handleEditStep(2)} t={t}>
              {displayImageUri ? (
                <Image source={{ uri: displayImageUri }} style={styles.reviewImage} resizeMode="cover" />
              ) : (
                <Text style={styles.reviewMuted}>{t('wizardReviewNoImage')}</Text>
              )}
            </ReviewSection>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, textStyle]}>
                {t('contactSeller')}
                <Text style={styles.requiredMark}> *</Text>
              </Text>
              <Text style={[styles.helperText, textStyle]}>
                {isFoundType ? t('contactHintFound') : t('contactHintLost')}
              </Text>
              <TextInput
                style={[styles.textInput, textStyle, fieldErrors.contact && styles.inputError]}
                placeholder={t('contactPlaceholder')}
                placeholderTextColor={`${tokens.ink}80`}
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
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {activeStep > 0 ? (
          <TouchableOpacity style={styles.backStepButton} onPress={handleBackStep}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={tokens.ink} />
            <Text style={styles.backStepButtonText}>{t('back')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={isLastStep ? handleSubmit : handleNextStep}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.submitButtonRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.submitButtonText, styles.submitButtonTextLoading]}>{t('submitting')}</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>{isLastStep ? submitButtonLabel : t('wizardNext')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {showDatePicker && Platform.OS === 'android' ? (
        <DateTimePicker value={datePickerValue()} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerSheet}>
              <DateTimePicker
                value={datePickerValue()}
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

      <SelectModal
        visible={typePickerVisible}
        onClose={() => setTypePickerVisible(false)}
        title={t('postType')}
        searchPlaceholder={t('searchCategories')}
        noResultsText={t('noSearchResults')}
        options={floptions}
        getId={(fl) => fl._id}
        getLabel={(fl) => getLocalizedLabel(fl, currentLanguage)}
        renderLeading={(fl) => {
          const isFound = fl.code === 'FOUND';
          const tone = isFound ? tokens.status.found : tokens.status.lost;
          return <Ionicons name={isFound ? 'checkmark-circle' : 'search'} size={18} color={tone.main} />;
        }}
        multiple={false}
        selectedIds={foundLost ? [foundLost] : []}
        onSelect={handleSelectFoundLost}
        isRTL={isRTL}
      />

      <SelectModal
        visible={categoryPickerVisible}
        onClose={() => setCategoryPickerVisible(false)}
        title={t('categories')}
        searchPlaceholder={t('searchCategories')}
        noResultsText={t('noSearchResults')}
        options={categories}
        getId={(cat) => cat._id}
        getLabel={(cat) => getLocalizedLabel(cat, currentLanguage)}
        renderLeading={(cat) => {
          const config = getCategoryConfig(cat.code);
          return (
            <View
              style={[
                styles.categoryIconBubble,
                { backgroundColor: isDark ? `${config.color}33` : config.backgroundColor },
              ]}
            >
              <Ionicons name={config.icon} size={14} color={config.color} />
            </View>
          );
        }}
        multiple
        selectedIds={selectedCategoryIds}
        onConfirm={handleConfirmCategories}
        maxSelected={MAX_CATEGORIES}
        confirmLabel={t('confirm')}
        isRTL={isRTL}
      />

      <SelectModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        title={t('country')}
        searchPlaceholder={t('searchCountry')}
        noResultsText={t('countryNoResults')}
        options={countries}
        getId={(c) => c._id || c.id}
        getLabel={(c) => getLocalizedLabel(c, currentLanguage)}
        renderLeading={(c) => <Text style={styles.countryFlagText}>{c.flag || '🌍'}</Text>}
        multiple={false}
        selectedIds={countryId ? [countryId] : []}
        onSelect={handleSelectCountry}
        isRTL={isRTL}
      />

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
    </KeyboardAvoidingView>
  );
};

// A tappable "input" that opens one of the SelectModal/CityPickerModal
// dropdowns - shared shell for Type/Country/City/Date so they all read as
// the same control despite triggering different modals.
const FieldButton = ({ styles, textStyle, label, placeholder, error, disabled, onPress, leading, tone, badge }) => (
  <TouchableOpacity
    style={[
      styles.selectButton,
      tone && { backgroundColor: tone.bg, borderColor: tone.main },
      error && styles.selectButtonError,
      disabled && styles.selectButtonDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    {leading ? <View style={styles.selectButtonLeading}>{leading}</View> : null}
    <Text
      style={[
        styles.selectButtonText,
        !label && styles.selectButtonPlaceholder,
        tone && { color: tone.main, fontFamily: styles._fontSemiBold },
        textStyle,
      ]}
      numberOfLines={1}
    >
      {label || placeholder}
    </Text>
    {badge ? (
      <View style={styles.selectButtonBadge}>
        <Text style={styles.selectButtonBadgeText}>{badge}</Text>
      </View>
    ) : null}
    <Ionicons name="chevron-down" size={16} color={styles._chevronColor} />
  </TouchableOpacity>
);

const ReviewSection = ({ styles, title, onEdit, t, children }) => (
  <View style={styles.reviewSection}>
    <View style={styles.reviewSectionHeader}>
      <Text style={styles.reviewSectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onEdit} style={styles.reviewEditButton} hitSlop={6}>
        <Ionicons name="create-outline" size={14} color={styles._brandColor} />
        <Text style={styles.reviewEditText}>{t('wizardEdit')}</Text>
      </TouchableOpacity>
    </View>
    {children}
  </View>
);

const ReviewRow = ({ styles, label, value }) => (
  <View style={styles.reviewRow}>
    <Text style={styles.reviewRowLabel}>{label}</Text>
    <Text style={styles.reviewRowValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const createStyles = (tokens, legacy, isDark) => {
  const base = StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: tokens.surfaceBase,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: tokens.surfaceBase,
    },
    progressBlock: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
      backgroundColor: tokens.surfaceRaised,
      borderBottomWidth: 1,
      borderBottomColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    progressRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 8,
    },
    progressSegment: {
      flex: 1,
      height: 5,
      borderRadius: radiusTokens.sm,
      backgroundColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    progressSegmentActive: {
      backgroundColor: tokens.brandPrimary,
    },
    progressLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
      color: `${tokens.ink}99`,
    },
    content: {
      padding: 16,
      paddingBottom: 24,
    },
    stepHeader: {
      marginBottom: 16,
    },
    stepTitle: {
      fontFamily: fontFamilies.displayRegular,
      fontWeight: '700',
      fontSize: 22,
      color: tokens.brandPrimary,
    },
    stepSubtitle: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}99`,
      marginTop: 2,
    },
    section: {
      marginTop: 18,
    },
    sectionLabel: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 14,
      color: tokens.ink,
      marginBottom: 8,
    },
    requiredMark: {
      color: legacy.danger,
    },
    textRTL: {
      textAlign: 'right',
    },
    helperText: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      color: `${tokens.ink}80`,
      marginBottom: 8,
      marginTop: -4,
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      paddingHorizontal: 14,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '26' : '1A'}`,
    },
    selectButtonError: {
      borderColor: legacy.danger,
    },
    selectButtonDisabled: {
      opacity: 0.5,
    },
    selectButtonLeading: {
      marginEnd: 10,
    },
    selectButtonText: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
    },
    selectButtonPlaceholder: {
      color: `${tokens.ink}80`,
    },
    selectButtonBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 5,
      marginEnd: 8,
    },
    selectButtonBadgeText: {
      color: '#fff',
      fontSize: 11,
      fontFamily: fontFamilies.bodySemiBold,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
      gap: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      maxWidth: '100%',
    },
    categoryChipIcon: {
      marginEnd: 5,
    },
    categoryChipText: {
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 13,
      marginEnd: 6,
      maxWidth: 140,
    },
    categoryIconBubble: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    countryFlagText: {
      fontSize: 20,
    },
    textInput: {
      height: 50,
      backgroundColor: tokens.surfaceRaised,
      borderRadius: radiusTokens.md,
      paddingHorizontal: 14,
      fontFamily: fontFamilies.body,
      fontSize: 15,
      color: tokens.ink,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '26' : '1A'}`,
    },
    textArea: {
      height: 110,
      paddingTop: 12,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: legacy.danger,
    },
    fieldError: {
      color: legacy.danger,
      fontFamily: fontFamilies.body,
      fontSize: 12,
      marginTop: 6,
    },
    imagePreview: {
      width: '100%',
      height: 220,
      borderRadius: radiusTokens.lg,
      backgroundColor: `${tokens.ink}0F`,
    },
    imageButtonsRow: {
      flexDirection: 'row',
      marginTop: 10,
      gap: 10,
    },
    imageSecondaryButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: tokens.brandPrimary,
    },
    imageSecondaryButtonText: {
      color: tokens.brandPrimary,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
    },
    addImageButton: {
      height: 130,
      borderRadius: radiusTokens.lg,
      borderWidth: 1.5,
      borderColor: tokens.brandPrimary,
      borderStyle: 'dashed',
      backgroundColor: isDark ? `${tokens.brandPrimary}14` : `${tokens.brandPrimary}0A`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addImageButtonText: {
      color: tokens.brandPrimary,
      fontFamily: fontFamilies.bodySemiBold,
      marginTop: 6,
    },
    reviewSection: {
      marginTop: 18,
      padding: 14,
      borderRadius: radiusTokens.lg,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
      backgroundColor: isDark ? `${tokens.ink}0A` : `${tokens.ink}05`,
    },
    reviewSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    reviewSectionTitle: {
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
      color: tokens.brandPrimary,
    },
    reviewEditButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radiusTokens.sm,
    },
    reviewEditText: {
      color: tokens.brandPrimary,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 12,
    },
    reviewRow: {
      flexDirection: 'row',
      marginBottom: 6,
      gap: 8,
    },
    reviewRowLabel: {
      width: 100,
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 12,
      color: `${tokens.ink}99`,
    },
    reviewRowValue: {
      flex: 1,
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: tokens.ink,
    },
    reviewImage: {
      width: 88,
      height: 88,
      borderRadius: radiusTokens.md,
      backgroundColor: `${tokens.ink}0F`,
    },
    reviewMuted: {
      fontFamily: fontFamilies.body,
      fontSize: 13,
      color: `${tokens.ink}80`,
    },
    errorBanner: {
      backgroundColor: legacy.dangerBackground,
      borderRadius: radiusTokens.md,
      padding: 14,
      marginBottom: 16,
    },
    errorBannerText: {
      color: legacy.danger,
      fontFamily: fontFamilies.body,
      fontSize: 14,
      textAlign: 'center',
    },
    warningBanner: {
      backgroundColor: legacy.warningBackground,
      borderRadius: radiusTokens.md,
      padding: 12,
      marginBottom: 10,
    },
    warningBannerText: {
      color: legacy.warning,
      fontFamily: fontFamilies.bodyMedium,
      fontSize: 12,
    },
    retryButton: {
      marginTop: 10,
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: radiusTokens.md,
      backgroundColor: legacy.danger,
    },
    retryButtonText: {
      color: '#fff',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 13,
    },
    footer: {
      flexDirection: 'row',
      gap: 10,
      padding: 16,
      backgroundColor: tokens.surfaceRaised,
      borderTopWidth: 1,
      borderTopColor: `${tokens.ink}${isDark ? '1F' : '14'}`,
    },
    backStepButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      borderRadius: radiusTokens.md,
      borderWidth: 1,
      borderColor: `${tokens.ink}${isDark ? '26' : '1A'}`,
      justifyContent: 'center',
    },
    backStepButtonText: {
      color: tokens.ink,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 15,
    },
    submitButton: {
      flex: 1,
      height: 52,
      borderRadius: radiusTokens.md,
      backgroundColor: tokens.brandPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: '#fff',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
    },
    submitButtonRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    submitButtonTextLoading: {
      marginStart: 10,
    },
    datePickerOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    datePickerSheet: {
      backgroundColor: tokens.surfaceRaised,
      borderTopLeftRadius: radiusTokens.xl,
      borderTopRightRadius: radiusTokens.xl,
      paddingBottom: 20,
    },
    datePickerDoneButton: {
      alignSelf: 'center',
      paddingHorizontal: 24,
      paddingVertical: 10,
      marginTop: 4,
    },
    datePickerDoneText: {
      color: tokens.brandPrimary,
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 16,
    },
  });

  // Plain (non-StyleSheet) values that subcomponents read directly, since
  // they're colors/strings rather than style objects.
  base._chevronColor = `${tokens.ink}80`;
  base._brandColor = tokens.brandPrimary;
  base._fontSemiBold = fontFamilies.bodySemiBold;

  return base;
};

export default PostForm;
