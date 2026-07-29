import React from 'react';
import { Box, Container, Paper, useTheme } from '@mui/material';
import SkeletonBlock from './SkeletonBlock';

// Shared skeleton for the static info/legal pages (About, Privacy, Terms,
// Cookies, Guidelines, Safety, Blog, Blog post, Help, Contact) — they all
// share the same basic shell (Navbar + centered title/subtitle + prose
// sections inside a rounded card), so one generic title+paragraph-shaped
// skeleton stands in for all of them as the route-level Suspense fallback,
// instead of the site's old default full-screen spinner.
const InfoPageSkeleton = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: { xs: '6rem', sm: '7rem' },
        pb: 4,
        backgroundColor: theme.custom.color.surfaceBase,
      }}
    >
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 4 },
            borderRadius: `${theme.custom.radius.lg}px`,
            backgroundColor: theme.custom.color.surfaceRaised,
            boxShadow: theme.custom.elevation.e1,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <SkeletonBlock sx={{ height: { xs: 32, md: 44 }, width: '50%', maxWidth: 420, mx: 'auto', mb: 2 }} />
            <SkeletonBlock sx={{ height: 20, width: '35%', maxWidth: 280, mx: 'auto', mb: 2 }} />
            <SkeletonBlock sx={{ height: 14, width: '70%', maxWidth: 600, mx: 'auto' }} />
          </Box>

          {[0, 1, 2].map((section) => (
            <Box key={section} sx={{ mb: 4 }}>
              <SkeletonBlock sx={{ height: 22, width: '30%', maxWidth: 220, mb: 2 }} />
              <SkeletonBlock sx={{ height: 14, width: '100%', mb: 1 }} />
              <SkeletonBlock sx={{ height: 14, width: '95%', mb: 1 }} />
              <SkeletonBlock sx={{ height: 14, width: '80%' }} />
            </Box>
          ))}
        </Paper>
      </Container>
    </Box>
  );
};

export default InfoPageSkeleton;
