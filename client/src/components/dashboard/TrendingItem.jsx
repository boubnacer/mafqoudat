import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import {
  MoreVert,
  Favorite,
  Share,
  TrendingUpOutlined,
  LocationOnOutlined,
  KeyboardArrowRightOutlined,
} from "@mui/icons-material";
import ma from "../../img/ma.jpg";
import { WhatshotOutlined } from "@mui/icons-material";
import FlexBetween from "../FlexBetween";
import RenderIcon from "../RenderIcon";
import Divider from "@mui/material/Divider";

const TrendingItem = ({ trend, isLoading }) => {
  const { categoryName, floptionName, region, image, createdAt, updatedAt } =
    trend[0] || {};
  const theme = useTheme();

  console.log(isLoading);

  const created = new Date(createdAt).toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Box flex={1.3} borderRadius="0.55rem">
      <Card
        sx={{
          backgroundColor: "#3C3C3C",
          // position: "relative",
          display: "flex",
          // boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",

          // boxShadow:
          //   "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px",

          border: "1px solid #333333",
          borderRadius: "0.55rem",
        }}
        variant="soft"
      >
        <Box sx={{ position: "relative" }} flex={1}>
          <CardContent>
            <FlexBetween>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor:
                    categoryName === "Bag"
                      ? theme.palette.categories.bagcate.icon
                      : categoryName === "keys"
                      ? theme.palette.categories.keyscate.icon
                      : categoryName === "person"
                      ? theme.palette.categories.personcate.icon
                      : categoryName === "Money"
                      ? theme.palette.categories.moneycate.icon
                      : categoryName === "Devices"
                      ? theme.palette.categories.devicecate.icon
                      : categoryName === "Wallet"
                      ? theme.palette.categories.walletcate.icon
                      : categoryName === "Vehicle"
                      ? theme.palette.categories.vehiclecate.icon
                      : categoryName === "Document"
                      ? theme.palette.categories.documentcate.icon
                      : theme.palette.categories.bagcate.icon,
                  padding: "0 1rem",
                  borderRadius: "5px",
                  gap: "0.5rem",
                }}
              >
                {/* <RenderIcon name={categoryName} / */}
                <Box
                  sx={
                    {
                      // backgroundColor: theme.palette.category,
                      // padding: "0rem 0.8rem",
                      // borderRadius: "9px",
                    }
                  }
                >
                  <Typography
                    variant="category"
                    sx={{
                      color: "#FFFFFF",
                      // categoryName === "Bag"
                      //   ? theme.palette.categories.bagcate.icon
                      //   : categoryName === "keys"
                      //   ? theme.palette.categories.keyscate.icon
                      //   : categoryName === "person"
                      //   ? theme.palette.categories.personcate.icon
                      //   : categoryName === "Money"
                      //   ? theme.palette.categories.moneycate.icon
                      //   : categoryName === "Devices"
                      //   ? theme.palette.categories.devicecate.icon
                      //   : categoryName === "Wallet"
                      //   ? theme.palette.categories.walletcate.icon
                      //   : categoryName === "Vehicle"
                      //   ? theme.palette.categories.vehiclecate.icon
                      //   : categoryName === "Document"
                      //   ? theme.palette.categories.documentcate.icon
                      //   : theme.palette.text.white,
                    }}
                  >
                    {categoryName}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: theme.palette.action.back,
                  padding: "0 1rem",
                  borderRadius: "50px",
                  gap: "0.5rem",
                }}
              >
                <Typography
                  sx={{
                    color:
                      floptionName === "Found"
                        ? theme.palette.floptions.found.text
                        : theme.palette.floptions.lost.text,

                    fontSize: "14px",
                  }}
                  variant="floption"
                >
                  {floptionName}
                </Typography>
                <RenderIcon name={`${floptionName}fl`} />
              </Box>
            </FlexBetween>

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
              <Box
                sx={{
                  backgroundColor: "#242526",
                  p: "5px",
                  display: "flex",
                  justifyContent: "center",
                  borderRadius: "5px",
                }}
              >
                <RenderIcon name="location" />
              </Box>
              <Box>
                <Typography
                  ml="8px"
                  // variant="h5"
                  component="div"
                  fontWeight="500"
                  sx={{
                    color: "#FFFFFF",
                    fontSize: "15px",
                  }}
                >
                  {region}
                </Typography>
              </Box>
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
                mt: "0.5rem",
                width: "fit-content",
              }}
            >
              <Box
                sx={{
                  backgroundColor: "#242526",
                  p: "5px",
                  display: "flex",
                  justifyContent: "center",
                  borderRadius: "5px",
                }}
              >
                <RenderIcon name="time" />
              </Box>
              <Box>
                <Typography
                  ml="8px"
                  // variant="h5"
                  component="div"
                  fontWeight="500"
                  sx={{
                    color: "#FFFFFF",
                    fontSize: "15px",
                  }}
                >
                  15/03/2023
                </Typography>
              </Box>
            </Box>

            {/* <Typography
              sx={{
                color: theme.palette.text.description,
                mt: "3.5rem",
                ml: "5px",
                fontSize: "12px",
              }}
            >
              {created}
            </Typography> */}

            <Divider
              sx={{
                mt: "4.5rem",
              }}
            />

            <CardActions
              sx={{
                // backgroundColor: theme.palette.action.back,
                position: "absolute",
                bottom: "0",
                left: "0",
                display: "flex",
                justifyContent: "flex-end",
                // padding: "1rem",
                gap: "1rem",
                width: "100%",

                // ml: "5px",
              }}
              // disableSpacing
            >
              {/* <FlexBetween> */}
              {/* <Box sx={{ ml: "5px" }}>
                <IconButton
                  aria-label="share"
                  sx={{
                    marginRight: "0.5rem",
                    // backgroundColor: theme.palette.action.main,
                  }}
                >
                  <RenderIcon name="share" />
                </IconButton>
              </Box> */}
              <Box>
                <Button
                  sx={{
                    color: theme.palette.textColor.main,
                    // backgroundColor: theme.palette.action.main,
                    textTransform: "none",
                  }}
                  endIcon={<RenderIcon name="view" />}
                >
                  learn more
                </Button>
              </Box>
              {/* </FlexBetween> */}
            </CardActions>
          </CardContent>
        </Box>
        <Box sx={{ position: "relative" }} flex={1.2}>
          <CardMedia
            component="img"
            height="250"
            image={image ? `http://localhost:3500/${image}` : ma}
            title={image}
            sx={{
              borderRadius: "0 10px 10px 0",
              // padding: "5px",
              objectFit: "cover",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: "8px",
              right: "8px",
              backgroundColor:
                categoryName === "Bag"
                  ? theme.palette.categories.bagcate.back
                  : categoryName === "keys"
                  ? theme.palette.categories.keyscate.back
                  : categoryName === "person"
                  ? theme.palette.categories.personcate.back
                  : categoryName === "Money"
                  ? theme.palette.categories.moneycate.back
                  : categoryName === "Devices"
                  ? theme.palette.categories.devicecate.back
                  : categoryName === "Wallet"
                  ? theme.palette.categories.walletcate.back
                  : categoryName === "Vehicle"
                  ? theme.palette.categories.vehiclecate.back
                  : categoryName === "Document"
                  ? theme.palette.categories.documentcate.back
                  : theme.palette.categories.bagcate.back,
              display: "flex",
              // justifyContent: "center",
              borderRadius: "50px",
            }}
          >
            <RenderIcon name={`${categoryName}rece`} />
          </Box>
          <Box
            sx={{
              position: "absolute",
              bottom: "5px",
              right: "5px",
              // backgroundColor: theme.palette.category,
              // display: "flex",
              // justifyContent: "center",
            }}
          >
            {/* <RenderIcon name="fire" /> */}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default TrendingItem;
