/**
 * SkeletonBlock
 * Shared loading-placeholder shape, extracted from HomeScreen.js. A plain
 * tinted (14% ink over the current surface) rounded rectangle - callers size
 * and position it via `style` to approximate their own screen's real content
 * (a card, a text line, an avatar circle, etc).
 */

import React from 'react';
import { View } from 'react-native';
import { radiusTokens } from '../theme/tokens';

const SkeletonBlock = ({ style, tokens }) => (
  <View style={[{ backgroundColor: `${tokens.ink}14`, borderRadius: radiusTokens.sm }, style]} />
);

export default SkeletonBlock;
