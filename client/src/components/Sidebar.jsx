import {
  Box,
  Drawer,
  useMediaQuery,
  useTheme,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { ChevronLeft, ChevronRightOutlined } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveLink,
  selectIsSidebarOpen,
  setActiveLink,
  setIsSidebarOpen,
} from "../app/state";
import FlexBetween from "./FlexBetween";
import { useState } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavLinks from "./NavLinks";
import { useTranslation } from "../utils/translations";

const Sidebar = () => {
  const theme = useTheme();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { currentLanguage } = useTranslation();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isSidebarOpen = useSelector(selectIsSidebarOpen);
  const activeLink = useSelector(selectActiveLink);

  // useEffect(() => {
  //   dispatch(setActiveLink(pathname.substring(6)));
  // }, []);

  const navlinks = [
    { title: "Found" },
    { title: "Lost" },
    { title: "Returned" },
  ];

  return (
    <Box 
      display={isNonMobile ? "none" : "block"} 
      component="nav"
      sx={{
        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {isSidebarOpen && (
        <Drawer
          open={isSidebarOpen}
          onClose={() => dispatch(setIsSidebarOpen())}
          variant="persistent"
          anchor={currentLanguage === 'ar' ? 'right' : 'left'}
          sx={{
            width: "250px",
            "& .MuiDrawer-paper": {
              color: theme.palette.secondary.main,
              backgroundColor: theme.palette.background,
              boxSizing: "border-box",
              borderWidth: isNonMobile ? 0 : "2px",
              width: "250px",
              direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
            },
          }}
        >
          <Box width="100%">
            <Box m="1.5rem 2rem 2rem 3rem">
              <FlexBetween color={theme.palette.secondary.main}>
                <Box display="flex" alignItems="center" gap="0.5rem">
                  <Typography variant="h4" fontWeight="bold">
                    MAFKOUDAT
                  </Typography>
                </Box>
                {!isNonMobile && (
                  <IconButton
                    onClick={() => dispatch(setIsSidebarOpen(!isSidebarOpen))}
                  >
                    {currentLanguage === 'ar' ? <ChevronRightOutlined /> : <ChevronLeft />}
                  </IconButton>
                )}
              </FlexBetween>
            </Box>

            {/* navlinks */}
            <NavLinks />
          </Box>
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;
