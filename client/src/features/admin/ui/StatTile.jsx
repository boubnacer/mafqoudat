import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { NorthEast, SouthEast, Remove } from '@mui/icons-material';
import AdminCard from './AdminCard';
import { adminTone } from './adminTones';

/**
 * label · value · delta · trend - the stat tile contract, nothing more.
 *
 * The delta is `null` when there is no previous period to compare against
 * (the server answers null rather than inventing "+100% from zero"), and a
 * null delta renders as an em dash with the comparison label, never as 0%.
 *
 * `positiveIsGood` exists because up is not always good: more posts is growth,
 * more pending reports is a backlog. The arrow always points the way the number
 * moved; only the colour reflects whether that is welcome.
 */
// Grouped in full up to a million, compacted past it. An admin panel's job is
// to give the number, and "92K" for 92,411 is a rounding nobody asked for at a
// size where the whole figure fits comfortably.
const formatValue = (value) => {
  if (value === null || value === undefined) return '—';
  if (typeof value !== 'number') return value;
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  return value.toLocaleString();
};

const StatTile = ({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  delta = null,
  deltaLabel,
  positiveIsGood = true,
  hint,
  trend,
  onClick,
  sx = {},
}) => {
  const hasDelta = delta !== null && delta !== undefined;
  const direction = !hasDelta || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
  const DeltaIcon = direction === 'up' ? NorthEast : direction === 'down' ? SouthEast : Remove;
  const deltaTone =
    direction === 'flat'
      ? 'neutral'
      : (direction === 'up') === positiveIsGood
      ? 'positive'
      : 'critical';

  return (
    <AdminCard
      interactive={Boolean(onClick)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick(event);
              }
            }
          : undefined
      }
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1, ...sx }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        {Icon ? (
          <Box
            sx={(theme) => {
              const resolved = adminTone(theme, tone);
              return {
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: resolved.bg,
                color: resolved.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              };
            }}
          >
            <Icon sx={{ fontSize: 19 }} />
          </Box>
        ) : null}
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 0, lineHeight: 1.3 }}
        >
          {label}
        </Typography>
      </Box>

      <Typography
        sx={(theme) => ({
          fontFamily: theme.custom.font.display,
          // Proportional figures, not tabular: this is a standalone display
          // number, and tabular-nums gives every digit a zero's width.
          fontWeight: 800,
          fontSize: { xs: '1.65rem', sm: '1.9rem' },
          lineHeight: 1.1,
          color: theme.custom.color.ink,
        })}
      >
        {formatValue(value)}
      </Typography>

      {trend ? <Box sx={{ mt: -0.5 }}>{trend}</Box> : null}

      {(hasDelta || deltaLabel || hint) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 'auto' }}>
          {hasDelta ? (
            <Box
              sx={(theme) => {
                const resolved = adminTone(theme, deltaTone);
                return {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  px: 0.6,
                  py: 0.2,
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: resolved.bg,
                  color: resolved.main,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                };
              }}
            >
              <DeltaIcon sx={{ fontSize: 12 }} />
              {`${delta > 0 ? '+' : ''}${delta}%`}
            </Box>
          ) : deltaLabel ? (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
              —
            </Typography>
          ) : null}
          {deltaLabel ? (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {deltaLabel}
            </Typography>
          ) : null}
          {hint ? (
            <Typography
              variant="caption"
              sx={(theme) => ({
                color: 'text.secondary',
                px: 0.6,
                py: 0.2,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: alpha(theme.custom.color.ink, 0.05),
              })}
            >
              {hint}
            </Typography>
          ) : null}
        </Box>
      )}
    </AdminCard>
  );
};

export default StatTile;
