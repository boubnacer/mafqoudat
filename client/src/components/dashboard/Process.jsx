import { Box, Typography, useTheme } from "@mui/material";
import ProcessSvg from "../../img/ProcessSvg.svg";
import RenderIcon from "../RenderIcon";

const Process = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "3rem",
      }}
    >
      {/* left side  */}
      <Box sx={{ padding: "5rem 0" }}>
        <Typography fontWeight="600" fontSize="20px">
          What we do
        </Typography>
        <Typography fontWeight="800" fontSize="20px" mt="1rem">
          After posting in the mafkoudat website
        </Typography>

        <Box mt="3rem">
          <Box
            display="flex"
            sx={{
              // backgroundColor: theme.palette.category,
              borderRadius: "50px",
              // padding: "0.2rem 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "fit-content",
            }}
          >
            <RenderIcon name="share" />
            <Typography
              ml="1rem"
              // variant="h5"
              component="div"
              sx={{ color: theme.palette.text.description, fontSize: "14px" }}
            >
              share to our socials
            </Typography>
          </Box>
          <Box
            display="flex"
            sx={{
              // backgroundColor: theme.palette.category,
              borderRadius: "50px",
              // padding: "0.2rem 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mt: "1rem",
              width: "fit-content",
            }}
          >
            <RenderIcon name="ad" />
            <Typography
              ml="1rem"
              // variant="h5"
              component="div"
              sx={{ color: theme.palette.text.description, fontSize: "14px" }}
            >
              make addvertising
            </Typography>
          </Box>

          <Box
            display="flex"
            sx={{
              // backgroundColor: theme.palette.category,
              borderRadius: "50px",
              // padding: "0.2rem 1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mt: "1rem",
              width: "fit-content",
            }}
          >
            <RenderIcon name="notif" />
            <Typography
              ml="1rem"
              // variant="h5"
              component="div"
              sx={{ color: theme.palette.text.description, fontSize: "14px" }}
            >
              w'll let you know | contact
            </Typography>
          </Box>
        </Box>
        <Box mt="3rem" display="flex" gap="1rem">
          <RenderIcon name="face" />
          <RenderIcon name="whats" />
          <RenderIcon name="x" />
          <RenderIcon name="insta" />
        </Box>
      </Box>

      {/* right side  */}
      <Box
        sx={{
          padding: "4rem 0",
          display: "flex",
          // justifyContent: "flex-end",
          alignItems: "center",
          // backgroundColor: "#ffffff",
        }}
      >
        <img src={ProcessSvg} />
      </Box>
    </Box>
  );
};

export default Process;
