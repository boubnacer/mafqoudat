/**
 * Soft blurred color glow tucked into a dashboard panel's corner - mobile
 * twin of the `radial-gradient(circle, alpha(color, x) 0%, alpha(color, 0)
 * 70%) + filter: blur(20px)` blobs web's LeftSide.jsx/QuickActions.jsx/
 * RecentSection.jsx/HelpSupportSection.jsx/Dash.js tuck into their own
 * panels' corners (see CLAUDE.md's "glass-blob family"). RN has neither a
 * CSS blur filter nor a radial-gradient background, so a `react-native-svg`
 * RadialGradient stands in for both at once - it already fades smoothly to
 * transparent by 70% of its radius, which is most of what the web blur was
 * softening, and needs no extra native module.
 *
 * Purely decorative: `pointerEvents="none"` so it never intercepts a tap
 * meant for the panel underneath it, and the caller positions it with
 * `top`/`bottom` + `start`/`end` (run through `logical()` from
 * `utils/rtl.js`) exactly like every other corner-anchored style in this
 * app - never `left`/`right`.
 */

import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const GlowBlob = ({ color, opacity = 0.2, size = 220, style }) => {
  // react-native-svg resolves `url(#id)` literally, and React's useId()
  // includes `:` (e.g. ":r0:") - safe in the DOM but not guaranteed inside
  // an SVG url() reference, so it's stripped down to alphanumerics.
  const gradientId = `glowBlob${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="70%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
};

export default GlowBlob;
