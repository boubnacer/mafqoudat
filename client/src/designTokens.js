// Phase 1 design tokens — the single source of truth for color, type, radius
// and elevation across the app. theme.js resolves these against light/dark
// mode; nothing here should be duplicated as a hardcoded value elsewhere.

export const fontFamilies = {
  // Headings / display text — strong Arabic letterforms, confident Latin weights
  display: ['"Cairo"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
  // Body copy — pairs with Cairo, tuned for legibility at small sizes in Arabic
  body: ['"IBM Plex Sans Arabic"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
};

export const colorTokens = {
  brandPrimary: { light: '#1B4DFF', dark: '#5B7FFF' },
  ink: { light: '#0B1220', dark: '#EDEFF5' },
  surfaceBase: { light: '#F7F8FB', dark: '#0E1116' },
  surfaceRaised: { light: '#FFFFFF', dark: '#171B22' },
  status: {
    lost: {
      light: { main: '#D6483B', bg: '#FBEAE8', border: '#D6483B' },
      dark: { main: '#FF6B5E', bg: 'rgba(255, 107, 94, 0.16)', border: '#FF6B5E' },
    },
    found: {
      light: { main: '#1E8F6B', bg: '#E5F5EF', border: '#1E8F6B' },
      dark: { main: '#3DDCA6', bg: 'rgba(61, 220, 166, 0.16)', border: '#3DDCA6' },
    },
  },
};

// 8px base unit, four steps — replaces the ad hoc 24/16/12/4/2px radii in use today
export const radiusTokens = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// Three elevation steps, resolved per mode — replaces per-component blur/shadow duplication
export const elevationTokens = {
  light: {
    e1: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 1px rgba(15, 23, 42, 0.04)',
    e2: '0 4px 16px rgba(15, 23, 42, 0.10)',
    e3: '0 12px 32px rgba(15, 23, 42, 0.14)',
  },
  dark: {
    e1: '0 1px 2px rgba(0, 0, 0, 0.4)',
    e2: '0 4px 16px rgba(0, 0, 0, 0.45)',
    e3: '0 12px 32px rgba(0, 0, 0, 0.55)',
  },
};

export const resolveDesignTokens = (mode) => {
  const m = mode === 'dark' ? 'dark' : 'light';
  return {
    color: {
      brandPrimary: colorTokens.brandPrimary[m],
      ink: colorTokens.ink[m],
      surfaceBase: colorTokens.surfaceBase[m],
      surfaceRaised: colorTokens.surfaceRaised[m],
    },
    status: {
      lost: colorTokens.status.lost[m],
      found: colorTokens.status.found[m],
    },
    radius: radiusTokens,
    elevation: elevationTokens[m],
    font: fontFamilies,
  };
};
