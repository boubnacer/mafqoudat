import React from 'react';
import { Box, Grid, Paper, useTheme } from '@mui/material';
import SkeletonBlock from './SkeletonBlock';

// Mirrors SinglePostPage.js's two-column layout: a main Paper (image +
// title/description/meta) on the left, a stack of smaller Papers (contact,
// safety tips) on the right.
const SinglePostSkeleton = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 4 },
        pt: { xs: '4rem', sm: '4.5rem', md: '5rem' },
        mt: { xs: '2rem', sm: '1.5rem', md: '1rem' },
        minHeight: '100vh',
        backgroundColor: theme.custom.color.surfaceBase,
      }}
    >
      <Grid container spacing={{ xs: 2, md: 4 }}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: `${theme.custom.radius.lg}px`,
              overflow: 'hidden',
              backgroundColor: theme.custom.color.surfaceRaised,
              boxShadow: theme.custom.elevation.e1,
            }}
          >
            <SkeletonBlock radius={0} sx={{ width: '100%', height: { xs: 300, sm: 400, md: 500 } }} />
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <SkeletonBlock sx={{ height: 32, width: '60%', mb: 2 }} />
              <SkeletonBlock sx={{ height: 16, width: '100%', mb: 1 }} />
              <SkeletonBlock sx={{ height: 16, width: '95%', mb: 1 }} />
              <SkeletonBlock sx={{ height: 16, width: '80%', mb: 3 }} />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <SkeletonBlock radius={theme.custom.radius.sm} sx={{ height: 28, width: 120 }} />
                <SkeletonBlock radius={theme.custom.radius.sm} sx={{ height: 28, width: 100 }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 4 } }}>
            {[0, 1].map((i) => (
              <Paper
                key={i}
                elevation={0}
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: `${theme.custom.radius.lg}px`,
                  backgroundColor: theme.custom.color.surfaceRaised,
                  boxShadow: theme.custom.elevation.e1,
                }}
              >
                <SkeletonBlock sx={{ height: 22, width: '50%', mb: 2 }} />
                <SkeletonBlock sx={{ height: 14, width: '100%', mb: 1 }} />
                <SkeletonBlock sx={{ height: 14, width: '85%' }} />
              </Paper>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SinglePostSkeleton;
