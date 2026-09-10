import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * A titled block inside a page - the paired-panel vocabulary, flattened.
 *
 * The dashboard's `SectionPanel` centres its title and wraps its content in its
 * own gradient card; here a section is usually one or more `AdminCard`s under a
 * left-aligned heading, so the heading is the component and the cards stay
 * separate shapes.
 */
const Section = ({ title, description, actions, children, sx = {} }) => (
  <Box component="section" sx={{ mb: { xs: 3, sm: 4 }, ...sx }}>
    {(title || actions) && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
          mb: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {title ? (
            <Typography
              component="h2"
              sx={(theme) => ({
                fontFamily: theme.custom.font.display,
                fontWeight: 700,
                fontSize: { xs: '1.05rem', sm: '1.15rem' },
                color: theme.custom.color.ink,
                lineHeight: 1.3,
              })}
            >
              {title}
            </Typography>
          ) : null}
          {description ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {actions ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {actions}
          </Box>
        ) : null}
      </Box>
    )}
    {children}
  </Box>
);

export default Section;
