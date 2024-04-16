import { Box, CardMedia, Typography, useTheme } from "@mui/material";
import ma from "../../img/ma.jpg";
import FlexCenter from "../FlexCenter";
import { useGetCategoriesQuery } from "../../features/dependencies/dependenciesApiSlice";
import { Code, PersonOutlined } from "@mui/icons-material";
import keys from "../../img/keys.png";
import baggy from "../../img/baggy.png";
import PulseLoader from "react-spinners/PulseLoader";
import RenderIcon from "../RenderIcon";

const Categories = () => {
  const { categories } = useGetCategoriesQuery("categoriesList", {
    selectFromResult: ({ data }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  const theme = useTheme();

  if (!categories) return <PulseLoader color={"#FFF"} />;

  return (
    <Box textAlign="center">
      {/* <Typography variant="h3">Categories</Typography> */}
      <Box
        // width="98%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        // gridTemplateColumns="repeat(8, 1fr)"
        gap="2rem"
        p="2rem 0"
      >
        {categories.map(({ flag, code }) => {
          return (
            <Box
              key={Code}
              sx={{
                cursor: "pointer",
                background:
                  code === "Bag"
                    ? "linear-gradient(to top,#1ABC9C , rgba(26, 188, 156, 0))"
                    : code === "keys"
                    ? "linear-gradient(to top, #BDC3C7, rgba(189, 195, 199, 0))"
                    : code === "person"
                    ? "linear-gradient(to top, #9B59B6, rgba(155, 89, 182, 0))"
                    : code === "Money"
                    ? "linear-gradient(to top, #00796b, rgba(0, 121, 107, 0))"
                    : code === "Devices"
                    ? "linear-gradient(to top, #00707c, rgba(155, 89, 182, 0))"
                    : code === "Wallet"
                    ? "linear-gradient(to top, #6a00a3, rgba(155, 89, 182, 0))"
                    : code === "Vehicle"
                    ? "linear-gradient(to top, #9b4d9b, rgba(155, 89, 182, 0))"
                    : code === "Document"
                    ? "linear-gradient(to top, #4682B4, rgba(155, 89, 182, 0))"
                    : theme.palette.categories.bagcate.back,
                padding: "1rem",
                borderRadius: "5px",
                width: "8rem",
              }}
            >
              <Box>
                <RenderIcon name={`${code}cate`} />
              </Box>
              <Typography
                mt="0.5rem"
                fontWeight="400"
                variant="category"
                sx={{
                  color:
                    code === "Bag"
                      ? theme.palette.categories.bagcate.icon
                      : code === "keys"
                      ? theme.palette.categories.keyscate.icon
                      : code === "person"
                      ? theme.palette.categories.personcate.icon
                      : code === "Money"
                      ? theme.palette.categories.moneycate.icon
                      : code === "Devices"
                      ? theme.palette.categories.devicecate.icon
                      : code === "Wallet"
                      ? theme.palette.categories.walletcate.icon
                      : code === "Vehicle"
                      ? theme.palette.categories.vehiclecate.icon
                      : code === "Document"
                      ? theme.palette.categories.documentcate.icon
                      : theme.palette.text.white,
                  fontSize: "18px",
                }}
              >
                {code}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Categories;
