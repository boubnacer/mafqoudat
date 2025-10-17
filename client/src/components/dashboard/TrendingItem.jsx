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
import noImageSvg from "../../img/noimage.svg";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const TrendingItem = ({ trend, isLoading }) => {
  // Handle both array and single object formats
  const trendData = Array.isArray(trend) ? trend[0] : trend;
  const { _id, categoryname, floptionName, image, createdAt, mainDate, countryLabels, countryname, city, cityLabels, cityName, Floptions, Category } = trendData || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();

  // Helper function to get relative time
  const getTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours === 1 ? t('1HourAgo') : `${diffInHours} ${t('hoursAgo')}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? t('1DayAgo') : `${diffInDays} ${t('daysAgo')}`;
    }
  };

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
    // First priority: Use the Category object from API aggregation (with labels)
    if (Category && Category.labels) {
      return Category.labels[currentLanguage] || Category.labels.en || Category.code || categoryname;
    }
    
    // Last fallback: return the original categoryname or unknown
    return categoryname || t('unknownCategory');
  }, [Category, categoryname, currentLanguage, t]);

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

  // Get optimized image URL - only use Cloudinary if image exists and is uploaded by user
  const finalImageUrl = image ? (image.startsWith('http') ? getOptimizedImageUrl(image, 'card') : `${API_BASE_URL}/${image}`) : noImageSvg;

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
      position: 'relative',
      marginTop: '16px', // Space for the pin
    }}>
      {/* Pin Icon */}
      <Box
        sx={{
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}
      >
        <img 
          src={`${process.env.PUBLIC_URL}/pinIcon.svg`} 
          alt="Pin" 
          style={{ 
            width: '24px', 
            height: '24px',
            display: 'block'
          }} 
        />
      </Box>

      <Card
        onClick={handleViewPost}
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 50%, rgba(30,30,30,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(248,248,248,0.95) 0%, rgba(255,255,255,0.98) 50%, rgba(248,248,248,0.95) 100%)',
          borderRadius: '8px',
          border: `2px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'} !important`,
          borderColor: `${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'} !important`,
          overflow: 'hidden',
          height: '100%',
          minHeight: { xs: '500px', sm: '320px' },
          position: 'relative',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
          paddingBottom: '20px', // Add padding to prevent button from being hidden
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        {/* Poster Header */}
        <Box
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
              : 'linear-gradient(90deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)',
            color: theme.palette.mode === 'dark' ? '#fff' : '#2c2c2c',
            padding: { xs: '12px 16px', sm: '16px 20px' },
            textAlign: 'center',
            direction: 'ltr', // Force LTR direction for centering
            borderBottom: `2px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'}`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'dark'
                ? 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)'
                : 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.05) 4px, rgba(0,0,0,0.05) 8px)',
              pointerEvents: 'none',
            },
            '& *': {
              direction: 'ltr', // Force all child elements to LTR
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, marginBottom: '8px' }}>
            <Typography
              sx={{
                fontSize: { xs: '20px', sm: '24px' },
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
              }}
            >
              {displayCityName}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <RenderIcon name="locat" sx={{ fontSize: { xs: '14px', sm: '16px' }, color: theme.palette.mode === 'dark' ? '#fff' : '#2c2c2c' }} />
            <Typography
              sx={{
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 600,
                opacity: 0.9,
                marginTop: '4px',
              }}
            >
              {mainDate || new Date(createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {/* Full Body Image Container */}
        <Box
          sx={{
            position: 'relative',
            height: 'calc(100% - 80px)',
            overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
          }}
        >
          {/* Background Image */}
          <LazyCardMedia
            component="img"
            image={finalImageUrl}
            alt={categoryDisplayName || 'Item Image'}
            fallback={noImageSvg}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />

          {/* Status Chip - Top Right Overlay */}
          <Chip
            icon={<RenderIcon name={`${foundLostStatus.value.toLowerCase()}fl`} sx={{ fontSize: { xs: '14px', sm: '16px' } }} />}
            label={foundLostStatus.label}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 2,
              backgroundColor: alpha(foundLostStatus.color, 0.95),
              color: '#fff',
              fontWeight: 900,
              fontSize: { xs: '14px', sm: '16px' },
              height: { xs: '32px', sm: '36px' },
              padding: { xs: '0 12px', sm: '0 16px' },
              borderRadius: '8px',
              border: `1px solid ${alpha(foundLostStatus.color, 0.3)}`,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              '& .MuiChip-icon': {
                color: '#fff',
                marginLeft: 0,
                fontSize: { xs: '14px', sm: '16px' },
              },
              '& .MuiChip-label': {
                paddingLeft: { xs: '6px', sm: '8px' },
                paddingRight: { xs: '6px', sm: '8px' },
                textTransform: 'uppercase',
                letterSpacing: '1px',
              },
            }}
          />
          
          {/* Category Badge - Top Left Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 2,
              backgroundColor: `${categoryStyle.background} !important`,
              color: categoryStyle.text,
              padding: { xs: '0 12px', sm: '0 16px' },
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              height: { xs: '32px', sm: '36px' },
              border: `1px solid ${categoryStyle.main}`,
              opacity: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            <RenderIcon 
              name={`${categoryname?.toLowerCase()}cate`} 
              sx={{ 
                fontSize: { xs: '14px', sm: '16px' }, 
                color: categoryStyle.text
              }} 
            />
            <Typography
              sx={{
                color: categoryStyle.text,
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {categoryDisplayName}
            </Typography>
          </Box>

          {/* Created Date Badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '32px',
              left: '16px',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(0,0,0,0.7)' 
                : 'rgba(255,255,255,0.9)',
              color: theme.palette.mode === 'dark' ? '#fff' : '#333',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              zIndex: 2,
            }}
          >
            {`${t('posted')} ${getTimeAgo(createdAt)}`}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};


export default TrendingItem;