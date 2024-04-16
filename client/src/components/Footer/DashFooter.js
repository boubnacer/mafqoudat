import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

import "./footer.css";
import { Typography, useTheme, Box } from "@mui/material";

const DashFooter = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { username, country } = useAuth();

  const theme = useTheme();

  const onGoHomeClicked = () => navigate("/dash");

  let goHomeButton = null;
  if (pathname !== "/dash") {
    goHomeButton = (
      <button title="Home" onClick={onGoHomeClicked}>
        <FontAwesomeIcon icon={faHouse} />
      </button>
    );
  }

  const content = (
    <Box
      sx={{
        backgroundColor: theme.palette.action.back,
        padding: "6%",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          gap: "5rem",
        }}
      >
        {/* left side : logo, socials and description */}
        <Box>
          <Typography>mafkoudat</Typography>
          <Typography>facebook</Typography>
          <Typography>instagram</Typography>
          <Typography>whatsapp</Typography>
        </Box>
        <Box>
          {/* ligal  */}
          <Typography>privacy policy</Typography>
          <Typography>Terms of use</Typography>
          <Typography>cookie notice</Typography>
          <Typography>contact us</Typography>
        </Box>
        {/* follow us  */}
        <Box>
          <Typography>facebook</Typography>
          <Typography>instagram</Typography>
          <Typography>whatsapp</Typography>
        </Box>
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: "0",
          right: "0",
          backgroundColor: theme.palette.action.back,
          width: "100%",
        }}
      >
        <Box
          sx={{
            textAlign: "center",
            padding: "1rem",
            borderTop: "1px solid #333333",
          }}
        >
          <Typography>@2024 mafkoudat, All Right Reserved</Typography>
        </Box>
      </Box>
    </Box>
  );
  return content;
};
export default DashFooter;
