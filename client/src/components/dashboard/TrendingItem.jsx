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
  const { _id, categoryname, floptionName, image, createdAt, countryLabels, countryname, city, cityLabels, cityName, Floptions } = trendData || {};
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
    
    const translations = categoryTranslations[categoryname];
    if (translations) {
      return translations[currentLanguage] || translations.en || categoryname;
    }
    return categoryname || t('unknownCategory');
  }, [categoryname, currentLanguage, t]);

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

  const categoryStyle = getCategoryColors(categoryname);

  // Get found/lost status with proper colors from database (same as PostsList)
  const foundLostStatus = useMemo(() => {
    // Simple and direct approach based on server logs
    let foundLostValue = "FOUND"; // Default
    let foundLostLabel = t('found'); // Default
    let foundLostColor = "#4CAF50"; // Default green for FOUND
    
    // Priority 1: Use Floptions.code if available
    if (Floptions && Floptions.code) {
      foundLostValue = Floptions.code;
      foundLostColor = Floptions.color || "#4CAF50";
      
      // Simple label logic
      if (Floptions.code === 'FOUND') {
        foundLostLabel = t('found');
      } else if (Floptions.code === 'LOST') {
        foundLostLabel = t('lost');
        foundLostColor = foundLostColor || "#F44336";
      }
    }
    // Priority 2: Use floptionName as fallback
    else if (floptionName) {
      foundLostValue = floptionName.toUpperCase();
      if (floptionName.toUpperCase() === 'FOUND') {
        foundLostLabel = t('found');
        foundLostColor = "#4CAF50";
      } else if (floptionName.toUpperCase() === 'LOST') {
        foundLostLabel = t('lost');
        foundLostColor = "#F44336";
      }
    }

    const isFound = foundLostValue === "FOUND";
    return { 
      value: foundLostValue,
      label: foundLostLabel,
      color: foundLostColor,
      isFound 
    };
  }, [Floptions, floptionName, currentLanguage, t]);

  // Handle navigation to post
  const handleViewPost = () => {
    if (_id) {
      navigate(`/dash/posts/${_id}`);
    }
  };

  // Get optimized image URL
  const finalImageUrl = image ? (image.startsWith('http') ? getOptimizedImageUrl(image, 'card') : `${API_BASE_URL}/${image}`) : ma;

  if (isLoading) return <TrendingItemSkeleton />;
  if (!trendData) {
    return <DashboardEmptyStates.NoTrending />;
  }

  // Additional safety check for required fields
  if (!_id || !categoryname) {
    return <DashboardEmptyStates.NoTrending />;
  }

  return (
    <Box flex={1} sx={{ 
      minWidth: isMobile ? '100%' : 'auto', 
      width: isMobile ? '100%' : 'auto',
    }}>
      <Card
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(18,18,18,0.95) 0%, rgba(28,28,28,0.95) 100%)'
            : '#ffffff',
          backdropFilter: 'blur(10px)',
          borderRadius: isMobile ? '12px' : '20px',
          border: `3px solid ${theme.palette.mode === 'dark' ? 'rgba(255,152,0,0.4)' : 'rgba(255,152,0,0.5)'}`,
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px 0 rgba(0,0,0,0.15), 0 0 0 2px rgba(255,152,0,0.3), 0 0 25px rgba(255,152,0,0.15)'
            : '0 8px 32px 0 rgba(0,0,0,0.05), 0 0 0 2px rgba(255,152,0,0.4), 0 0 25px rgba(255,152,0,0.2)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 16px 48px 0 rgba(0,0,0,0.25), 0 0 0 2px rgba(255,152,0,0.5), 0 0 35px rgba(255,152,0,0.25)'
              : '0 16px 48px 0 rgba(0,0,0,0.15), 0 0 0 2px rgba(255,152,0,0.6), 0 0 35px rgba(255,152,0,0.3)',
          },
          height: '100%',
          minHeight: { xs: '450px', sm: '350px' },
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            background: 'linear-gradient(45deg, rgba(255,152,0,0.1), rgba(255,193,7,0.1), rgba(255,152,0,0.1))',
            borderRadius: isMobile ? '14px' : '22px',
            zIndex: -1,
            animation: 'trendingGlow 3s ease-in-out infinite alternate',
          },
          '@keyframes trendingGlow': {
            '0%': {
              opacity: 0.3,
            },
            '100%': {
              opacity: 0.6,
            },
          },
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
              filter: 'brightness(0.8)', // Reduced darkness for better clarity
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
              background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)', // Lighter overlay for better image visibility
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
            p: { xs: 3, sm: 2.5 }
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
            {/* Left Side - Trending Badge */}
            <Box
              sx={{
                background: 'linear-gradient(45deg, #FF9800, #FFC107)',
                padding: { xs: '4px 8px', sm: '6px 12px' },
                borderRadius: '20px',
                boxShadow: '0 4px 15px rgba(255,152,0,0.4)',
                animation: 'trendingPulse 2s ease-in-out infinite',
                '@keyframes trendingPulse': {
                  '0%': {
                    boxShadow: '0 4px 15px rgba(255,152,0,0.4)',
                  },
                  '50%': {
                    boxShadow: '0 4px 25px rgba(255,152,0,0.6)',
                  },
                  '100%': {
                    boxShadow: '0 4px 15px rgba(255,152,0,0.4)',
                  },
                },
              }}
            >
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: { xs: '11px', sm: '13px' },
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
🔥 {t('trending')}
              </Typography>
            </Box>
            
            {/* Right Side Badges Container */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                alignItems: 'flex-end',
              }}
            >
              {/* Status Badge - Moved to top */}
              <Chip
                icon={<RenderIcon name={`${foundLostStatus.value.toLowerCase()}fl`} sx={{ fontSize: { xs: '16px', sm: '16px' } }} />}
                label={foundLostStatus.label}
                sx={{
                  backgroundColor: alpha(foundLostStatus.color, 0.95),
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: { xs: '13px', sm: '13px', md: '14px' },
                  height: { xs: '30px', sm: '30px', md: '32px' },
                  padding: { xs: '0 12px', sm: '0 12px', md: '0 16px' },
                  borderRadius: { xs: '12px', sm: '16px' },
                  boxShadow: `0 2px 8px ${alpha(foundLostStatus.color, 0.4)}`,
                  border: `1px solid ${alpha(foundLostStatus.color, 0.3)}`,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '& .MuiChip-icon': {
                    color: '#fff',
                    marginLeft: 0
                  },
                  '& .MuiChip-label': {
                    paddingLeft: { xs: '4px', sm: '6px' },
                    paddingRight: { xs: '4px', sm: '6px' }
                  },
                  '&:hover': {
                    backgroundColor: alpha(foundLostStatus.color, 1),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(foundLostStatus.color, 0.6)}`
                  }
                }}
              />
              
              {/* Category Badge - Moved to bottom */}
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? alpha(categoryStyle.main, 0.2) : categoryStyle.background,
                  padding: { xs: '6px 12px', sm: '6px 12px' },
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? alpha(categoryStyle.main, 0.3) : categoryStyle.main}`,
                  zIndex: 11, // Higher z-index for category badge (same as RecentPosts)
                }}
              >
                <RenderIcon 
                  name={`${categoryname?.toLowerCase()}cate`} 
                  sx={{ 
                    fontSize: { xs: '18px', sm: '18px' }, 
                    color: theme.palette.mode === 'dark' ? categoryStyle.main : categoryStyle.text
                  }} 
                />
                <Typography
                  sx={{
                    color: theme.palette.mode === 'dark' ? categoryStyle.main : categoryStyle.text,
                    fontSize: { xs: '14px', sm: '14px' },
                    fontWeight: 700, // Changed from 600 to 700 (same as RecentPosts)
                    lineHeight: 1,
                  }}
                >
                  {categoryDisplayName}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Middle Section - Main Content - Optimized for better image visibility */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {/* Empty space for better visual balance */}
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
                p: { xs: 2, sm: 1.5 },
                backgroundColor: alpha('#000', 0.3),
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RenderIcon name="time" sx={{ fontSize: { xs: '18px', sm: '16px' }, color: '#fff' }} />
                <Typography
                  sx={{
                    color: '#fff',
                    fontSize: { xs: '16px', sm: '14px' },
                    fontWeight: 500,
                  }}
                >
                  {new Date(createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RenderIcon name="locat" sx={{ fontSize: { xs: '16px', sm: '14px' }, color: '#fff' }} />
                <Typography
                  sx={{
                    color: '#fff',
                    fontSize: { xs: '15px', sm: '13px' },
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

            {/* Action Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleViewPost}
          sx={{
            background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
            color: '#fff',
            borderRadius: '4px',
            padding: { xs: '14px', sm: '12px' },
            textTransform: 'none',
            fontSize: { xs: '16px', sm: '14px' },
            fontWeight: 600,
            transition: 'all 0.3s ease',
            boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
              boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
            }
          }}
          endIcon={<RenderIcon name="view" sx={{ fontSize: { xs: '18px', sm: '16px' } }} />}
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
