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
  // Backdrop for the posts list page itself (not the cards) — the page's
  // plain surfaceBase (F7F8FB) sat only ~3% off the white surfaceRaised
  // cards on top of it in light mode, so the cards all but vanished into the
  // page. Gives that one page a slightly deeper tone than surfaceBase so the
  // (unchanged, plain white) cards read clearly against it. Dark mode value
  // equals surfaceBase's dark value verbatim (no-op there) — surfaceRaised
  // already separates from surfaceBase enough in dark mode.
  postsListBackdrop: { light: '#EDEFF6', dark: '#0E1116' },
  status: {
    // light-mode `main` deepened slightly from the original #D6483B/#1E8F6B so
    // getContrastText's white-on-main pick clears 4.5:1 on solid-fill status
    // tags (was 4.0-4.3:1 — right at the crossover where neither white nor
    // black text could pass). Dark-mode values are unaffected.
    lost: {
      light: { main: '#C64335', bg: '#FBEAE8', border: '#C64335' },
      dark: { main: '#FF6B5E', bg: 'rgba(255, 107, 94, 0.16)', border: '#FF6B5E' },
    },
    found: {
      light: { main: '#1A8563', bg: '#E5F5EF', border: '#1A8563' },
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

// Neumorphic ("soft UI") inset shadow, web-only — used solely by the
// dashboard Statistics section (LeftSide.jsx's FoundLostStrip + TotalBox
// cards). Two inset shadows read as one dip: a dark one cast into the
// bottom-right inner wall by a light source fixed at the top-left, and a
// light one uncovering the opposite inner wall — the CSS analog of mobile's
// three-layer NeumorphicSurface stack (theme/neumorphism.js, Phase 12),
// which needs the extra layers only because React Native has no multi-shadow
// style. Own token set rather than shared with mobile since the two
// platforms' shadow primitives don't line up.
export const neumorphicInsetTokens = {
  light: 'inset 4px 4px 10px rgba(163, 170, 191, 0.35), inset -4px -4px 10px rgba(255, 255, 255, 0.9)',
  dark: 'inset 4px 4px 10px rgba(0, 0, 0, 0.55), inset -4px -4px 10px rgba(255, 255, 255, 0.04)',
};

export const resolveDesignTokens = (mode) => {
  const m = mode === 'dark' ? 'dark' : 'light';
  return {
    color: {
      brandPrimary: colorTokens.brandPrimary[m],
      ink: colorTokens.ink[m],
      surfaceBase: colorTokens.surfaceBase[m],
      surfaceRaised: colorTokens.surfaceRaised[m],
      postsListBackdrop: colorTokens.postsListBackdrop[m],
    },
    status: {
      lost: colorTokens.status.lost[m],
      found: colorTokens.status.found[m],
    },
    radius: radiusTokens,
    elevation: elevationTokens[m],
    neumorphicInset: neumorphicInsetTokens[m],
    font: fontFamilies,
  };
};
