import { Box, Typography, useTheme } from "@mui/material";
import { useGetCategoriesQuery } from "../../features/dependencies/dependenciesApiSlice";
import PulseLoader from "react-spinners/PulseLoader";
import RenderIcon from "../RenderIcon";

const Categories = () => {
  const { categories } = useGetCategoriesQuery("categoriesList", {
    selectFromResult: ({ data }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  const theme = useTheme();

  if (!categories) return <PulseLoader color={theme.palette.text.primary} />;

  return (
    <Box textAlign="center" sx={{ py: 4 }}>
      <Box
        display="flex"
        justifyContent="center"
        flexWrap="wrap"
        gap={3}
        px={2}
      >
        {categories.map(({ code }) => (
          <Box
            key={code}
            sx={{
              cursor: "pointer",
              background: theme.palette.categories[`${code.toLowerCase()}cate`]?.back || 
                        theme.palette.categories.back,
              padding: 3,
              borderRadius: 2,
              width: 120,
              height: 120,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: theme.shadows[2],
              transition: "all 0.3s ease",
              '&:hover': {
                transform: "translateY(-5px)",
                boxShadow: theme.shadows[6],
              }
            }}
          >
            <Box sx={{ 
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <RenderIcon name={`${code.toLowerCase()}cate`} />
            </Box>
            <Typography
              mt={1.5}
              fontWeight={500}
              variant="category"
              sx={{
                color: theme.palette.categories[`${code.toLowerCase()}cate`]?.icon || 
                      theme.palette.text.primary,
                fontSize: "1rem",
              }}
            >
              {code}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Categories;
