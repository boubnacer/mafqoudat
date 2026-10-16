import React from "react";
import { Button, useTheme } from "@mui/material";
import { ArrowOutwardRounded } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveLink, setFoundOrLost } from "../../app/state";
import { useTranslation } from "../../utils/translations";

const SeeAll = ({ foundOrlostId, totalItems, type = "found" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();

  if (!totalItems) return null;

  const handleSeeAll = () => {
    navigate(`/posts?fl=${foundOrlostId}`);
    dispatch(setFoundOrLost({ foundOrlost: foundOrlostId }));
    dispatch(setActiveLink({ active: foundOrlostId }));
  };

  return (
    <Button
      onClick={handleSeeAll}
      endIcon={<ArrowOutwardRounded sx={{ fontSize: 13 }} />}
      sx={{
        textTransform: "none",
        fontFamily: theme.custom.font.body,
        fontWeight: 600,
        fontSize: "12px",
        letterSpacing: 0.15,
        lineHeight: 1,
        color: isDark ? "#94A3B8" : "#64748B",
        px: 1,
        py: 0.5,
        minWidth: 0,
        borderRadius: "8px",
        backgroundColor: "transparent",
        border: "1px solid transparent",
        "& .MuiButton-endIcon": { ml: 0.5, mr: 0 },
        "&:hover": {
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)",
          color: theme.custom.color.ink,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
        },
        "&:hover .MuiSvgIcon-root": { transform: "translate(1px, -1px)" },
        "& .MuiSvgIcon-root": { transition: "transform 160ms ease" },
        "&:focus-visible": {
          outline: `2px solid ${theme.custom.color.brandPrimary}`,
          outlineOffset: 1,
        },
      }}
    >
      {t("seeAll")}
    </Button>
  );
};

export default SeeAll;
