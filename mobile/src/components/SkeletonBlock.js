/**
 * SkeletonBlock
 * Shared loading-placeholder shape, extracted from HomeScreen.js. A tinted
 * (8% ink over the current surface) rounded rectangle with a light band that
 * continuously sweeps left-to-right across it - the same shimmer feel as
 * Facebook/YouTube/Claude's own loading placeholders - so a skeleton reads
 * as "actively loading" rather than a static colored box. Callers size and
 * position it via `style` to approximate their own screen's real content (a
 * card, a text line, an avatar circle, etc).
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radiusTokens } from '../theme/tokens';

const SHIMMER_DURATION_MS = 1300;

const SkeletonBlock = ({ style, tokens }) => {
  const [width, setWidth] = useState(0);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: SHIMMER_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[{ backgroundColor: `${tokens.ink}14`, borderRadius: radiusTokens.sm, overflow: 'hidden' }, style]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={[`${tokens.ink}00`, `${tokens.ink}33`, `${tokens.ink}00`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      ) : null}
    </View>
  );
};

export default SkeletonBlock;
