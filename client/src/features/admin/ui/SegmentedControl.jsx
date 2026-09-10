import React from 'react';
import { Box, Typography } from '@mui/material';
import { adminTone } from './adminTones';

/**
 * Two or three views of the same page - reports vs comments, messages vs
 * password resets. A control, so it keeps a visible track (the borderless rule
 * is about containers).
 *
 * Laid out with flex, so the options follow the document's direction without
 * a mirrored variant.
 */
const SegmentedControl = ({ value, onChange, options = [], size = 'md', ariaLabel }) => (
  <Box
    role="tablist"
    aria-label={ariaLabel}
    sx={(theme) => ({
      display: 'inline-flex',
      gap: 0.5,
      p: 0.5,
      maxWidth: '100%',
      overflowX: 'auto',
      borderRadius: `${theme.custom.radius.md}px`,
      backgroundColor: theme.custom.color.surfaceRaised,
      boxShadow: theme.custom.elevation.e1,
      '&::-webkit-scrollbar': { display: 'none' },
      scrollbarWidth: 'none',
    })}
  >
    {options.map((option) => {
      const selected = option.value === value;
      const Icon = option.icon;
      return (
        <Box
          key={String(option.value)}
          role="tab"
          aria-selected={selected}
          tabIndex={0}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onChange(option.value);
            }
          }}
          sx={(theme) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            px: size === 'sm' ? 1.25 : 1.75,
            py: size === 'sm' ? 0.5 : 0.75,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: selected
              ? theme.custom.color.brandPrimary
              : 'transparent',
            color: selected
              ? theme.palette.getContrastText(theme.custom.color.brandPrimary)
              : theme.palette.text.secondary,
            transition: 'background-color 0.18s ease, color 0.18s ease',
            '&:hover': selected ? undefined : { color: theme.custom.color.ink },
            '&:focus-visible': {
              outline: `2px solid ${theme.custom.color.brandPrimary}`,
              outlineOffset: 2,
            },
          })}
        >
          {Icon ? <Icon sx={{ fontSize: size === 'sm' ? 15 : 17 }} /> : null}
          <Typography
            component="span"
            sx={{ fontWeight: 700, fontSize: size === 'sm' ? '0.76rem' : '0.84rem' }}
          >
            {option.label}
          </Typography>
          {option.count ? (
            <Box
              component="span"
              sx={(theme) => ({
                minWidth: 18,
                px: 0.5,
                borderRadius: `${theme.custom.radius.sm}px`,
                fontSize: '0.66rem',
                fontWeight: 800,
                lineHeight: '17px',
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
                backgroundColor: selected
                  ? 'rgba(255,255,255,0.24)'
                  : adminTone(theme, 'attention').bg,
                color: selected
                  ? theme.palette.getContrastText(theme.custom.color.brandPrimary)
                  : adminTone(theme, 'attention').main,
              })}
            >
              {option.count > 99 ? '99+' : option.count}
            </Box>
          ) : null}
        </Box>
      );
    })}
  </Box>
);

export default SegmentedControl;
