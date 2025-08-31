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
import { useMemo } from "react";
import FlexBetween from "../FlexBetween";
import RenderIcon from "../RenderIcon";
import { TrendingItemSkeleton, DashboardEmptyStates } from "../LoadingStates";
import { useTranslation } from "../../utils/translations";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import LazyCardMedia from "../LazyCardMedia";
import { getCategoryConfig } from "../../config/categories";
import { useNavigate } from "react-router-dom";
import { getLabel } from "../../utils/languageUtils";
import ma from "../../img/ma.jpg";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const TrendingItem = ({ trend, isLoading }) => {
  // Handle both array and single object formats
  const trendData = Array.isArray(trend) ? trend[0] : trend;
  const { _id, categoryName, floptionName, image, createdAt, countryLabels, countryname, city, cityLabels, cityName, Floptions } = trendData || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();

  // Get city name with proper priority
  const getCityName = () => {
    // First priority: Use the populated city data from the API
    if (cityLabels && cityLabels[currentLanguage]) {
      return cityLabels[currentLanguage];
    }
    // Second priority: Use the English city name as fallback
    if (cityName) {
      return cityName;
    }
    // Third priority: Use the city field directly (for custom city names)
    if (city && typeof city === 'string' && city.trim()) {
      return city.trim();
    }
    // Last fallback: "Unknown City"
    return t('unknownCity') || 'Unknown City';
  };

  const displayCityName = getCityName();

  // Get category name safely with multilingual support (same as PostsList)
  const categoryDisplayName = useMemo(() => {
    // Map category codes to their translated names
    const categoryTranslations = {
      'ELECTRONICS': {
        en: 'Electronics',
        fr: 'Électronique', 
        ar: 'إلكترونيات'
      },
      'DOCUMENTS': {
        en: 'Documents',
        fr: 'Documents',
        ar: 'وثائق'
      },
      'JEWELRY': {
        en: 'Jewelry',
        fr: 'Bijoux',
        ar: 'مجوهرات'
      },
      'CLOTHING': {
        en: 'Clothing',
        fr: 'Vêtements',
        ar: 'ملابس'
      },
      'PETS': {
        en: 'Pets',
        fr: 'Animaux',
        ar: 'حيوانات أليفة'
      },
      'VEHICLES': {
        en: 'Vehicles',
        fr: 'Véhicules',
        ar: 'مركبات'
      },
      'KEYS': {
        en: 'Keys',
        fr: 'Clés',
        ar: 'مفاتيح'
      },
      'WALLET': {
        en: 'Wallet',
        fr: 'Portefeuille',
        ar: 'محفظة'
      },
      'WATCHES': {
        en: 'Watches',
        fr: 'Montres',
        ar: 'ساعات'
      },
      'GAMING': {
        en: 'Gaming',
        fr: 'Jeux',
        ar: 'ألعاب'
      },
      'MEDICAL': {
        en: 'Medical',
        fr: 'Médical',
        ar: 'طبي'
      },
      'LUGGAGE': {
        en: 'Luggage',
        fr: 'Bagages',
        ar: 'أمتعة'
      },
      'OTHER': {
        en: 'Other',
        fr: 'Autre',
        ar: 'أخرى'
      }
    };
    
    const translations = categoryTranslations[categoryName];
    if (translations) {
      return translations[currentLanguage] || translations.en || categoryName;
    }
    return categoryName || t('unknownCategory');
  }, [categoryName, currentLanguage, t]);

  // Get category colors using centralized configuration (same as RecentPosts)
  const getCategoryColors = (category) => {
    const config = getCategoryConfig(category);
    const isDarkMode = theme.palette.mode === 'dark';
    
    return {
      main: config.color,
      light: config.backgroundColor,
      dark: config.color,
      icon: config.color,
      background: isDarkMode ? alpha(config.backgroundColor, 0.2) : config.backgroundColor,
      text: config.color
    };
  };

  const categoryStyle = getCategoryColors(categoryName);

  // Get found/lost status with proper colors from database (same as PostsList)
  const foundLostStatus = useMemo(() => {
    let foundLostValue = "FOUND"; // Default to FOUND
    let foundLostLabel = t('found'); // Default label
    let foundLostColor = theme.palette.success.main; // Default color
    
    // Check Floptions array first (this contains the actual found/lost data from the lookup)
    if (Floptions && Floptions.length > 0) {
      const flOption = Floptions[0];
      if (flOption && flOption.code) {
        foundLostValue = flOption.code;
        foundLostLabel = getLabel(flOption.labels, currentLanguage) || 
                        (flOption.code === 'FOUND' ? t('found') : t('lost'));
        foundLostColor = flOption.color || 
                        (flOption.code === 'FOUND' ? theme.palette.success.main : theme.palette.error.main);
      }
    }
    
    // Fallback: Check floptionName property
    if (!foundLostValue || foundLostValue === "FOUND") {
      if (floptionName) {
        foundLostValue = floptionName.toUpperCase();
        foundLostLabel = floptionName === 'Found' ? t('found') : t('lost');
        foundLostColor = floptionName === 'Found' ? theme.palette.success.main : theme.palette.error.main;
      }
    }

    // Normalize the value and set proper colors
    const isFound = foundLostValue === "FOUND";
    const statusColor = foundLostColor || (isFound ? theme.palette.success.main : theme.palette.error.main);
    const statusText = foundLostLabel;

    return { 
      value: foundLostValue,
      label: statusText,
      color: statusColor,
      isFound 
    };
  }, [Floptions, floptionName, currentLanguage, t, theme.palette.success.main, theme.palette.error.main]);

  // Handle navigation to post
  const handleViewPost = () => {
    if (_id) {
      navigate(`/dash/posts/${_id}`);
    }
  };

  // Debug logging
  const finalImageUrl = image ? (image.startsWith('http') ? getOptimizedImageUrl(image, 'hero') : `${API_BASE_URL}/${image}`) : ma;
  console.log('TrendingItem data:', { 
    trend, 
    trendData, 
    image, 
    categoryName, 
    floptionName, 
    Floptions,
    city, 
    cityLabels, 
    cityName,
    displayCityName, 
    currentLanguage,
    API_BASE_URL, 
    finalImageUrl,
    foundLostStatus
  });

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
          <LazyCardMedia
            component="img"
            image={finalImageUrl}
            alt={categoryDisplayName || 'Item Image'}
            fallback={ma}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'brightness(0.7)',
            }}
            onError={(e) => {
              console.log('Image failed to load:', e.target.src);
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
            {/* Category Badge - Updated to use RecentPosts approach */}
            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? alpha(categoryStyle.main, 0.2) : categoryStyle.background,
                padding: '4px 8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.mode === 'dark' ? alpha(categoryStyle.main, 0.3) : categoryStyle.main}`,
              }}
            >
                             <RenderIcon name={`${categoryName?.toLowerCase()}cate`} sx={{ fontSize: '16px', color: categoryStyle.main }} />
              <Typography
                sx={{
                  color: categoryStyle.main,
                  fontSize: '12px',
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                {categoryDisplayName}
              </Typography>
            </Box>
            
            {/* Status Badge - Updated to use database colors */}
            <Chip
              icon={<RenderIcon name={`${foundLostStatus.value.toLowerCase()}fl`} sx={{ fontSize: '14px' }} />}
              label={foundLostStatus.label}
              sx={{
                backgroundColor: alpha(foundLostStatus.color, 0.9),
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
            
            {/* Enhanced styling for the description text */}
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.95)',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                textAlign: 'center',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                mb: 2,
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: '0.2px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                padding: '12px 16px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                maxWidth: '90%',
                mx: 'auto'
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
                  {displayCityName}
                </Typography>
              </Box>
            </Box>

            {/* Action Button - Updated with better title and navigation */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleViewPost}
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
              {t('viewDetails')}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default TrendingItem;
