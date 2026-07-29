import React from 'react';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import SkeletonBlock from './SkeletonBlock';

// Mirrors NewPostForm.js/EditPostForm.js's shell: a centered Paper card with
// a step rail on desktop and stacked field groups — shown while the
// user/countries/categories/flOptions (and, for edits, the post itself)
// dependencies are still loading, instead of a generic spinner.
const PostFormSkeleton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        pt: { xs: '6rem', md: '7rem' },
        minHeight: '100vh',
        backgroundColor: theme.custom.color.surfaceBase,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 960,
          mx: 'auto',
          borderRadius: `${theme.custom.radius.lg}px`,
          backgroundColor: theme.custom.color.surfaceRaised,
          boxShadow: theme.custom.elevation.e1,
          p: { xs: 2.5, md: 4 },
          display: 'flex',
          gap: 4,
        }}
      >
        {!isMobile && (
          <Box sx={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[0, 1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SkeletonBlock radius={999} sx={{ width: 32, height: 32, flexShrink: 0 }} />
                <SkeletonBlock sx={{ height: 14, width: '70%' }} />
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SkeletonBlock sx={{ height: 28, width: '40%', mb: 3 }} />
          <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 56, width: '100%', mb: 2 }} />
          <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 56, width: '100%', mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 56, flex: 1 }} />
            <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 56, flex: 1 }} />
          </Box>
          <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 120, width: '100%', mb: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 44, width: 100 }} />
            <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 44, width: 100 }} />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PostFormSkeleton;
