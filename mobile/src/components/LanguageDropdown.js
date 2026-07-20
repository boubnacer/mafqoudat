/**
 * Language Dropdown Component for Login Screen
 * A dropdown/picker style language selector
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translations';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LanguageDropdown = ({ style }) => {
  const { currentLanguage, setLanguage } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const buttonRef = useRef(null);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleLanguageChange = async (languageCode) => {
    try {
      const success = await setLanguage(languageCode);
      if (success) {
        setDropdownVisible(false);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  // Measure button position when it becomes visible
  const onButtonLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setButtonLayout({ x, y, width, height });
  };

  return (
    <>
      <View 
        style={[styles.container, style]} 
        ref={buttonRef}
        onLayout={onButtonLayout}
      >
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownVisible(!dropdownVisible)}
          activeOpacity={0.7}
        >
          <Text style={styles.flag}>{currentLang?.flag || '🌐'}</Text>
          <Text style={styles.languageText}>
            {currentLang?.nativeName || currentLanguage.toUpperCase()}
          </Text>
          <Text style={styles.arrow}>{dropdownVisible ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for dropdown overlay */}
      <Modal
        transparent={true}
        visible={dropdownVisible}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback 
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalOverlay}>
            {/* Dropdown positioned relative to button */}
            <View 
              style={[
                styles.dropdownListContainer,
                {
                  top: buttonLayout.y + buttonLayout.height + 4,
                  right: SCREEN_WIDTH - buttonLayout.x - buttonLayout.width,
                }
              ]}
              onStartShouldSetResponder={() => true}
              onResponderGrant={() => {
                // Prevent overlay from closing when touching dropdown
              }}
            >
              <View style={styles.dropdownList}>
                {languages.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.dropdownItem,
                      currentLanguage === lang.code && styles.dropdownItemActive
                    ]}
                    onPress={() => handleLanguageChange(lang.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.itemFlag}>{lang.flag}</Text>
                    <Text
                      style={[
                        styles.itemText,
                        currentLanguage === lang.code && styles.itemTextActive
                      ]}
                    >
                      {lang.nativeName}
                    </Text>
                    {currentLanguage === lang.code && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
  },
  flag: {
    fontSize: 18,
    marginEnd: 8,
  },
  languageText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  arrow: {
    color: colors.textSecondary,
    fontSize: 10,
    marginStart: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownListContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  dropdownList: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
    minWidth: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: colors.primarySoft,
  },
  itemFlag: {
    fontSize: 20,
    marginEnd: 12,
  },
  itemText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  itemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default LanguageDropdown;
