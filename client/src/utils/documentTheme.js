// Publishes the resolved design tokens onto the document element, for the one
// kind of UI that cannot read them through MUI: markup this app does not own.
//
// Right now that is the Funding Choices consent message, which Google renders
// into the top-level document (styles/consentMessage.css is what consumes
// this), but anything else drawn outside the React tree can read the same
// variables rather than re-deriving colors.
//
// public/index.html sets data-color-scheme from localStorage before React
// mounts, so the message is never drawn against the wrong theme in the window
// before this runs; this keeps it true afterwards, including when the visitor
// flips the mode toggle while the message is open.

import { resolveDesignTokens } from '../designTokens';

export const applyDocumentTheme = (mode) => {
  if (typeof document === 'undefined') {
    return;
  }

  const resolvedMode = mode === 'dark' ? 'dark' : 'light';
  const tokens = resolveDesignTokens(resolvedMode);
  const root = document.documentElement;

  root.setAttribute('data-color-scheme', resolvedMode);

  root.style.setProperty('--mafq-ink', tokens.color.ink);
  root.style.setProperty('--mafq-surface-base', tokens.color.surfaceBase);
  root.style.setProperty('--mafq-surface-raised', tokens.color.surfaceRaised);
  root.style.setProperty('--mafq-brand-primary', tokens.color.brandPrimary);
  root.style.setProperty('--mafq-radius-lg', `${tokens.radius.lg}px`);
  root.style.setProperty('--mafq-radius-md', `${tokens.radius.md}px`);
  root.style.setProperty('--mafq-elevation-e3', tokens.elevation.e3);
  root.style.setProperty('--mafq-font-body', tokens.font.body);
  root.style.setProperty('--mafq-font-display', tokens.font.display);
};

export default applyDocumentTheme;
