/**
 * Language Switcher Component
 * Allows users to switch between en, fr, ar
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

const LanguageSwitcher = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation(currentLanguage);
  const [modalVisible, setModalVisible] = useState(false);

  const handleLanguageChange = async (languageCode) => {
    const success = await setLanguage(languageCode);
    if (success) {
      setModalVisible(false);
      // Note: On Android, I18nManager changes require app restart
      // You might want to show a message to restart the app
    }
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>
          {currentLang?.nativeName || currentLanguage.toUpperCase()}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
            
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    currentLanguage === item.code && styles.languageItemActive
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      currentLanguage === item.code && styles.languageTextActive
                    ]}
                  >
                    {item.nativeName}
                  </Text>
                  {currentLanguage === item.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 60,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  languageItemActive: {
    backgroundColor: '#2196F3',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
  },
  languageTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default LanguageSwitcher;

