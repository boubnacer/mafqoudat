import { Box, useTheme, useMediaQuery, alpha } from "@mui/material";
import SkeletonBlock from "../SkeletonBlock";

// Initial full-page loading state for Dash.js, ported from mobile
// HomeScreen.js's approach: rather than blocking the whole page behind a
// spinner, render the real page shell (panel chrome) with SkeletonBlock
// shapes standing in for each section's real content, sized to match what
// LeftSide/RecentSection actually render once data.

const panelSx = (theme, isMobile) => ({
  background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
  backdropFilter: "blur(10px)",
  borderRadius: isMobile ? `${theme.custom.radius.lg}px` : `${theme.custom.radius.xl}px`,
  padding: isMobile ? "1.5rem" : "2rem",
  boxShadow: "none",
});

const DashboardSkeleton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Box sx={{ px: { xs: 1, sm: 2 } }}>
      {/* Stats + map header, mirrors LeftSide's title/FoundLostStrip/TotalBox layout */}
      <Box mb={4} sx={panelSx(theme, isMobile)}>
        <SkeletonBlock
          radius={theme.custom.radius.sm}
          sx={{ height: 32, width: 160, mx: "auto", mb: isMobile ? 2 : 3 }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: isMobile ? "1rem" : "1.5rem",
          }}
        >
          <SkeletonBlock radius={theme.custom.radius.lg} sx={{ height: 220, gridColumn: "1 / -1" }} />
          <SkeletonBlock radius={theme.custom.radius.lg} sx={{ height: 158 }} />
          <SkeletonBlock radius={theme.custom.radius.lg} sx={{ height: 158 }} />
        </Box>
      </Box>

      {/* Recent founds / recent losts panels, mirrors RecentSection's 2-up poster grid */}
      <Box
        mb={4}
        sx={{
          display: "grid",
          gap: { xs: 3, md: 4 },
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        {[0, 1].map((i) => (
          <Box key={i} sx={{ height: "100%", display: "flex", flexDirection: "column", ...panelSx(theme, isMobile) }}>
            <SkeletonBlock
              radius={theme.custom.radius.sm}
              sx={{ height: 28, width: 140, mb: isMobile ? 2 : 3 }}
            />
            <Box sx={{ display: "grid", gap: isMobile ? 1.5 : 2, gridTemplateColumns: "repeat(2, 1fr)" }}>
              <SkeletonBlock radius={theme.custom.radius.lg} sx={{ width: "100%", aspectRatio: "3 / 4" }} />
              <SkeletonBlock radius={theme.custom.radius.lg} sx={{ width: "100%", aspectRatio: "3 / 4" }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DashboardSkeleton;
