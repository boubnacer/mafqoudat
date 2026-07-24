/**
 * useStaggeredFadeIn
 * Extracted from HomeScreen.js's original sectionAnims/animatedSectionStyle
 * pattern so every data-driven screen can reuse the same "sections fade +
 * translateY-in, staggered 70ms apart, once data is ready" feel instead of
 * redefining it per screen.
 *
 * While `isReady` is false, getSectionStyle(index) returns undefined so
 * whatever the caller renders in that slot (a SkeletonBlock layout) is fully
 * visible immediately - the skeleton is the "instant" state, not something
 * that itself fades in. Once `isReady` flips true, the same slot (now
 * rendering real content) animates in with the fade + translateY-in.
 */

import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const STAGGER_MS = 70;
const DURATION_MS = 320;
const TRANSLATE_Y_FROM = 14;

export const useStaggeredFadeIn = (sectionCount, isReady) => {
  const sectionAnims = useRef([...Array(sectionCount)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!isReady) return;
    Animated.stagger(
      STAGGER_MS,
      sectionAnims.map((value) => Animated.timing(value, { toValue: 1, duration: DURATION_MS, useNativeDriver: true }))
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const getSectionStyle = (index) => {
    if (!isReady) return undefined;
    return {
      opacity: sectionAnims[index],
      transform: [
        {
          translateY: sectionAnims[index].interpolate({ inputRange: [0, 1], outputRange: [TRANSLATE_Y_FROM, 0] }),
        },
      ],
    };
  };

  return getSectionStyle;
};

export default useStaggeredFadeIn;
