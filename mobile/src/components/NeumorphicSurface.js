/**
 * A neumorphic ("soft UI") face: an element painted in the page's own base
 * tone whose shape reads only from a top-left highlight and a bottom-right
 * shade. See theme/neumorphism.js for the palette and why it is built this way.
 *
 * Three layers, because React Native takes one shadow per view:
 *   1. outer view  - the bottom-right shade (and the Android `elevation`)
 *   2. inner view  - the top-left highlight (iOS only; no elevation, so it
 *                    no-ops on Android instead of stacking a second dark drop)
 *   3. gradient    - the bevelled fill, which is what carries the effect on
 *                    Android where the highlight cannot render as a shadow
 *
 * Sizing/padding go on `contentStyle` (the face), not `style` (the outer box):
 * the two outer layers then wrap the face instead of needing a definite size
 * of their own, so the same component works for a fixed-size circle and for a
 * full-width, content-height panel. `style` is for margins/positioning.
 *
 * `pressed` swaps the raised face for the reversed gradient and drops both
 * shadows, which reads as the element sinking into the surface - the standard
 * neumorphic press affordance, and the only state change these controls have
 * (there is no fill to darken).
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getNeumorphic } from '../theme/neumorphism';

// Physical top-left -> bottom-right. Not mirrored in RTL on purpose: the
// light source is fixed, same as the shadow offsets it has to agree with.
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

const NeumorphicSurface = ({ isDark, radius, pressed = false, style, contentStyle, children }) => {
  const neumorphic = getNeumorphic(isDark);

  return (
    <View
      style={[
        { borderRadius: radius, backgroundColor: neumorphic.base },
        pressed ? null : neumorphic.shadowDark,
        style,
      ]}
    >
      <View
        style={[
          styles.innerLayer,
          { borderRadius: radius, backgroundColor: neumorphic.base },
          pressed ? null : neumorphic.shadowLight,
        ]}
      >
        <LinearGradient
          colors={pressed ? neumorphic.pressedFace : neumorphic.raisedFace}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={[{ borderRadius: radius }, contentStyle]}
        >
          {children}
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // No alignSelf on any layer: each inherits its parent's cross-axis sizing,
  // so a full-width parent stretches the whole stack down to the face while a
  // content-sized face (a circle) keeps sizing the layers around itself. An
  // explicit `stretch` here would blow the circle out to its column width.
  innerLayer: {
    overflow: 'hidden',
  },
});

export default NeumorphicSurface;
