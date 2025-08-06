import { Box, Typography, useTheme, Grid, Card, CardContent, Chip, useMediaQuery } from "@mui/material";
import { useGetCategoriesQuery } from "../../features/dependencies/dependenciesApiSlice";
import { LoadingState, DashboardEmptyStates } from "../LoadingStates";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { useLanguage } from "../../utils/languageContext";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setActiveLink } from "../../app/state";
import { motion } from "framer-motion";

const Categories = () => {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();
  
  const { categories, isLoading, isFetching } = useGetCategoriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data, isLoading, isFetching }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
      isLoading,
      isFetching
    }),
  });

  const handleCategoryClick = (categoryCode) => {
    // Navigate to posts page with category filter
    navigate("/dash/posts");
    dispatch(setActiveLink({ active: categoryCode }));
  };

  if (!categories || isLoading || isFetching) return <LoadingState message={t('loadingCategories')} />;

  return (
    <Box sx={{ py: 4 }}>
      <Grid container spacing={isMobile ? 2 : 3} justifyContent="center">
        {categories.map(({ code, labels }, index) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={code}>
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
                onClick={() => handleCategoryClick(code)}
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
                      background: theme.palette.categories[`${code.toLowerCase()}cate`]?.back || 
                                theme.palette.categories.back,
                      marginBottom: isMobile ? 1.5 : 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <RenderIcon 
                      name={`${code.toLowerCase()}cate`} 
                      sx={{
                        fontSize: isMobile ? '24px' : '28px',
                        color: theme.palette.categories[`${code.toLowerCase()}cate`]?.icon || 
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
                      background: theme.palette.categories[`${code.toLowerCase()}cate`]?.icon || 
                                theme.palette.categories.text,
                      color: '#fff',
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      fontWeight: 500,
                      '&:hover': {
                        background: theme.palette.categories[`${code.toLowerCase()}cate`]?.icon || 
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
    </Box>
  );
};

export default Categories;
