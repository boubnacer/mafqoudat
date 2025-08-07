import { Box, Typography, useTheme, Grid, Card, CardContent, Chip, useMediaQuery, Button } from "@mui/material";
import { useGetCategoriesQuery } from "../../features/dependencies/dependenciesApiSlice";
import { LoadingState, DashboardEmptyStates } from "../LoadingStates";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { useLanguage } from "../../utils/languageContext";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setActiveLink, setFoundOrLost, setCategoryFilter } from "../../app/state";
import { motion } from "framer-motion";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useState } from "react";

const Categories = () => {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  // Function to map database category codes to icon names
  const getIconName = (categoryCode) => {
    const iconMapping = {
      'ELECTRONICS': 'devicecate',
      'DOCUMENTS': 'documentcate',
      'JEWELRY': 'moneycate',
      'CLOTHING': 'bagcate',
      'PETS': 'personcate',
      'VEHICLES': 'vehiclecate',
      'WALLET': 'walletcate',
      'KEYS': 'keyscate',
      // Fallback mappings for any variations
      'DEVICE': 'devicecate',
      'DOCUMENT': 'documentcate',
      'MONEY': 'moneycate',
      'BAG': 'bagcate',
      'PERSON': 'personcate',
      'VEHICLE': 'vehiclecate'
    };
    
    return iconMapping[categoryCode] || 'bagcate'; // Default fallback
  };
  
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
    console.log('Navigating with category filter:', categoryId);
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
        {categoriesToShow.map(({ _id, code, labels }, index) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={_id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
            >
              <Card
                onClick={() => handleCategoryClick(_id)}
                sx={{
                  cursor: "pointer",
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(18,18,18,0.95) 0%, rgba(28,28,28,0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 32px 0 rgba(0,0,0,0.15)'
                    : '0 8px 32px 0 rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  height: '100%',
                  minHeight: isMobile ? 120 : 140,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 16px 48px 0 rgba(0,0,0,0.25)'
                      : '0 16px 48px 0 rgba(0,0,0,0.1)',
                  }
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    padding: isMobile ? 2 : 3,
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: isMobile ? 48 : 56,
                      height: isMobile ? 48 : 56,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: '16px',
                      background: theme.palette.categories[getIconName(code)]?.back || 
                                theme.palette.categories.back,
                      marginBottom: isMobile ? 1.5 : 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <RenderIcon 
                      name={getIconName(code)} 
                      sx={{
                        fontSize: isMobile ? '24px' : '28px',
                        color: theme.palette.categories[getIconName(code)]?.icon || 
                               theme.palette.categories.text,
                      }}
                    />
                  </Box>
                  
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
                      fontSize: isMobile ? '0.85rem' : '0.95rem',
                      lineHeight: 1.3,
                      marginBottom: 1,
                    }}
                  >
                    {labels?.[currentLanguage] || t(code?.toLowerCase()) || code}
                  </Typography>
                  
                  <Chip
                    label={t('view')}
                    size="small"
                    sx={{
                      background: theme.palette.categories[getIconName(code)]?.icon || 
                                theme.palette.categories.text,
                      color: '#fff',
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      fontWeight: 500,
                      '&:hover': {
                        background: theme.palette.categories[getIconName(code)]?.icon || 
                                  theme.palette.categories.text,
                        opacity: 0.8,
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      
      {/* Show All Categories Button */}
      {hasMoreCategories && (
        <Box 
          display="flex" 
          justifyContent="center" 
          mt={3}
          sx={{
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
          }}
        >
          <Button
            variant="outlined"
            onClick={toggleShowAllCategories}
            startIcon={showAllCategories ? <ExpandLess /> : <ExpandMore />}
            sx={{
              borderRadius: '25px',
              px: 3,
              py: 1.5,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.main,
                color: '#fff',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
              transition: 'all 0.3s ease',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 500,
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