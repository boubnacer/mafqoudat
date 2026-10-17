import React from "react";
import { Button, useTheme } from "@mui/material";
import { ArrowOutwardRounded } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveLink, setFoundOrLost } from "../../app/state";
import { useTranslation } from "../../utils/translations";
import { isRTL } from "../../utils/languageUtils";

const SeeAll = ({ foundOrlostId, totalItems, type = "found" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = currentLanguage === "ar" || isRTL(currentLanguage);

  if (!totalItems) return null;

  const handleSeeAll = () => {
    navigate(`/posts?fl=${foundOrlostId}`);
    dispatch(setFoundOrLost({ foundOrlost: foundOrlostId }));
    dispatch(setActiveLink({ active: foundOrlostId }));
  };

  return (
    <Button
      onClick={handleSeeAll}
      endIcon={
        <ArrowOutwardRounded
          sx={{
            fontSize: { xs: 15, md: 13 },
            transform: isRTLMode ? "scaleX(-1)" : "none",
          }}
        />
      }
      sx={{
        textTransform: "none",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 600,
        fontSize: { xs: "14px", md: "13px" },
        letterSpacing: "0.01em",
        lineHeight: 1,
        color: isDark ? "#CBD5E1" : "#475569",
        px: { xs: 2, md: 1.5 },
        py: { xs: 1, md: 0.6 },
        minWidth: 0,
        minHeight: { xs: 44, md: 32 },
        borderRadius: "999px",
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.06)"
          : (theme.custom.color.surfaceNested || "#F1F5F9"),
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)"}`,
        transition:
          "background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease",
        "& .MuiButton-endIcon": {
          marginInlineStart: "6px",
          marginInlineEnd: 0,
        },
        "&:hover": {
          backgroundColor: isDark
            ? "rgba(11, 87, 208, 0.18)"
            : "#E8F0FE",
          color: isDark ? "#8AB4F8" : "#0B57D0",
          borderColor: isDark
            ? "rgba(138, 180, 248, 0.3)"
            : "rgba(11, 87, 208, 0.2)",
        },
        "&:active": {
          transform: "scale(0.97)",
        },
        "&:hover .MuiSvgIcon-root": {
          transform: isRTLMode
            ? "scaleX(-1) translate(-1.5px, -1.5px)"
            : "translate(1.5px, -1.5px)",
        },
        "& .MuiSvgIcon-root": {
          transition: "transform 160ms ease",
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.custom.color.brandPrimary || "#0B57D0"}`,
          outlineOffset: 1,
        },
      }}
    >
      {t("seeAll")}
    </Button>
  );
};

export default SeeAll;
