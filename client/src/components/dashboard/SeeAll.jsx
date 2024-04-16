import {
  Add,
  ArrowRightAlt,
  KeyboardArrowRightOutlined,
} from "@mui/icons-material";
import { Box, Button, IconButton, useTheme } from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveLink, setFoundOrLost } from "../../app/state";
import PulseLoader from "react-spinners/PulseLoader";
import RenderIcon from "../RenderIcon";

const SeeAll = ({ foundOrlostId, totalItems }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const hanldeAddNewPost = () => navigate("/dash/posts/new");

  const hanldeSeeAllPosts = ({ foundOrlostId }) => {
    navigate("/dash/posts");
    dispatch(
      setFoundOrLost({
        foundOrlost: foundOrlostId,
      })
    );
    dispatch(setActiveLink({ active: foundOrlostId }));
  };

  const iconStyle = {
    // color: "#000",
    // borderRadius: "50%",
  };

  // if (!foundOrlostId || !totalItems) return <PulseLoader color={"#FFF"} />;

  return (
    <Box
      sx={
        totalItems > 4
          ? {
              position: "absolute",
              right: "3rem",
              // top: "12%",
              // backgroundColor: theme.palette.primary.main,
              borderRadius: "2px",
              width: "10%",
              justifyContent: "center",
              display: "flex",
            }
          : {
              width: "10%",
              // backgroundColor: theme.palette.primary.main,
              borderRadius: "2px",
              justifyContent: "center",
              display: "flex",
            }
      }
    >
      <Button
        endIcon={
          totalItems > 4 ? <RenderIcon name="seeall" /> : <Add sx={iconStyle} />
        }
        onClick={
          totalItems > 4
            ? () => hanldeSeeAllPosts({ foundOrlostId })
            : hanldeAddNewPost
        }
        sx={{
          color: theme.palette.text.white,
          padding: "0.5rem 1rem",
          fontSize: "14px",
          border: "1px solid #333333",
        }}
      >
        {totalItems > 4 ? "See all" : "Add"}
      </Button>
    </Box>
  );
};

export default SeeAll;
