/**
 * Design tokens for the mobile app's dark/light theme system.
 * `primary` mirrors client/src/theme.js's secondary.main (#3498DB), the one
 * brand accent shared by both the web app's light and dark palettes.
 */

export const lightColors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
  primary: '#3498DB',
  primarySoft: '#EAF3FB',
  primaryText: '#FFFFFF',
  danger: '#C62828',
  dangerBackground: '#FFEBEE',
  success: '#2E7D32',
  successBackground: '#E8F5E9',
  warning: '#EF6C00',
  warningBackground: '#FFF3E0',
  inputBackground: '#F5F5F5',
  placeholder: '#999999',
};

export const darkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceElevated: '#242526',
  textPrimary: '#E8E8E8',
  textSecondary: '#B0B0B0',
  border: '#3C3C3C',
  primary: '#3498DB',
  primarySoft: '#1D3E52',
  primaryText: '#FFFFFF',
  danger: '#FF6B6B',
  dangerBackground: '#3A1F1F',
  success: '#4CAF50',
  successBackground: '#1E3A20',
  warning: '#FFB74D',
  warningBackground: '#3A2E1A',
  inputBackground: '#242526',
  placeholder: '#8A8A8A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
  full: 999,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 32,
};
