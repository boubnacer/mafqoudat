import { Box, Grid, Paper, useTheme } from "@mui/material";
import SkeletonBlock from "../../../components/SkeletonBlock";
import PostCardSkeleton from "../../../components/PostCardSkeleton";

// Mirrors PostsList.js's own shape once loaded: a slim results line, a
// filter Paper (category/city selects), then a responsive grid of post
// cards — shown in place of the generic full-page spinner while the
// country/category/city/posts queries are still resolving.
const PostsListSkeleton = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, pt: { xs: "6rem", md: "7rem" }, minHeight: "100vh" }}>
      <SkeletonBlock sx={{ height: 20, width: 160, mb: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: `${theme.custom.radius.lg}px`,
            backgroundColor: theme.custom.color.surfaceRaised,
            boxShadow: theme.custom.elevation.e1,
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 56 }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 56 }} />
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <PostCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PostsListSkeleton;
