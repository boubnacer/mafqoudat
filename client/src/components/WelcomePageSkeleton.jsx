import { Box, useTheme, useMediaQuery } from "@mui/material";
import SkeletonBlock from "./SkeletonBlock";

// Loading state for WelcomePage itself (shown while the countries list is
// fetching, before the hero can even pick a default country). Mirrors the
// real page's own section order/shapes — hero glass panel, coverage-stats
// bar, category tiles, fanned recent-post cards, safety callout — instead of
// a generic full-page spinner, so the page never "changes shape" once data
// arrives.
const WelcomePageSkeleton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: theme.custom.color.surfaceBase }}>
      {/* Hero */}
      <Box
        sx={{
          borderRadius: { xs: `${theme.custom.radius.lg}px`, md: `${theme.custom.radius.xl}px` },
          backgroundColor: theme.custom.color.surfaceBase,
          mb: { xs: 4, md: 6 },
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, pt: 3, pb: { xs: 3, md: 8 } }}>
          <Box
            sx={{
              maxWidth: { sm: 440, md: 480 },
              borderRadius: `${theme.custom.radius.xl}px`,
              backgroundColor: theme.custom.color.surfaceRaised,
              boxShadow: theme.custom.elevation.e2,
              p: { xs: 2.5, sm: 3, md: 3.5 },
            }}
          >
            <SkeletonBlock sx={{ height: { xs: 38, md: 48 }, width: 160, mb: { xs: 3, md: 5 } }} />
            <SkeletonBlock sx={{ height: { xs: 26, md: 32 }, width: "90%", mb: 1 }} />
            <SkeletonBlock sx={{ height: { xs: 26, md: 32 }, width: "55%", mb: 2 }} />
            <SkeletonBlock sx={{ height: 16, width: "100%", mb: 1 }} />
            <SkeletonBlock sx={{ height: 16, width: "75%", mb: 4 }} />
            <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 56, width: "100%", mb: 2 }} />
            <SkeletonBlock radius={theme.custom.radius.md} sx={{ height: 48, width: 180 }} />
          </Box>
        </Box>
      </Box>

      {/* Coverage stats */}
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
        <SkeletonBlock radius={theme.custom.radius.xl} sx={{ height: isMobile ? 96 : 64 }} />
      </Box>

      {/* Browse by category */}
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
        <SkeletonBlock sx={{ height: 28, width: 200, mb: 3 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: { xs: 3, sm: 5 }, py: 3 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <SkeletonBlock radius={999} sx={{ width: 68, height: 68 }} />
              <SkeletonBlock sx={{ width: 48, height: 12 }} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Recently posted near you */}
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
        <SkeletonBlock sx={{ height: 28, width: 220, mb: 3 }} />
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, pt: 1 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock
              key={i}
              radius={theme.custom.radius.lg}
              sx={{ width: isMobile ? 140 : 168, height: isMobile ? 188 : 224 }}
            />
          ))}
        </Box>
      </Box>

      {/* Safety / trust */}
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, pb: { xs: 6, md: 8 } }}>
        <SkeletonBlock radius={theme.custom.radius.xl} sx={{ height: 88 }} />
      </Box>
    </Box>
  );
};

export default WelcomePageSkeleton;
