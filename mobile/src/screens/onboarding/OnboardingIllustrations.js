/**
 * Per-slide onboarding illustrations - a small animated mascot (a blue rounded
 * blob character) plus a per-slide prop, ported from the "Mafqoudat Onboarding,
 * reimagined" HTML/CSS/SVG prototype. Built on react-native-svg + plain RN
 * Animated (no reanimated/lottie), matching OnboardingScreen's existing
 * dependency footprint. Slide 5 (secure/country) keeps its own separate
 * illustration below and was intentionally left untouched by this pass.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Rect, Defs, LinearGradient, Stop, SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_CONFIG } from '../../config/categories';
import { colorTokens } from '../../theme/tokens';
import { WORLD_MAP_XML } from './worldMapXml';

// The mascot/icon artwork below is a direct port of the app's own brand blue
// (matches maficonSVG.svg, the app icon mark) - intentionally fixed in both
// themes rather than sourced from theme.custom/colorTokens, since it's a
// literal recreation of that static brand asset, not a themed surface.
const BRAND_BLUE = '#3498DB';

const AnimatedG = Animated.createAnimatedComponent(G);

// ~1cm at standard density-independent-pixel scale (96dpi reference, same
// approximation CSS uses for physical units) - the gap between each slide's
// illustration and the headline/body text below it.
const ILLUSTRATION_GAP = 38;

const shadowSm = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
  elevation: 3,
};

// -- Shared animation drivers -----------------------------------------------
// A value bouncing 0 -> 1 -> 0 (each leg = halfDuration), for symmetric
// keyframes that return to their start state at 50% (bob, itemFloat,
// checkPulse, pinBounce, funnelPulse, chipFloat*, magSweep).
const useBackAndForth = (halfDuration, easing = Easing.inOut(Easing.ease)) => {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: halfDuration, easing, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: halfDuration, easing, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value, halfDuration, easing]);
  return value;
};

// A value looping 0 -> 1 linearly and repeating - for multi-stage keyframes
// (wave, popQ, iconIntoFunnel) whose interpolation stops carry the easing.
const useLoopValue = (duration, easing = Easing.linear) => {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [value, duration, easing]);
  return value;
};

// Eye color flips per theme (white on light, dark ink on dark) so the face
// keeps reading against the same blue blob in both modes - ported 1:1 from
// the prototype's `mascotEyeColor: dark ? '#0B1220' : '#FFFFFF'` logic. Both
// values are the light-theme ink/surfaceRaised tokens (not the active
// `tokens` prop's own ink), since the mascot is a fixed-blue brand asset,
// not a themed surface.
const eyeColorFor = (isDark) => (isDark ? colorTokens.light.ink : colorTokens.light.surfaceRaised);

// -- Slide 1: Welcome / language ---------------------------------------------
// Mascot with a waving arm and three floating greeting chips ("Hello",
// "Bonjour", "مرحباً") bobbing around it - the language chip row itself
// already lives in OnboardingScreen.js and is left as-is.
export const WelcomeMascotIllustration = ({ isDark }) => {
  const eyeColor = eyeColorFor(isDark);
  const bob = useBackAndForth(1600);
  const wave = useLoopValue(2100, Easing.inOut(Easing.ease));
  const chip1 = useBackAndForth(1700);
  const chip2 = useBackAndForth(1900);
  const chip3 = useBackAndForth(1550);

  const bobTranslateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const waveRotate = wave.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0, 18, -8, 0] });

  return (
    <View style={styles.welcomeScene}>
      <Animated.View
        style={[
          styles.chip,
          {
            left: -6,
            top: 8,
            transform: [
              { translateX: chip1.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
              { translateY: chip1.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
            ],
          },
        ]}
      >
        <Text style={styles.chipText}>Hello</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.chip,
          {
            right: -8,
            top: 20,
            transform: [
              { translateX: chip2.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) },
              { translateY: chip2.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
              { rotate: chip2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '4deg'] }) },
            ],
          },
        ]}
      >
        <Text style={styles.chipText}>Bonjour</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.chip,
          {
            left: 20,
            bottom: 0,
            transform: [
              { translateX: chip3.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
              { translateY: chip3.interpolate({ inputRange: [0, 1], outputRange: [0, 9] }) },
              { rotate: chip3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-4deg'] }) },
            ],
          },
        ]}
      >
        <Text style={styles.chipText}>مرحباً</Text>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateY: bobTranslateY }] }}>
        <Svg width={112} height={112} viewBox="0 0 120 120">
          <Ellipse cx="60" cy="66" rx="34" ry="30" fill={BRAND_BLUE} />
          <AnimatedG originX={90} originY={62} rotation={waveRotate}>
            <Path
              d="M90 62 Q106 52 101 32"
              stroke={BRAND_BLUE}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
          </AnimatedG>
          <Circle cx="48" cy="60" r="6" fill={eyeColor} />
          <Circle cx="72" cy="60" r="6" fill={eyeColor} />
          <Path d="M48 76 Q60 87 72 76" stroke={eyeColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
};

// -- Slide 2: Report a lost item ---------------------------------------------
// Mascot + a bouncing "?" badge + a faint dashed item outline + the app's own
// search mark (maficonSVG.svg, recreated inline) sweeping back and forth like
// it's scanning for the item.
export const ReportIllustration = ({ isDark }) => {
  const eyeColor = eyeColorFor(isDark);
  const bob = useBackAndForth(1600);
  const itemFloat = useBackAndForth(1500);
  const magSweep = useLoopValue(2800, Easing.inOut(Easing.ease));
  const popQ = useBackAndForth(1300);

  const bobTranslateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const itemTranslateY = itemFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });

  const sweepX = magSweep.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });
  const sweepY = magSweep.interpolate({ inputRange: [0, 1], outputRange: [4, -4] });
  const sweepRotate = magSweep.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '10deg'] });

  // Always visible (no opacity animation) with a gentle scale/lift pulse -
  // the earlier fade-in/out version wasn't showing up reliably, so this
  // trades the prototype's pop-in-then-vanish timing for something that's
  // guaranteed on-screen constantly, just breathing in size a little.
  const popTranslateY = popQ.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const popScale = popQ.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  return (
    <View style={styles.reportScene}>
      <Animated.View style={{ position: 'absolute', left: 16, bottom: 22, transform: [{ translateY: itemTranslateY }] }}>
        <Svg width={60} height={60} viewBox="0 0 60 60">
          <Rect
            x="6"
            y="16"
            width="40"
            height="24"
            rx="8"
            fill="none"
            stroke={BRAND_BLUE}
            strokeWidth="3"
            strokeDasharray="5 5"
            opacity={0.55}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateY: bobTranslateY }] }}>
        {/* react-native-svg clips to the Svg's own canvas regardless of an
            "overflow: visible" style (that only affects normal RN View
            clipping, not this native drawing surface) - the magnifying
            glass's thick 11px handle stroke was getting cut off right at the
            120x120 edge at the sweep's extremes, so the canvas itself is
            padded 10 units on every side instead. Content coordinates below
            are unchanged; the extra margin is added around them. */}
        <Svg width={136} height={136} viewBox="-10 -10 140 140">
          <Ellipse cx="60" cy="66" rx="34" ry="30" fill={BRAND_BLUE} />
          <Circle cx="48" cy="60" r="6" fill={eyeColor} />
          <Circle cx="72" cy="60" r="6" fill={eyeColor} />
          <Path d="M46 78 Q60 84 74 78" stroke={eyeColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <AnimatedG originX={86} originY={38} rotation={sweepRotate} x={sweepX} y={sweepY}>
            <G transform="translate(67.8,19.8) scale(0.91)">
              <Path
                d="M31.5 35.5L41.3861 47.5"
                fill="none"
                stroke={BRAND_BLUE}
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M20 36.5C29.1127 36.5 36.5 29.1127 36.5 20C36.5 10.8873 29.1127 3.5 20 3.5C10.8873 3.5 3.5 10.8873 3.5 20C3.5 29.1127 10.8873 36.5 20 36.5Z"
                // The lens ring is a closed path - react-native-svg defaults
                // an unset fill to black regardless of theme, so it must be
                // set explicitly here to flip per theme (kept black on dark,
                // as-is; swapped to white on light so it doesn't read as a
                // stray black disc against a light background).
                fill={isDark ? '#000000' : '#FFFFFF'}
                stroke={BRAND_BLUE}
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M28.46 19.6548C27.9813 17.2341 26.5605 15.1028 24.5102 13.7296C22.46 12.3564 19.9482 11.854 17.5275 12.3328"
                // This is an open arc; react-native-svg still auto-closes it
                // for fill purposes and defaults to black, which showed up as
                // a thin black sliver in the chord it closes across - it was
                // only ever meant to be an outline, in both themes.
                fill="none"
                stroke={BRAND_BLUE}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </G>
          </AnimatedG>
        </Svg>
      </Animated.View>

      {/* Rendered last (on top of the mascot in paint order) so it can never
          get painted over, regardless of zIndex support quirks. */}
      <Animated.View
        style={[
          styles.qBadge,
          { top: -6, right: 16, transform: [{ translateY: popTranslateY }, { scale: popScale }] },
        ]}
      >
        <Text style={styles.qBadgeText}>?</Text>
      </Animated.View>
    </View>
  );
};

// -- Slide 3: Browse items found nearby --------------------------------------
// Mascot + a bouncing location pin + a pulsing checkmark badge above its head
// + two faint floating item shapes in the corners.
export const FindIllustration = ({ isDark }) => {
  const eyeColor = eyeColorFor(isDark);
  const bob = useBackAndForth(1600);
  const itemFloat1 = useBackAndForth(1300);
  const itemFloat2 = useBackAndForth(1700);
  const pinBounce = useBackAndForth(1100);
  const checkPulse = useBackAndForth(1050);

  const bobTranslateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const item1TranslateY = itemFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  const item2TranslateY = itemFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  const pinTranslateY = pinBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const checkScale = checkPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });

  return (
    <View style={styles.reportScene}>
      <Animated.View style={{ position: 'absolute', left: 8, top: 14, transform: [{ translateY: item1TranslateY }] }}>
        <Svg width={30} height={30} viewBox="0 0 30 30">
          <Rect x="2" y="2" width="26" height="18" rx="5" fill={BRAND_BLUE} opacity={0.18} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', right: 6, top: 30, transform: [{ translateY: item2TranslateY }] }}>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Rect x="2" y="2" width="20" height="14" rx="4" fill={BRAND_BLUE} opacity={0.18} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', right: 14, bottom: 6, transform: [{ translateY: pinTranslateY }] }}>
        <Svg width={26} height={34} viewBox="0 0 26 34">
          <Path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 21 13 21s13-11.3 13-21C26 5.8 20.2 0 13 0z" fill="#1A8563" />
          <Circle cx="13" cy="13" r="5" fill="#fff" />
        </Svg>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateY: bobTranslateY }] }}>
        <Svg width={116} height={116} viewBox="0 0 120 120">
          <Ellipse cx="60" cy="66" rx="34" ry="30" fill={BRAND_BLUE} />
          <Circle cx="48" cy="60" r="6" fill={eyeColor} />
          <Circle cx="72" cy="60" r="6" fill={eyeColor} />
          <Path d="M48 76 Q60 87 72 76" stroke={eyeColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <AnimatedG originX={60} originY={20} scale={checkScale}>
            <Circle cx="60" cy="20" r="16" fill="#1A8563" />
            <Path d="M52 20l6 6 12-12" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </AnimatedG>
        </Svg>
      </Animated.View>
    </View>
  );
};

// -- Slide 4: Filter by country/city/category --------------------------------
// A gradient-filled funnel over a translucent "glass circle" backdrop, with
// every real category icon (in its real category color) staggered on a
// shared 6s loop so they appear to fall/fly into the funnel one after
// another, over a faded full-bleed world map.
const FUNNEL_SIZE = 200;
const FUNNEL_CYCLE_MS = 6000;

const CATEGORY_ICON_ITEMS = Object.entries(CATEGORY_CONFIG)
  .filter(([code]) => code !== 'OTHER') // the catch-all doesn't represent a "thing" to fly into the funnel
  .map(([code, config], i, arr) => ({
    key: code,
    icon: config.icon,
    color: config.color,
    delayFraction: i / arr.length,
    // Deterministic left/right scatter so icons converge into the funnel
    // from varied starting sides, mirroring the prototype's --sx spread.
    sx: (i % 2 === 0 ? 1 : -1) * (15 + i * 4),
  }));

const FlyingCategoryIcon = ({ master, delayFraction, sx, icon, color, size }) => {
  // Animated.modulo reproduces the CSS "positive animation-delay + infinite"
  // effect: each icon runs the same 6s cycle, phase-shifted by its own delay.
  const progress = Animated.modulo(Animated.add(master, 1 - delayFraction), 1);

  const translateX = progress.interpolate({
    inputRange: [0, 0.55, 0.78, 1],
    outputRange: [sx, sx * 0.15, 0, 0],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 0.55, 0.78, 1],
    outputRange: [-64, 18, 52, 66],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.55, 0.78, 1],
    outputRange: [1, 0.85, 0.4, 0.05],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.55, 0.78, 1],
    outputRange: [0, 1, 1, 0.9, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: FUNNEL_SIZE / 2 - size / 2,
        top: 92,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Animated.View>
  );
};

export const FilterIllustration = () => {
  const master = useLoopValue(FUNNEL_CYCLE_MS, Easing.linear);
  const funnelPulse = useBackAndForth(3000);
  const funnelScale = funnelPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });

  return (
    <View style={styles.filterScene}>
      <View style={styles.worldMapClip} pointerEvents="none">
        <SvgXml xml={WORLD_MAP_XML} width="100%" height="100%" style={styles.worldMapOpacity} />
      </View>

      {CATEGORY_ICON_ITEMS.map((item) => (
        <FlyingCategoryIcon key={item.key} master={master} delayFraction={item.delayFraction} sx={item.sx} icon={item.icon} color={item.color} size={20} />
      ))}

      <Animated.View style={[styles.funnelWrap, { transform: [{ scale: funnelScale }] }]}>
        <Svg width={86} height={86} viewBox="0 0 120 120">
          <Defs>
            <LinearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#5FB0E8" />
              <Stop offset="100%" stopColor={BRAND_BLUE} />
            </LinearGradient>
          </Defs>
          <Circle cx="60" cy="60" r="54" fill={`${BRAND_BLUE}0D`} />
          <Path
            d="M22 32h76c4 0 6 4.5 3 7.5L68 73v28c0 4-4 6.5-7.3 4.3l-14-9.3c-1.7-1.1-2.7-3-2.7-5V73L19 39.5c-3-3-1-7.5 3-7.5z"
            fill="url(#funnelGrad)"
            stroke="#2C7FBE"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <Circle cx="60" cy="42" r="3.4" fill="#fff" opacity={0.85} />
        </Svg>
      </Animated.View>
    </View>
  );
};

// -- Slide 5: Choose your country ---------------------------------------------
// Kept static (no orbiting motion) since the interactive country dropdown
// right below already carries the slide's motion. The flag corner badges
// were dropped (the country picker right below already shows a flag per
// country - these were redundant/arbitrary here) and the brand color now
// matches the other slides' fixed BRAND_BLUE instead of the theme token.
export const SecureIllustration = () => (
  <View style={stylesLegacy.sceneSm}>
    <View style={[stylesLegacy.backdrop, { backgroundColor: `${BRAND_BLUE}14` }]} />
    <View style={[stylesLegacy.hub, { backgroundColor: `${BRAND_BLUE}1A` }]}>
      <Ionicons name="shield-checkmark" size={36} color={BRAND_BLUE} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  welcomeScene: {
    width: 170,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ILLUSTRATION_GAP,
  },
  reportScene: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ILLUSTRATION_GAP,
  },
  filterScene: {
    width: FUNNEL_SIZE,
    height: 230,
    alignSelf: 'center',
    marginBottom: ILLUSTRATION_GAP,
  },
  chip: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: `${BRAND_BLUE}14`,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  chipText: {
    fontWeight: '700',
    fontSize: 13,
    color: BRAND_BLUE,
  },
  qBadge: {
    position: 'absolute',
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowSm,
  },
  qBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  worldMapClip: {
    position: 'absolute',
    left: -69,
    top: -4,
    width: 338,
    height: 198,
    overflow: 'hidden',
  },
  worldMapOpacity: {
    // Faded enough that the flying category icons (opaque, drawn on top)
    // stay the clear focal point, but well above the prototype's near-
    // invisible 0.16 now that the paths are actually painted blue.
    opacity: 0.4,
  },
  funnelWrap: {
    position: 'absolute',
    left: 66,
    top: 129,
    width: 86,
    height: 86,
    ...shadowSm,
  },
});

// Retained from the previous (pre-mascot) illustration set - only
// SecureIllustration (slide 5) still uses these.
const stylesLegacy = StyleSheet.create({
  sceneSm: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: ILLUSTRATION_GAP,
  },
  backdrop: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  hub: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
