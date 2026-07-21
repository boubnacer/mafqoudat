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
  const { t } = useTranslation();

  if (!totalItems) return null;

  const tone = type === "found" ? theme.custom.status.found : theme.custom.status.lost;

  const handleSeeAll = () => {
    navigate(`/dash/posts?fl=${foundOrlostId}`);
    dispatch(setFoundOrLost({ foundOrlost: foundOrlostId }));
    dispatch(setActiveLink({ active: foundOrlostId }));
  };

  return (
    <Button
      onClick={handleSeeAll}
      endIcon={
        <KeyboardArrowRight
          sx={{ transform: theme.direction === "rtl" ? "scaleX(-1)" : "none" }}
        />
      }
      sx={{
        textTransform: "none",
        fontWeight: 700,
        borderRadius: `${theme.custom.radius.md}px`,
        color: tone.main,
        flexShrink: 0,
        "&:hover": { backgroundColor: alpha(tone.main, 0.08) },
      }}
    >
      {t("seeAll")}
    </Button>
  );
};

export default SeeAll;
