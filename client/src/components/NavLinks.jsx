import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  Tooltip,
  Box,
  alpha,
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
import { useTranslation } from "../utils/translations";

const NavLinks = ({ onLinkClick }) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const activeLink = useSelector(selectActiveLink);
  const foundOrlost = useSelector(selectFoundOrLost);

  // Simple hardcoded navigation links
  const navlinks = [
    { 
      title: t("all"), 
      flcode: "",
      tooltip: t("viewAllPosts"),
      icon: "total"
    },
    {
      title: "Found",
      flcode: "68b0b776dcafb50aec949f68",
      tooltip: t("viewFOUNDItems"),
      icon: "Found"
    },
    {
      title: "Lost", 
      flcode: "68b0b776dcafb50aec949f69",
      tooltip: t("viewLOSTItems"),
      icon: "Lost"
    }
  ];

  const handleLinkClick = (link) => {
    console.log('NavLinks: Clicking on', link.title, 'with flcode:', link.flcode);
    
    // Set Redux state
    dispatch(setFoundOrLost({ foundOrlost: link.flcode }));
    dispatch(setActiveLink({ active: link.title }));
    
    // Also set in localStorage for immediate access
    localStorage.setItem('currentFilter', link.flcode);
    
    // Navigate to posts
    navigate("/dash/posts");
    
    // Close mobile menu if callback provided
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <List
      sx={{
        display: "flex",
        borderRadius: "12px",
        gap: { xs: "0.25rem", sm: "0.25rem" },
        padding: { xs: "0.25rem", sm: "0.25rem" },
        background: onLinkClick 
          ? 'transparent' 
          : theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(0, 0, 0, 0.03)',
        flexWrap: onLinkClick ? "wrap" : "nowrap",
        justifyContent: onLinkClick ? "flex-start" : "center",
        alignItems: "center",
        minWidth: 0,
        maxWidth: onLinkClick ? "100%" : "fit-content",
        border: onLinkClick ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        flexDirection: onLinkClick ? "column" : "row",
        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
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
              onClick={() => handleLinkClick({ title, flcode })}
              sx={{
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                backgroundColor: activeLink === title 
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)'
                  : 'transparent',
                borderRadius: "12px",
                height: onLinkClick ? "3rem" : { xs: "2.5rem", sm: "2.25rem" },
                minHeight: onLinkClick ? "3rem" : { xs: "2.5rem", sm: "2.25rem" },
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)',
                },
                display: 'flex',
                alignItems: 'center',
                gap: { xs: '0.75rem', sm: '0.75rem' },
                px: onLinkClick ? 2 : { xs: 1.5, sm: 1.5 },
                py: onLinkClick ? 1 : { xs: 0.75, sm: 0.75 },
                minWidth: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <RenderIcon name={icon} sx={{ fontSize: onLinkClick ? '22px' : { xs: '18px', sm: '18px' } }} />
              <ListItemText
                primary={title}
                primaryTypographyProps={{
                  fontSize: onLinkClick ? "16px" : { xs: "14px", sm: "14px" },
                  fontWeight: activeLink === title ? "600" : "500",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
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
