import { Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { colorTokens, fontFamilies } from '../theme/tokens';

/**
 * The gradient headline the posts-list card uses for the city, mirroring
 * client/src/features/posts/PostsList/Post.js.
 *
 * Two things it does not do, both on purpose:
 *
 *  - It does not take a pair of colors. The gradient is derived from
 *    `brandPrimary` the same way the web card derives it (MUI's
 *    `lighten(brandPrimary, 0.45)`), so it follows the token into dark mode
 *    instead of being a second, hand-picked palette living beside it.
 *  - It does not draw the text as SVG. This stays real RN text - shaped by the
 *    platform, so Arabic joins correctly, `numberOfLines` truncates, and the
 *    Cairo family loaded through expo-font applies - with the gradient painted
 *    behind it and clipped to the glyphs by a mask.
 *
 * The mask itself is optional: if the native masked-view module is missing
 * (an older client, a build that dropped it), the heading falls back to solid
 * `brandPrimary` rather than crashing. A heading in the brand color is a
 * smaller loss than a screen that will not render.
 */

let MaskedView = null;
try {
  // eslint-disable-next-line global-require
  MaskedView = require('@react-native-masked-view/masked-view').default;
} catch (error) {
  MaskedView = null;
}

/** Mixes a hex color toward white - RN has no equivalent of MUI's lighten(). */
const lighten = (hex, amount) => {
  const value = hex.replace('#', '');
  const channel = (index) => {
    const start = parseInt(value.slice(index * 2, index * 2 + 2), 16);
    return Math.round(start + (255 - start) * amount)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(1)}${channel(2)}`;
};

const GradientHeading = ({ text, fontSize = 26, numberOfLines = 2, style }) => {
  const { isDark } = useTheme();
  const tokens = isDark ? colorTokens.dark : colorTokens.light;

  const textStyle = [
    styles.text,
    { fontSize, lineHeight: Math.round(fontSize * 1.15) },
    style,
  ];

  if (!MaskedView) {
    return (
      <Text style={[...textStyle, { color: tokens.brandPrimary }]} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  return (
    <MaskedView
      maskElement={
        <View style={styles.maskWrap}>
          <Text style={[...textStyle, styles.maskText]} numberOfLines={numberOfLines}>
            {text}
          </Text>
        </View>
      }
    >
      <LinearGradient
        colors={[tokens.brandPrimary, lighten(tokens.brandPrimary, 0.45)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* The gradient sizes itself from a transparent copy of the same text,
            so the mask and the fill always describe the same box. */}
        <Text style={[...textStyle, styles.spacerText]} numberOfLines={numberOfLines}>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamilies.display,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  maskWrap: {
    backgroundColor: 'transparent',
  },
  maskText: {
    color: '#000000',
  },
  spacerText: {
    opacity: 0,
  },
});

export default GradientHeading;
