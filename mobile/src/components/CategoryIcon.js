import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_CONFIG, CATEGORY_SVG_XML } from '../config/categories';

/**
 * Universal category icon component for mobile.
 * Uses high-fidelity vector SVGs for composite categories (e.g. Phone & Tablet,
 * Storage Hard Drive + USB, Charger & Cable, Power Bank), and cleanly falls back
 * to Ionicons glyphs for standard single-item categories.
 */
export const CategoryIcon = ({ code, icon, size = 20, color, style }) => {
  const upper = code ? String(code).toUpperCase() : null;
  const config = upper ? CATEGORY_CONFIG[upper] : null;
  const iconColor = color || config?.color || '#000000';
  const xmlTemplate = upper ? CATEGORY_SVG_XML?.[upper] : null;

  if (xmlTemplate) {
    const xml = xmlTemplate.replace(/currentColor/g, iconColor);
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <SvgXml xml={xml} width={size} height={size} />
      </View>
    );
  }

  const iconName = icon || config?.icon || 'ellipsis-horizontal-outline';
  return <Ionicons name={iconName} size={size} color={iconColor} style={style} />;
};

export default CategoryIcon;
