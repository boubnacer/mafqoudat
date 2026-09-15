/**
 * Language Dropdown Component for Login Screen
 * A dropdown/picker style language selector
 */

import React, { useState, useRef, useMemo } from 'react';
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
import { logical } from '../utils/rtl';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LanguageDropdown = ({ style }) => {
  const { currentLanguage, setLanguage } = useLanguage();
  const theme = useTheme();
  const isRTL = currentLanguage === 'ar';
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);
  const { t } = useTranslation();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const buttonRef = useRef(null);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const toggleDropdown = () => {
    if (dropdownVisible) {
      setDropdownVisible(false);
      return;
    }
    // measureInWindow, not onLayout: the button's onLayout gives coordinates
    // relative to its own parent, but this dropdown renders inside a Modal,
    // which mounts at the root of the app with its own screen-absolute
    // coordinate system - positioning against the parent-relative value
    // placed the menu wrong anywhere this component sits inside another
    // container with its own offset (e.g. a header with padding).
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setButtonLayout({ x, y, width, height });
      setDropdownVisible(true);
    });
  };

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

  return (
    <>
      <View
        style={[styles.container, style]}
        ref={buttonRef}
      >
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={toggleDropdown}
          activeOpacity={0.7}
          accessibilityLabel={currentLang?.nativeName || currentLanguage.toUpperCase()}
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

const createStyles = ({ colors, spacing, radii, fontSizes }, isRTL) => StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 150,
    height: 42,
  },
  flag: {
    fontSize: fontSizes.md,
    ...logical(isRTL, { marginEnd: spacing.sm }),
  },
  languageText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  arrow: {
    color: colors.textSecondary,
    fontSize: 10,
    ...logical(isRTL, { marginStart: spacing.sm }),
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
    ...logical(isRTL, { marginEnd: 12 }),
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
