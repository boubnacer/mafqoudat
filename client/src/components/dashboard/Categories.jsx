import { Box, Typography, useTheme, Grid, Card, CardContent, Chip, useMediaQuery, Button } from "@mui/material";
import { useGetCategoriesQuery } from "../../features/dependencies/dependenciesApiSlice";
import { LoadingState, DashboardEmptyStates } from "../LoadingStates";
import { getCategoryIcon, getCategoryColor, getCategoryBackgroundColor } from "../../config/categories";
import { useTranslation } from "../../utils/translations";
import { useLanguage } from "../../utils/languageContext";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useState } from "react";

const Categories = () => {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const { categories, isLoading, isFetching } = useGetCategoriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data, isLoading, isFetching }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
      isLoading,
      isFetching
    }),
  });

  const handleCategoryClick = (categoryId) => {
    // Navigate to posts page with category filter in URL state
    navigate("/dash/posts", { 
      state: { 
        categoryFilter: categoryId,
        fromCategory: true 
      } 
    });
    // Navigate with category filter
  };

  const toggleShowAllCategories = () => {
    setShowAllCategories(!showAllCategories);
  };

  if (!categories || isLoading || isFetching) return <LoadingState message={t('loadingCategories')} />;

  // Determine how many categories to show
  const categoriesToShow = showAllCategories ? categories : categories.slice(0, 4);
  const hasMoreCategories = categories.length > 4;

  return (
    <Box sx={{ py: 4 }}>
      <Grid container spacing={isMobile ? 2 : 3} justifyContent="center">
        {categoriesToShow.map(({ _id, code, labels }, index) => {
          const IconComponent = getCategoryIcon(code);
          const iconColor = getCategoryColor(code);
          const backgroundColor = getCategoryBackgroundColor(code);
          
          return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={_id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  onClick={() => handleCategoryClick(_id)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      backgroundColor: backgroundColor,
                      '& .category-icon': {
                        transform: 'scale(1.1)',
                        color: iconColor
                      }
                    }
                  }}
                >
                  <CardContent
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1
                    }}
                  >
                    <Box
                      className="category-icon"
                      sx={{
                        mb: 2,
                        transition: 'all 0.3s ease',
                        color: iconColor,
                        fontSize: '2rem'
                      }}
                    >
                      <IconComponent sx={{ fontSize: 'inherit' }} />
                    </Box>
                    
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.textColor.main,
                        textAlign: 'center',
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                      }}
                    >
                      {labels[currentLanguage] || labels.en}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
      
      {hasMoreCategories && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Button
            onClick={toggleShowAllCategories}
            variant="contained"
            endIcon={showAllCategories ? <ExpandLess /> : <ExpandMore />}
            sx={{
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #1A6EEE 30%, #013BA4 90%)'
                : 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
              color: '#fff',
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 15px rgba(26, 110, 238, 0.3)'
                : '0 4px 15px rgba(74, 139, 255, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #2A7EFF 30%, #1A6EEE 90%)'
                  : 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                transform: 'translateY(-2px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 6px 20px rgba(26, 110, 238, 0.4)'
                  : '0 6px 20px rgba(74, 139, 255, 0.4)',
              }
            }}
          >
            {showAllCategories ? t('showLess') : t('showAllCategories')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Categories;