/**
 * Square thumbnail of the *other* listing in a match, with its Found/Lost tone
 * strip along the bottom edge.
 *
 * Shared by the notifications inbox and the post-detail matches section, since
 * both ask the reader the same question - "is this yours?" - and the photo is
 * the fastest way for them to answer it.
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../utils/translations';
import { API_BASE_URL } from '../../config/api';
import { colorTokens, radiusTokens, fontFamilies } from '../../theme/tokens';
import { logical, row } from '../../utils/rtl';

// Same rule the post screens use: the API returns an absolute Cloudinary URL
// for anything uploaded since Cloudinary was adopted, and a server-relative
// path for older rows.
const getImageUri = (image) => (image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : null);

const getElevation = (isDark) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: isDark ? 0.4 : 0.06,
  shadowRadius: 2,
  elevation: 2,
});

const MatchThumbnail = ({ post, size = 76 }) => {
  const { isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;
  const isRTL = currentLanguage === 'ar';

  const isFound = String(post?.foundLostCode).toUpperCase() === 'FOUND';
  const tone = isFound ? tokens.status.found : tokens.status.lost;
  const uri = getImageUri(post?.image);
  const styles = createStyles({ tokens, isDark, isRTL, size });

  return (
    <View style={styles.wrap}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={Math.round(size / 3.4)} color={`${tokens.ink}40`} />
        </View>
      )}

      <View style={[styles.statusStrip, { backgroundColor: tone.main }]}>
        <Ionicons
          name={isFound ? 'checkmark-circle-outline' : 'search-outline'}
          size={10}
          color="#FFFFFF"
          style={styles.statusStripIcon}
        />
        <Text style={styles.statusStripText} numberOfLines={1}>
          {isFound ? t('found') : t('lost')}
        </Text>
      </View>
    </View>
  );
};

// Direction-dependent styles go through the helpers in utils/rtl.js
// (row()/logical()) - see that file's note on why a bare isRTL ternary breaks
// once native mirroring is active.
const createStyles = ({ tokens, isDark, isRTL, size }) =>
  StyleSheet.create({
    wrap: {
      width: size,
      height: size,
      borderRadius: radiusTokens.md,
      overflow: 'hidden',
      backgroundColor: `${tokens.ink}0F`,
      ...getElevation(isDark),
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusStrip: {
      position: 'absolute',
      bottom: 0,
      // start/end rather than left/right so the strip spans the full width in
      // both directions without a manual flip.
      ...logical(isRTL, { start: 0, end: 0 }),
      flexDirection: row(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 2,
    },
    statusStripIcon: {
      ...logical(isRTL, { marginEnd: 3 }),
    },
    statusStripText: {
      color: '#FFFFFF',
      fontFamily: fontFamilies.bodySemiBold,
      fontSize: 10,
      letterSpacing: 0.2,
    },
  });

export default MatchThumbnail;
