import { Outlet } from "react-router-dom";
import DashFooter from "../Footer/DashFooter";

import "./layout.css";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import { useTranslation } from "../../utils/translations";

const DashLayout = () => {

  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const { currentLanguage } = useTranslation();

  return (
    <>
      {/* here we set things that's gonna apear in every single page
    now i'm going to remove the footer one because i don't want it to appear in some pages */}
      {/* Only overflowX is set here, but per the CSS overflow spec, setting one
          axis to non-visible while leaving the other unset computes the other
          to 'auto' too - combined with the explicit height="100%", that makes
          THIS box (not window/body/html, which never overflow) the real
          scroll container for every /dash/* route. The id lets route-level
          effects (e.g. NewPost.js's scroll-to-top-on-mount) target the
          element that's actually scrolling. */}
      <Box
        id="dash-scroll-container"
        width="100%"
        height="100%"
        sx={{
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
          overflowX: 'hidden', // Prevent horizontal overflow
        }}
      >
        <Sidebar />
        <Box
          sx={{
            backgroundColor: theme.custom.color.surfaceBase,
            maxWidth: '100%',
            // overflowX only (not the shorthand overflow: 'hidden') - the
            // full shorthand makes this box its own scroll-container
            // boundary per the CSS spec, which breaks position: sticky for
            // any descendant (e.g. PostsList's desktop filter sidebar): a
            // sticky element sticks relative to its *nearest* scroll-
            // container ancestor, and this box never actually scrolls
            // (auto height, nothing to overflow), so sticky resolved
            // against it instead of the real scroller
            // (#dash-scroll-container above) and just scrolled away.
            overflowX: 'hidden',
          }}
        >
          <Navbar />
          <Outlet />
          <DashFooter />
        </Box>
      </Box>
    </>
  );
};
export default DashLayout;
