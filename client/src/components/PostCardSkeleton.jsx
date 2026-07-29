import React from 'react';
import { Box, useTheme } from '@mui/material';
import SkeletonBlock from './SkeletonBlock';

// Shared placeholder for the site's "Post card DNA" (see CLAUDE.md: image
// thumbnail + status/date badges, title, description lines, meta rows,
// action button) — reused by PublicPostsPage and the dashboard's PostsList
// so both show a grid that already looks like their real post cards while
// loading, instead of a generic spinner.
const PostCardSkeleton = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        borderRadius: `${theme.custom.radius.lg}px`,
        overflow: 'hidden',
        backgroundColor: theme.custom.color.surfaceRaised,
        boxShadow: theme.custom.elevation.e1,
      }}
    >
      <SkeletonBlock radius={0} sx={{ width: '100%', paddingTop: '75%' }} />
      <Box sx={{ p: 2 }}>
        <SkeletonBlock sx={{ width: '70%', height: 24, mb: 1 }} />
        <SkeletonBlock sx={{ width: '100%', height: 16, mb: 0.75 }} />
        <SkeletonBlock sx={{ width: '90%', height: 16, mb: 1.5 }} />
        <SkeletonBlock sx={{ width: '50%', height: 14, mb: 2 }} />
        <SkeletonBlock radius={theme.custom.radius.md} sx={{ width: '100%', height: 36 }} />
      </Box>
    </Box>
  );
};

export default PostCardSkeleton;
