import React from "react";
import { KeyboardArrowRight } from "@mui/icons-material";
import { Button, alpha, useTheme } from "@mui/material";
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

  const tone = type === "found" ? theme.custom.status.found : theme.custom.status.lost;

  const handleSeeAll = () => {
    navigate(`/posts?fl=${foundOrlostId}`);
    dispatch(setFoundOrLost({ foundOrlost: foundOrlostId }));
    dispatch(setActiveLink({ active: foundOrlostId }));
  };

  return (
    <Button
      onClick={handleSeeAll}
      endIcon={
        <KeyboardArrowRight
          sx={{ transform: theme.direction === "rtl" ? "scaleX(-1)" : "none", fontSize: 18 }}
        />
      }
      sx={{
        textTransform: "none",
        fontFamily: theme.custom.font.body,
        fontWeight: 700,
        fontSize: { xs: "0.82rem", sm: "0.875rem" },
        borderRadius: "999px",
        color: tone.main,
        flexShrink: 0,
        px: { xs: 1.25, sm: 1.75 },
        py: { xs: 0.35, sm: 0.5 },
        backgroundColor: isDark ? "rgba(30, 41, 59, 0.6)" : "rgba(241, 245, 249, 0.8)",
        border: isDark ? "1px solid rgba(51, 65, 85, 0.6)" : "1px solid rgba(226, 232, 240, 0.9)",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: isDark ? alpha(tone.main, 0.2) : alpha(tone.main, 0.12),
          borderColor: tone.main,
          transform: "translateY(-1px)",
        },
      }}
    >
      {t("seeAll")}
    </Button>
  );
};

export default SeeAll;
