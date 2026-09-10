import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Every page in the panel opens the same way: an eyebrow naming the section,
 * the page title, one line saying what the page is for, and a slot on the
 * inline-end for that page's own actions. On a phone the actions wrap below
 * rather than squeezing the title.
 */
const PageHeader = ({ eyebrow, title, description, actions }) => (
  <Box
    sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 2,
      mb: { xs: 2, sm: 3 },
    }}
  >
    <Box sx={{ minWidth: 0, flex: '1 1 260px' }}>
      {eyebrow ? (
        <Typography
          variant="overline"
          sx={{
            fontWeight: 600,
            letterSpacing: 1,
            color: 'text.secondary',
            display: 'block',
            lineHeight: 1.6,
          }}
        >
          {eyebrow}
        </Typography>
      ) : null}
      <Typography
        component="h1"
        sx={(theme) => ({
          fontFamily: theme.custom.font.display,
          fontWeight: 800,
          color: theme.custom.color.ink,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          lineHeight: 1.2,
        })}
      >
        {title}
      </Typography>
      {description ? (
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 620 }}
        >
          {description}
        </Typography>
      ) : null}
    </Box>
    {actions ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {actions}
      </Box>
    ) : null}
  </Box>
);

export default PageHeader;
