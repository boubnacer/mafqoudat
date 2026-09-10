import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Part-to-whole as one connected shape.
 *
 * Two-slice pies are an anti-pattern and so is a one-bar bar chart, and the
 * house rule for this exact case is already written down: when a section shows
 * both counts side by side, one shape carrying the ratio beats two independent
 * boxes (FoundLostStrip). This is that shape, generalised to N segments so the
 * listing-status breakdown can use it too.
 *
 * Segments are separated by a 2px gap in the card colour rather than by a
 * stroke, and every segment is named in the legend below with its own count -
 * so nothing here depends on telling two fills apart, and a segment too narrow
 * for an inline label loses nothing.
 */
const SplitBar = ({ segments = [], height = 14, showLegend = true, total: totalProp }) => {
  const visible = segments.filter((segment) => (segment.value || 0) > 0);
  const total = totalProp ?? segments.reduce((sum, segment) => sum + (segment.value || 0), 0);

  return (
    <Box>
      <Box
        sx={(theme) => ({
          display: 'flex',
          gap: '2px',
          height,
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
          backgroundColor: theme.custom.color.surfaceRaised,
        })}
        role="img"
        aria-label={segments
          .map((segment) => `${segment.label}: ${segment.value || 0}`)
          .join(', ')}
      >
        {visible.length ? (
          visible.map((segment) => (
            <Box
              key={segment.key || segment.label}
              sx={{
                flexGrow: segment.value,
                flexBasis: 0,
                minWidth: 3,
                backgroundColor: segment.color,
              }}
            />
          ))
        ) : (
          <Box
            sx={(theme) => ({
              flex: 1,
              backgroundColor: theme.palette.action.disabledBackground,
            })}
          />
        )}
      </Box>

      {showLegend ? (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 1.25, sm: 2 },
            mt: 1.25,
          }}
        >
          {segments.map((segment) => {
            const share = total ? Math.round(((segment.value || 0) / total) * 100) : 0;
            return (
              <Box
                key={segment.key || segment.label}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    flexShrink: 0,
                    backgroundColor: segment.color,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {segment.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    fontWeight: 700,
                    color: theme.custom.color.ink,
                    fontVariantNumeric: 'tabular-nums',
                  })}
                >
                  {(segment.value || 0).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {`${share}%`}
                </Typography>
              </Box>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
};

export default SplitBar;
