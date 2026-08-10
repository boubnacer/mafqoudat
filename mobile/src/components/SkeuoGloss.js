/**
 * SkeuoGloss
 * The reflection layer of a skeuomorphic surface: an absolutely-positioned,
 * non-interactive gradient that turns a flat token-colored box into a lit
 * object. Render it as the FIRST child of the surface it belongs to, so the
 * real content draws on top of it.
 *
 *   <View style={styles.plate}>
 *     <SkeuoGloss isDark={isDark} radius={radiusTokens.lg} />
 *     ...content
 *   </View>
 *
 * It clips itself (`overflow: 'hidden'`) instead of asking the parent to clip,
 * because a parent with `overflow: 'hidden'` drops its own iOS drop shadow -
 * and the shadow is half of what makes the object read as raised.
 *
 * Variants (see theme/skeuomorph.js for the recipes):
 *  - `plate` - convex card/panel: bright top half, shaded bottom half.
 *  - `dome`  - small round or square tile: highlight wrapping further down.
 *  - `glass` - one soft reflection across the top only, for surfaces showing
 *              a photo underneath that a full gloss would fog.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DOME_GLOSS_LOCATIONS,
  GLASS_SHEEN_LOCATIONS,
  GLOSS_LOCATIONS,
  domeGlossColors,
  glassSheenColors,
  glossColors,
} from '../theme/skeuomorph';

const VARIANTS = {
  plate: (isDark) => ({ colors: glossColors(isDark), locations: GLOSS_LOCATIONS }),
  dome: (isDark) => ({ colors: domeGlossColors(isDark), locations: DOME_GLOSS_LOCATIONS }),
  glass: () => ({ colors: glassSheenColors(), locations: GLASS_SHEEN_LOCATIONS }),
};

const SkeuoGloss = ({ isDark, radius = 0, variant = 'plate', style }) => {
  const { colors, locations } = (VARIANTS[variant] || VARIANTS.plate)(isDark);

  return (
    <View
      pointerEvents="none"
      // One pixel tighter than the surface's own radius: absolute children are
      // laid out inside the border box, so matching the outer radius exactly
      // would let the gradient corners spill over a beveled rim.
      style={[StyleSheet.absoluteFillObject, { borderRadius: Math.max(radius - 1, 0), overflow: 'hidden' }, style]}
    >
      <LinearGradient colors={colors} locations={locations} style={StyleSheet.absoluteFill} />
    </View>
  );
};

export default SkeuoGloss;
