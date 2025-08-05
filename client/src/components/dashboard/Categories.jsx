import { Box, Typography, useTheme, Grid, Card, CardContent, Chip } from "@mui/material";
import { useGetCategoriesQuery } from "../../features/dependencies/dependenciesApiSlice";
import { LoadingState, DashboardEmptyStates } from "../LoadingStates";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { useLanguage } from "../../utils/languageContext";
import { motion } from "framer-motion";

const Categories = () => {
  const { currentLanguage } = useLanguage();
  
  const { categories } = useGetCategoriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  const theme = useTheme();
  const { t } = useTranslation();

  if (!categories) return <LoadingState message={t('loadingCategories')} />;

  return (
    <Box sx={{ py: 4 }}>
      <Grid container spacing={3} justifyContent="center">
        {categories.map(({ code }, index) => (
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
                  minHeight: 140,
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
                    padding: 3,
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: '16px',
                      background: theme.palette.categories[`${code.toLowerCase()}cate`]?.back || 
                                theme.palette.categories.back,
                      marginBottom: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <RenderIcon 
                      name={`${code.toLowerCase()}cate`} 
                      sx={{
                        fontSize: '28px',
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
                      fontSize: '0.95rem',
                      lineHeight: 1.3,
                      marginBottom: 1,
                    }}
                  >
                    {t(code?.toLowerCase()) || code}
                  </Typography>
                  
                  <Chip
                    label={t('view')}
                    size="small"
                    sx={{
                      background: theme.palette.categories[`${code.toLowerCase()}cate`]?.icon || 
                                theme.palette.categories.text,
                      color: '#fff',
                      fontSize: '0.75rem',
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
