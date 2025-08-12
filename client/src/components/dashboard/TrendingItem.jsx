import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  useTheme,
  useMediaQuery,
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
          borderRadius: '24px',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px 0 rgba(0,0,0,0.15)'
            : '0 8px 32px 0 rgba(0,0,0,0.05)',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px 0 rgba(0,0,0,0.2)'
              : '0 12px 40px 0 rgba(0,0,0,0.1)',
          },
          height: '100%',
          minHeight: isMobile ? '500px' : '400px'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          height: '100%',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {/* Image Container */}
          <Box sx={{ 
            flex: isMobile ? 'none' : '0 0 35%',
            position: 'relative',
            height: isMobile ? '250px' : '100%',
            minHeight: isMobile ? '250px' : '400px',
            overflow: 'hidden'
          }}>
            <CardMedia
              component="img"
              image={finalImageUrl}
              title={categoryName || 'Item Image'}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              onError={(e) => {
                console.log('Image failed to load:', e.target.src);
                e.target.src = ma;
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', finalImageUrl);
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
                pointerEvents: 'none'
              }}
            />
          </Box>

          {/* Content Container */}
          <Box sx={{ 
            flex: isMobile ? '1' : '1', 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: isMobile ? '250px' : '400px'
          }}>
            <CardContent sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              paddingBottom: '80px' // Space for the button
            }}>
              <FlexBetween sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.05)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    gap: '8px',
                    backdropFilter: 'blur(5px)',
                  }}
                >
                  <RenderIcon name={categoryName} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
                      fontWeight: 500,
                      fontSize: '14px',
                    }}
                  >
                    {t(categoryName?.toLowerCase()) || categoryName}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    background: floptionName === "Found"
                      ? theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(72, 187, 120, 0.2) 0%, rgba(72, 187, 120, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(72, 187, 120, 0.3) 0%, rgba(72, 187, 120, 0.2) 100%)'
                      : theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(245, 101, 101, 0.2) 0%, rgba(245, 101, 101, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(245, 101, 101, 0.3) 0%, rgba(245, 101, 101, 0.2) 100%)',
                    padding: '8px 16px',
                    borderRadius: '24px',
                    gap: '8px',
                  }}
                >
                  <Typography
                    sx={{
                      color: floptionName === "Found"
                        ? theme.palette.mode === 'dark' ? '#48BB78' : '#2F855A'
                        : theme.palette.mode === 'dark' ? '#F56565' : '#C53030',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    {t(floptionName?.toLowerCase()) || floptionName}
                  </Typography>
                  <RenderIcon name={`${floptionName}fl`} />
                </Box>
              </FlexBetween>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  mb: 'auto',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <RenderIcon name="time" />
                  <Typography
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    {new Date(createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {countryLabels && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <RenderIcon name="locat" />
                    <Typography
                      sx={{
                        color: theme.palette.mode === 'dark' ? '#A0AEC0' : '#4A5568',
                        fontSize: '12px',
                        fontWeight: 400,
                      }}
                    >
                      {countryLabels[currentLanguage] || countryLabels.en || countryname}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '24px',
                  right: '24px',
                }}
              >
                <Button
                  fullWidth
                  sx={{
                    color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#2D3748',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.05)',
                    backdropFilter: 'blur(5px)',
                    borderRadius: '12px',
                    padding: '12px',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.1)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                  endIcon={<RenderIcon name="view" />}
                >
                  {t('learnMore')}
                </Button>
              </Box>
            </CardContent>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default TrendingItem;
