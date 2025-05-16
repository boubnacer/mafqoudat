import {
  Box,
  Typography,
  useTheme,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import ma from "../../img/ma.jpg";

import { Link, useNavigate } from "react-router-dom";
import FlexBetween from "../FlexBetween";
import {
  KeyboardArrowRightOutlined,
  LocationOnOutlined,
} from "@mui/icons-material";
import RenderIcon from "../RenderIcon";

const RecentPosts = ({ _id, categoryname, region, image, createdAt }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  

  const handleEdit = () => navigate(`/dash/posts/${_id}`);

  const created = new Date(createdAt).toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    // <Link to={`/dash/posts/${_id}`}>
    <Card
      sx={{
        backgroundColor: "#242526",
        position: "relative",
        // padding: "5px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        height: "20rem",
        // border: "1px solid #333333",
      }}
      variant="soft"
    >
      <Box
        sx={{
          position: "absolute",
          top: "8px",
          right: "8px",
          // clipPath: "polygon(0 0, 100% 0%, 75% 100%, 0% 100%)",
          // width: "20%",
          backgroundColor:
            categoryname === "Bag"
              ? theme.palette.categories.bagcate.back
              : categoryname === "keys"
              ? theme.palette.categories.keyscate.back
              : categoryname === "person"
              ? theme.palette.categories.personcate.back
              : categoryname === "Money"
              ? theme.palette.categories.moneycate.back
              : categoryname === "Devices"
              ? theme.palette.categories.devicecate.back
              : categoryname === "Wallet"
              ? theme.palette.categories.walletcate.back
              : categoryname === "Vehicle"
              ? theme.palette.categories.vehiclecate.back
              : categoryname === "Document"
              ? theme.palette.categories.documentcate.back
              : theme.palette.categories.bagcate.back,
          display: "flex",
          // justifyContent: "center",
          borderRadius: "50px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <RenderIcon name={`${categoryname}rece`} />
      </Box>
      <CardMedia
        sx={{ height: 150, borderRadius: "5px 5px 0 0" }}
        image={image ? `http://localhost:3500/${image}` : ma}
        title={image}
      />
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
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
              <RenderIcon name="locat" />
              <Typography
                ml="8px"
                // variant="h5"
                component="div"
                fontWeight="500"
                sx={{ color: "#A8ABAF", fontSize: "14px" }}
              >
                {region}
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
                mt: "0.5rem",
                width: "fit-content",
              }}
            >
              <RenderIcon name="timerace" />
              <Typography
                ml="8px"
                // variant="h5"
                component="div"
                fontWeight="500"
                sx={{ color: "#A8ABAF", fontSize: "14px" }}
              >
                15/03/2023
              </Typography>
            </Box>
          </Box>
          <Box>
            <Box
              sx={{
                backgroundColor:
                  categoryname === "Bag"
                    ? theme.palette.categories.bagcate.icon
                    : categoryname === "keys"
                    ? theme.palette.categories.keyscate.icon
                    : categoryname === "person"
                    ? theme.palette.categories.personcate.icon
                    : categoryname === "Money"
                    ? theme.palette.categories.moneycate.icon
                    : categoryname === "Devices"
                    ? theme.palette.categories.devicecate.icon
                    : categoryname === "Wallet"
                    ? theme.palette.categories.walletcate.icon
                    : categoryname === "Vehicle"
                    ? theme.palette.categories.vehiclecate.icon
                    : categoryname === "Document"
                    ? theme.palette.categories.documentcate.icon
                    : "",
                padding: "0 1rem",
                borderRadius: "50px",
              }}
            >
              <Typography
                variant="category"
                sx={{
                  color: "#ffffff",
                  // categoryname === "Bag"
                  //   ? theme.palette.categories.bagcate.icon
                  //   : categoryname === "keys"
                  //   ? theme.palette.categories.keyscate.icon
                  //   : categoryname === "person"
                  //   ? theme.palette.categories.personcate.icon
                  //   : categoryname === "Money"
                  //   ? theme.palette.categories.moneycate.icon
                  //   : categoryname === "Devices"
                  //   ? theme.palette.categories.devicecate.icon
                  //   : categoryname === "Wallet"
                  //   ? theme.palette.categories.walletcate.icon
                  //   : categoryname === "Vehicle"
                  //   ? theme.palette.categories.vehiclecate.icon
                  //   : categoryname === "Document"
                  //   ? theme.palette.categories.documentcate.icon
                  //   : theme.palette.text.white,
                }}
              >
                {categoryname}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.description,
            mt: "1rem",
            ml: "5px",
          }}
        >
          {created}
        </Typography> */}
      </CardContent>
      <Divider variant="middle" sx={{ mt: "2rem" }} />
      <CardActions
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          // marginTop: "1rem",
          // backgroundColor: theme.palette.action.back,
          position: "absolute",
          bottom: "0",
          width: "100%",
        }}
      >
        <Button
          onClick={handleEdit}
          sx={{
            color: theme.palette.text.white,
            // backgroundColor: theme.palette.action.main,
            // width: "6rem",
            textTransform: "none",
          }}
          endIcon={<RenderIcon name="view" />}
        >
          learn more
        </Button>
      </CardActions>
    </Card>
    // </Link>
  );
};

export default RecentPosts;