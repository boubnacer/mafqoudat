/**
 * RTL layout helpers.
 *
 * Two different booleans matter for right-to-left support, and conflating them
 * is what left every screen except HomeScreen looking unmirrored in a release
 * build:
 *
 *  - "the language wants RTL" (`isRTL`, i.e. currentLanguage === 'ar') drives
 *    *content* decisions: textAlign, writingDirection, and which directional
 *    glyph to show (arrow-back vs arrow-forward). Icons and text alignment are
 *    never auto-mirrored, so these can always use `isRTL` directly.
 *
 *  - `I18nManager.isRTL` ("native is already mirroring") drives *layout*. When
 *    it is true React Native mirrors layout itself: a plain `flexDirection:
 *    'row'` already renders right-to-left, `start`/`end` already resolve to the
 *    correct edges, and even physical `left`/`right`/`marginLeft`/... are
 *    swapped (I18nManager.doLeftAndRightSwapInRTL defaults to true).
 *
 * The catch is that the two can disagree. I18nManager.isRTL is a constant for
 * the lifetime of the JS bundle (it comes from constants captured at load), so
 * immediately after a live language switch the language wants RTL while native
 * is still laying out LTR (or vice versa).
 *
 * What keeps `NATIVE_RTL` trustworthy is that LanguageContext writes the native
 * RTL preferences ONLY as part of relaunching the app. That is deliberate and
 * load-bearing: the preferences are not a "next launch" setting, they are re-read
 * by FabricUIManager.updateRootLayoutSpecs on every root re-measure, so writing
 * them mid-session flips the live layout at an unpredictable moment and silently
 * invalidates every helper in this file. See the long note in LanguageContext.
 *
 * Writing `flexDirection: isRTL ? 'row-reverse' : 'row'` compensates for that
 * transient disagreement - but it does so unconditionally. Once the app is
 * relaunched and native mirroring IS active, it cancels the native mirroring
 * back out and the row renders left-to-right again. That is why a release APK
 * opened in Arabic looked completely unfixed while Expo Go (where forceRTL had
 * never taken effect) looked merely half-fixed.
 *
 * The helpers below compensate only when the two actually disagree, so the same
 * styles are correct both mid-session and after a relaunch.
 */

import React, { useCallback, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';

// The direction the native layer is already laying out for. Read once at module
// load on purpose: forceRTL() never changes it for the current JS bundle.
export const NATIVE_RTL = I18nManager.isRTL;

// True only when the language's direction differs from what native is already
// mirroring - the one case where styles have to compensate by hand.
export const needsDirectionFlip = (isRTL) => Boolean(isRTL) !== NATIVE_RTL;

const probeStyles = StyleSheet.create({
  // Absolutely positioned and fully transparent, so it takes part in layout
  // (which is the whole point - it has to be laid out to be measured) without
  // occupying space or being visible. 1x1 children, because Android skips
  // onLayout for zero-sized views.
  probe: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 1,
    flexDirection: 'row',
    opacity: 0,
  },
  probeCell: {
    width: 1,
    height: 1,
  },
});

/**
 * The direction the view tree is REALLY laid out in, measured instead of asked
 * for.
 *
 * NATIVE_RTL above is what the app *believes* - I18nManager.isRTL, i.e. the
 * forceRTL preference that was persisted before the last relaunch. It is only
 * as good as that relaunch: when the app comes back through a JS-level reload
 * (Updates.reloadAsync / RNRestart) the existing surface is not re-measured, so
 * its root keeps the layout direction it was created with while JS reads the
 * freshly persisted - and now opposite - preference. I18nManager.isRTL then
 * reports RTL for a tree that is still laid out LTR, and every helper above
 * compensates in exactly the wrong direction: rows reverse, `start`/`end` land
 * on the far edge, `left`/`right` stop being swapped.
 *
 * A one-frame probe settles it with no guessing: two children in a
 * `flexDirection: 'row'` box, and whether the first one lands at x=0 or x=1 IS
 * the layout direction, whatever any constant claims.
 *
 * Returns `[layoutIsRTL, probe]`. Render `probe` anywhere inside the subtree
 * being measured; it renders nothing visible. Until the first layout lands the
 * value is NATIVE_RTL, which is right whenever the two agree.
 */
export const useMeasuredLayoutDirection = () => {
  const [layoutIsRTL, setLayoutIsRTL] = useState(NATIVE_RTL);

  const handleProbeLayout = useCallback((event) => {
    const measured = event.nativeEvent.layout.x > 0;
    setLayoutIsRTL((previous) => (previous === measured ? previous : measured));
  }, []);

  const probe = (
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={probeStyles.probe}>
      <View style={probeStyles.probeCell} onLayout={handleProbeLayout} />
      <View style={probeStyles.probeCell} />
    </View>
  );

  return [layoutIsRTL, probe];
};

/**
 * flexDirection for a row whose children should read start -> end in the
 * current language. Use instead of `isRTL ? 'row-reverse' : 'row'`.
 */
export const row = (isRTL) => (needsDirectionFlip(isRTL) ? 'row-reverse' : 'row');

/**
 * flexDirection for a row that should read end -> start (a deliberately
 * reversed row), staying reversed relative to the language's own direction.
 */
export const rowReverse = (isRTL) => (needsDirectionFlip(isRTL) ? 'row' : 'row-reverse');

// alignItems/alignSelf/textAlign-adjacent cross-axis values are resolved
// against the layout direction too, so they need the same compensation.
export const alignStart = (isRTL) => (needsDirectionFlip(isRTL) ? 'flex-end' : 'flex-start');
export const alignEnd = (isRTL) => (needsDirectionFlip(isRTL) ? 'flex-start' : 'flex-end');

// Logical style props resolve against NATIVE_RTL. When the language disagrees
// with native we deliberately ask for the opposite edge, which lands the value
// on the visually correct side.
const FLIPPED_PROPS = {
  start: 'end',
  end: 'start',
  marginStart: 'marginEnd',
  marginEnd: 'marginStart',
  paddingStart: 'paddingEnd',
  paddingEnd: 'paddingStart',
  borderStartWidth: 'borderEndWidth',
  borderEndWidth: 'borderStartWidth',
  borderStartColor: 'borderEndColor',
  borderEndColor: 'borderStartColor',
  borderTopStartRadius: 'borderTopEndRadius',
  borderTopEndRadius: 'borderTopStartRadius',
  borderBottomStartRadius: 'borderBottomEndRadius',
  borderBottomEndRadius: 'borderBottomStartRadius',
};

/**
 * Spread-in helper for direction-dependent edge styles, written in logical
 * terms (start/end, never left/right):
 *
 *   ...logical(isRTL, { start: 10 })
 *   ...logical(isRTL, { paddingStart: 40, paddingEnd: 16 })
 *   ...logical(isRTL, { borderStartWidth: 6, borderStartColor: tone.main })
 *
 * Returns the object untouched when native is already mirroring correctly, and
 * with start/end swapped when it isn't.
 */
export const logical = (isRTL, style) => {
  if (!needsDirectionFlip(isRTL)) return style;
  const flipped = {};
  Object.keys(style).forEach((key) => {
    flipped[FLIPPED_PROPS[key] || key] = style[key];
  });
  return flipped;
};
