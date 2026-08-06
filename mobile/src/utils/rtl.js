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

import { I18nManager } from 'react-native';

// The direction the native layer is already laying out for. Read once at module
// load on purpose: forceRTL() never changes it for the current JS bundle.
export const NATIVE_RTL = I18nManager.isRTL;

// True only when the language's direction differs from what native is already
// mirroring - the one case where styles have to compensate by hand.
export const needsDirectionFlip = (isRTL) => Boolean(isRTL) !== NATIVE_RTL;

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
