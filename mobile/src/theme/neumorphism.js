/**
 * Neumorphic ("soft UI") surface tokens.
 *
 * Neumorphism only works when an element is painted in the SAME tone as the
 * page behind it: the shape is read entirely from a light highlight on one
 * corner and a matching shade on the opposite one, never from a fill contrast,
 * a border, or a drop shadow. So every value here is derived from
 * `colorTokens[mode].surfaceBase` - the mobile scroll background - and an
 * element using them must sit directly on that background (or on another
 * neumorphic face, which is the same tone again).
 *
 * Kept out of theme/tokens.js on purpose: that file mirrors the web app's
 * client/src/designTokens.js 1:1, and neumorphism is a mobile-only treatment
 * with no web counterpart. It reads `colorTokens` rather than restating any
 * color, so a base-tone change on the web side still flows through.
 *
 * React Native has no multi-shadow style, so a face is built from three
 * layers (see components/NeumorphicSurface.js): an outer view carrying the
 * shade, an inner view carrying the highlight, and a two-stop gradient face
 * that bevels the fill itself. The gradient is what carries the effect on
 * Android, where only `elevation` renders (a single, downward, dark shadow) -
 * `shadowLight` deliberately omits `elevation` so it no-ops there instead of
 * stacking a second dark shadow.
 *
 * The light source is fixed at the physical top-left in both LTR and RTL: it
 * is a light, not a layout edge, and neither `shadowOffset` nor a gradient's
 * start/end are mirrored by native RTL, so it stays put on its own.
 */

import { colorTokens } from './tokens';

const lightNeumorphic = {
  base: colorTokens.light.surfaceBase,
  // Top-left -> bottom-right, i.e. lit corner first. The raised face runs
  // light -> dark; the pressed face is the same pair reversed, which reads as
  // a dip since the highlight lands where the shade was.
  raisedFace: ['#FFFFFF', '#EBEEF5'],
  pressedFace: ['#E6E9F1', '#FCFDFF'],
  shadowDark: {
    shadowColor: '#A3AABF',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 9,
    elevation: 6,
  },
  shadowLight: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 7,
  },
};

const darkNeumorphic = {
  base: colorTokens.dark.surfaceBase,
  raisedFace: ['#1A1F28', '#0A0D12'],
  pressedFace: ['#080A0E', '#1B212B'],
  shadowDark: {
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.75,
    shadowRadius: 8,
    elevation: 6,
  },
  shadowLight: {
    shadowColor: '#39404F',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
};

export const getNeumorphic = (isDark) => (isDark ? darkNeumorphic : lightNeumorphic);
