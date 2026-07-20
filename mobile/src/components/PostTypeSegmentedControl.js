/**
 * All | Lost | Found segmented control for PostsListScreen. Reads/writes the
 * SAME selectedFl state PostFilterSheet's post-type chips use (passed in via
 * props) - this component holds no state of its own, so the two surfaces can
 * never drift out of sync.
 *
 * Labels and accent colors come from the floptions data (each option carries
 * multilingual `labels` and a `color` field from the backend FoundLost model)
 * rather than being hardcoded here. "All" isn't a floption, so it falls back
 * to the theme's primary color and a translated label.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../utils/translations';
import { getLocalizedLabel } from '../context/ReferenceDataContext';

const PostTypeSegmentedControl = ({ floptions, selectedFl, onSelectFl }) => {
  const { colors, spacing, radii, fontSizes } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  // Looked up by code (rather than mapping floptions in whatever order the API
  // returns) so the segment order is always All -> Lost -> Found, regardless
  // of backend ordering. RN mirrors this row automatically under Arabic RTL.
  const lostOption = floptions.find((fl) => fl.code === 'LOST');
  const foundOption = floptions.find((fl) => fl.code === 'FOUND');

  const segments = [
    { id: '', label: t('all'), color: colors.primary },
    lostOption && { id: lostOption._id, label: getLocalizedLabel(lostOption, currentLanguage), color: lostOption.color },
    foundOption && { id: foundOption._id, label: getLocalizedLabel(foundOption, currentLanguage), color: foundOption.color },
  ].filter(Boolean);

  const styles = createStyles({ colors, spacing, radii, fontSizes });

  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const isSelected = selectedFl === segment.id;
        return (
          <TouchableOpacity
            key={segment.id || 'all'}
            style={[styles.segment, isSelected && { backgroundColor: segment.color }]}
            onPress={() => onSelectFl(segment.id)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.segmentText, { color: isSelected ? colors.primaryText : segment.color }]}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = ({ colors, spacing, radii, fontSizes }) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.inputBackground,
      borderRadius: radii.full,
      padding: spacing.xs,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
    },
    segment: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentText: {
      fontSize: fontSizes.sm,
      fontWeight: '700',
    },
  });

export default PostTypeSegmentedControl;
