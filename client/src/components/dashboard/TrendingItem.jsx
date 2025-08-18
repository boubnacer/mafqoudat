import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
  alpha,
} from "@mui/material";
import FlexBetween from "../FlexBetween";
import RenderIcon from "../RenderIcon";
import { TrendingItemSkeleton, DashboardEmptyStates } from "../LoadingStates";
import { useTranslation } from "../../utils/translations";
import ma from "../../img/ma.jpg";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const TrendingItem = ({ trend, isLoading }) => {
  // Handle both array and single object formats
  const trendData = Array.isArray(trend) ? trend[0] : trend;
  const { categoryName, floptionName, region, image, createdAt, countryLabels, countryname } = trendData || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t, currentLanguage } = useTranslation();

  // Debug logging
  const finalImageUrl = image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : ma;
  console.log('TrendingItem data:', { trend, trendData, image, categoryName, floptionName, API_BASE_URL, finalImageUrl });

  if (isLoading) return <TrendingItemSkeleton />;
  if (!trendData) return <DashboardEmptyStates.NoTrending />;

  return (
    <Box flex={1}>
      <Card
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(18,18,18,0.95) 0%, rgba(28,28,28,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px 0 rgba(0,0,0,0.15)'
            : '0 8px 32px 0 rgba(0,0,0,0.05)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 16px 48px 0 rgba(0,0,0,0.25)'
              : '0 16px 48px 0 rgba(0,0,0,0.15)',
          },
          height: '100%',
          minHeight: '300px',
          position: 'relative'
        }}
      >
        {/* Large Background Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          <CardMedia
            component="img"
            image={finalImageUrl}
            title={categoryName || 'Item Image'}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'brightness(0.7)',
            }}
            onError={(e) => {
              console.log('Image failed to load:', e.target.src);
              e.target.src = ma;
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', finalImageUrl);
            }}
          />
          {/* Gradient overlay for better text readability */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)',
              pointerEvents: 'none'
            }}
          />
        </Box>

        {/* Content Overlay */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: { xs: 2, sm: 2.5 }
          }}
        >
          {/* Top Section - Badges */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2
            }}
          >
            {/* Category Badge */}
            <Chip
              icon={<RenderIcon name={categoryName} sx={{ fontSize: '16px' }} />}
              label={t(categoryName?.toLowerCase()) || categoryName}
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.9),
                color: '#fff',
                fontWeight: 600,
                fontSize: '12px',
                height: '28px',
                '& .MuiChip-icon': {
                  color: '#fff'
                }
              }}
            />
            
            {/* Status Badge */}
            <Chip
              icon={<RenderIcon name={`${floptionName}fl`} sx={{ fontSize: '14px' }} />}
              label={t(floptionName?.toLowerCase()) || floptionName}
              sx={{
                backgroundColor: floptionName === "Found"
                  ? alpha('#4CAF50', 0.9)
                  : alpha('#F44336', 0.9),
                color: '#fff',
                fontWeight: 600,
                fontSize: '12px',
                height: '28px',
                '& .MuiChip-icon': {
                  color: '#fff'
                }
              }}
            />
          </Box>

          {/* Middle Section - Main Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                color: '#fff',
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                mb: 1,
                textAlign: 'center'
              }}
            >
              {t('trendingItem')}
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                textAlign: 'center',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                mb: 2
              }}
            >
              {t('trendingItemDescription')}
            </Typography>
          </Box>

          {/* Bottom Section - Info and Action */}
          <Box>
            {/* Info Row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                p: 1.5,
                backgroundColor: alpha('#000', 0.3),
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RenderIcon name="time" sx={{ fontSize: '16px', color: '#fff' }} />
                <Typography
                  sx={{
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {new Date(createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              
              {countryLabels && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RenderIcon name="locat" sx={{ fontSize: '14px', color: '#fff' }} />
                  <Typography
                    sx={{
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 400,
                      maxWidth: '80px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {countryLabels[currentLanguage] || countryLabels.en || countryname}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Action Button */}
            <Button
              fullWidth
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                }
              }}
              endIcon={<RenderIcon name="view" sx={{ fontSize: '16px' }} />}
            >
              {t('learnMore')}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default TrendingItem;
