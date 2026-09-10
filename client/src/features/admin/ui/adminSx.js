import { alpha } from '@mui/material';
import { adminTone } from './adminTones';

/**
 * Style helpers for the panel's controls.
 *
 * These exist because of one trap: `theme.palette.primary.main` in this app is
 * **`#FFFFFF` in light mode** and `#3C3C3C` in dark - a legacy palette from
 * before the design tokens, and nothing to do with the brand. So an MUI
 * `<Button>` with no explicit colour renders white text on a white card, and a
 * `variant="contained"` one renders a white block. A focused `<TextField>`
 * draws a white outline, and a checked `<Switch>` a white thumb.
 *
 * Every control in the panel therefore states its colour, from
 * `theme.custom` - `brandPrimary` by default, or one of the five tones. Nothing
 * here relies on the MUI palette.
 */

/** A text button (the panel's default action shape). */
export const actionButtonSx =
  (tone = 'brand') =>
  (theme) => ({
    textTransform: 'none',
    fontWeight: 700,
    borderRadius: `${theme.custom.radius.sm}px`,
    color: adminTone(theme, tone).main,
    '&:hover': { backgroundColor: alpha(adminTone(theme, tone).main, 0.08) },
    '&.Mui-disabled': { color: theme.palette.text.disabled },
  });

/** A filled button, for the one primary action in a view. */
export const containedButtonSx =
  (tone = 'brand') =>
  (theme) => {
    const resolved = adminTone(theme, tone);
    return {
      textTransform: 'none',
      fontWeight: 700,
      borderRadius: `${theme.custom.radius.sm}px`,
      backgroundColor: resolved.solid,
      color: resolved.onSolid,
      '&:hover': { backgroundColor: resolved.solid, filter: 'brightness(0.94)' },
      '&.Mui-disabled': {
        backgroundColor: alpha(theme.custom.color.ink, 0.1),
        color: theme.palette.text.disabled,
      },
    };
  };

/** A quiet, neutral button - "close", "cancel". */
export const quietButtonSx = (theme) => ({
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: `${theme.custom.radius.sm}px`,
  color: theme.palette.text.secondary,
  '&:hover': { backgroundColor: alpha(theme.custom.color.ink, 0.06) },
});

/** Rounded field with a brand-coloured focus ring rather than a white one. */
export const inputSx = (theme) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: `${theme.custom.radius.sm}px`,
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.custom.color.brandPrimary,
    },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: theme.custom.color.brandPrimary },
});

/** A multiline note field, matching the panel's inputs without MUI's chrome. */
export const noteFieldSx = (theme) => ({
  width: '100%',
  resize: 'vertical',
  p: 1.25,
  fontFamily: theme.custom.font.body,
  fontSize: '0.875rem',
  color: theme.custom.color.ink,
  backgroundColor: alpha(theme.custom.color.ink, 0.03),
  border: `1px solid ${alpha(theme.custom.color.ink, 0.16)}`,
  borderRadius: `${theme.custom.radius.sm}px`,
  '&:focus': { outline: 'none', borderColor: theme.custom.color.brandPrimary },
});

/** A switch whose "on" state is the brand colour, not the palette's white. */
export const switchSx =
  (tone = 'attention') =>
  (theme) => {
    const resolved = adminTone(theme, tone);
    return {
      '& .MuiSwitch-switchBase.Mui-checked': {
        color: resolved.main,
        '&:hover': { backgroundColor: alpha(resolved.main, 0.08) },
      },
      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: resolved.main,
      },
    };
  };
