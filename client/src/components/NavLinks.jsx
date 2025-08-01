import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  Tooltip,
  Box,
} from "@mui/material";
import React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  selectActiveLink,
  selectFoundOrLost,
  setActiveLink,
  setFoundOrLost,
} from "../app/state";
import RenderIcon from "./RenderIcon";
import { getCurrentLanguage, t } from "../utils/languageUtils";

const NAV_REGEX = /^\/dash\/posts(\/)?$/;
const HOME_REGEX = /^\/dash(\/)?$/;

const NavLinks = () => {
  const theme = useTheme();
  const currentLanguage = getCurrentLanguage();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeLink = useSelector(selectActiveLink);
  const foundOrlost = useSelector(selectFoundOrLost);

  useEffect(() => {
    dispatch(
      setActiveLink({
        active: HOME_REGEX.test(pathname)
          ? "HOME"
          : foundOrlost === "" && NAV_REGEX.test(pathname)
          ? t("all")
          : foundOrlost,
      })
    );
  }, [pathname, activeLink]);

  const navlinks = [
    { 
      title: t("home"), 
      flcode: t("home"),
      tooltip: t("goToDashboard"),
      icon: "home"
    },
    { 
      title: t("all"), 
      flcode: t("all"),
      tooltip: t("viewAllPosts"),
      icon: "total"
    },
    { 
      title: t("found"), 
      flcode: "66e60c25420ca2a42499b924",
      tooltip: t("viewFoundItems"),
      icon: "Found"
    },
    { 
      title: t("lost"), 
      flcode: "63cc3484bc901245d3a1cb5a",
      tooltip: t("viewLostItems"),
      icon: "Lost"
    },
  ];

  return (
    <List
      sx={{
        display: { xs: "grid", md: "flex" },
        borderRadius: "50px",
        gap: "1rem",
        padding: "0.5rem",
        background: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(0, 0, 0, 0.05)',
      }}
    >
      {navlinks.map(({ title, flcode, tooltip, icon }) => (
        <ListItem key={title} disablePadding>
          <Tooltip 
            title={tooltip}
            placement="bottom"
            arrow
          >
            <ListItemButton
              onClick={() => {
                navigate("/dash/posts");
                dispatch(
                  setFoundOrLost({
                    foundOrlost: title === t("all") ? "" : flcode,
                  })
                );
                dispatch(setActiveLink({ active: title }));
              }}
              sx={{
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                backgroundColor: activeLink === flcode 
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)'
                  : 'transparent',
                borderRadius: { xs: "8px", md: "50px" },
                height: "2.5rem",
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)',
                },
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <RenderIcon name={icon} />
              <ListItemText
                primary={title}
                primaryTypographyProps={{
                  fontSize: "14px",
                  fontWeight: activeLink === flcode ? "600" : "500",
                }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      ))}
    </List>
  );
};

export default NavLinks;
