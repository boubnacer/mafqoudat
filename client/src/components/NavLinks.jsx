import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
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
import { useTranslation } from "react-i18next";

const NAV_REGEX = /^\/dash\/posts(\/)?$/;
const HOME_REGEX = /^\/dash(\/)?$/;

const NavLinks = () => {
  const theme = useTheme();
  const { t } = useTranslation();

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
          ? t("ALL")
          : foundOrlost,
      })
    );
  }, [pathname, activeLink]);

  const navlinks = [
    { title: t("HOME"), flcode: t("HOME") },

    { title: t("ALL"), flcode: t("ALL") },
    // { title: "Home", flcode: "Home" },
    { title: t("FOUND"), flcode: "63cc34613e5e7407436e09a5" },
    { title: t("LOST"), flcode: "63cc3484bc901245d3a1cb5a" },
    // { title: t("Returned"), flcode: "Returned" },
  ];
  return (
    <List
      sx={{
        display: { xs: "grid", md: "flex" },
        // ml: "2rem",
        // backgroundColor: theme.palette.action.back,
        // p: "0.5rem 0.5rem",
        borderRadius: "50px",
        gap: "1rem",
      }}
    >
      {navlinks.map(({ title, flcode }) => (
        <ListItem key={title} disablePadding>
          <ListItemButton
            onClick={() => {
              navigate("/dash/posts");
              dispatch(
                setFoundOrLost({
                  foundOrlost: title === t("ALL") ? "" : flcode,
                })
              );
              dispatch(setActiveLink({ active: title }));
            }}
            sx={{
              color:
                activeLink === flcode
                  ? theme.palette.textColor.links
                  : theme.palette.textColor.links,
              backgroundColor:
                activeLink === flcode ? theme.palette.category : "transparent",
              // borderBottom:
              //   activeLink === flcode
              //     ? `2px solid ${theme.palette.category}`
              //     : "transparent",
              borderRadius: { xs: "none", md: "50px" },
              height: "1.5rem",
            }}
          >
            <ListItemText
              primary={title}
              primaryTypographyProps={{
                fontSize: "14px",
                fontWeight: "500",
                padding: "0rem 0.5rem",
              }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default NavLinks;
