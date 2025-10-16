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
  const { _id, categoryname, floptionName, image, createdAt, countryLabels, countryname, city, cityLabels, cityName, Floptions, Category } = trendData || {};
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
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 50%, rgba(30,30,30,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(248,248,248,0.95) 0%, rgba(255,255,255,0.98) 50%, rgba(248,248,248,0.95) 100%)',
          borderRadius: '8px',
          border: `2px solid ${theme.palette.mode === 'dark' ? '#555' : '#333'}`,
          overflow: 'hidden',
          height: '100%',
          minHeight: { xs: '500px', sm: '320px' },
          position: 'relative',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Poster Header */}
        <Box
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
              : 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
            padding: { xs: '16px', sm: '12px' },
            textAlign: 'center',
            borderBottom: `2px solid ${theme.palette.mode === 'dark' ? '#555' : '#333'}`,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '20px', sm: '24px' },
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '8px',
            }}
          >
            {foundLostStatus.isFound ? t('foundItem') : t('missingItem')}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography
              sx={{
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? '#ccc' : '#ccc',
              }}
            >
              📍 {displayCityName}
            </Typography>
            
            <Typography
              sx={{
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? '#ccc' : '#ccc',
              }}
            >
              📅 {new Date(createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {/* Main Image Section */}
        <Box
          sx={{
            padding: { xs: '16px', sm: '12px' },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#fff',
          }}
        >
          <Box
            sx={{
              width: { xs: '200px', sm: '180px' },
              height: { xs: '200px', sm: '140px' },
              borderRadius: '8px',
              overflow: 'hidden',
              border: `2px solid ${theme.palette.mode === 'dark' ? '#555' : '#333'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
            }}
          >
            <LazyCardMedia
              component="img"
              image={finalImageUrl}
              alt={categoryDisplayName || 'Item Image'}
              fallback={noImageSvg}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </Box>
        </Box>

        {/* Status and Category Section */}
        <Box
          sx={{
            padding: { xs: '16px', sm: '12px' },
            backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f8f8f8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {/* Status Chip - Large and Centered */}
          <Chip
            icon={<RenderIcon name={`${foundLostStatus.value.toLowerCase()}fl`} sx={{ fontSize: { xs: '20px', sm: '22px' } }} />}
            label={foundLostStatus.label}
            sx={{
              backgroundColor: foundLostStatus.color,
              color: '#fff',
              fontWeight: 900,
              fontSize: { xs: '18px', sm: '20px' },
              height: { xs: '32px', sm: '36px' },
              padding: { xs: '0 20px', sm: '0 24px' },
              borderRadius: '8px',
              border: `3px solid ${theme.palette.mode === 'dark' ? '#555' : '#333'}`,
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              '& .MuiChip-icon': {
                color: '#fff',
                marginLeft: 0,
                fontSize: { xs: '20px', sm: '22px' },
              },
              '& .MuiChip-label': {
                paddingLeft: { xs: '8px', sm: '10px' },
                paddingRight: { xs: '8px', sm: '10px' },
                textTransform: 'uppercase',
                letterSpacing: '1px',
              },
            }}
          />
          
          {/* Category Badge - Centered */}
          <Box
            sx={{
              backgroundColor: categoryStyle.background,
              padding: { xs: '6px 12px', sm: '8px 16px' },
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: `2px solid ${theme.palette.mode === 'dark' ? '#555' : '#333'}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <RenderIcon 
              name={`${categoryname?.toLowerCase()}cate`} 
              sx={{ 
                fontSize: { xs: '20px', sm: '22px' }, 
                color: categoryStyle.main
              }} 
            />
            <Typography
              sx={{
                color: categoryStyle.main,
                fontSize: { xs: '16px', sm: '18px' },
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {categoryDisplayName}
            </Typography>
          </Box>
        </Box>

        {/* Contact Button */}
        <Box
          sx={{
            padding: { xs: '16px', sm: '12px' },
            backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#fff',
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={handleViewPost}
            sx={{
              backgroundColor: '#dc3545',
              color: '#fff',
              borderRadius: '8px',
              padding: { xs: '12px', sm: '14px' },
              textTransform: 'uppercase',
              fontSize: { xs: '16px', sm: '18px' },
              fontWeight: 900,
              letterSpacing: '1px',
              border: `2px solid ${theme.palette.mode === 'dark' ? '#555' : '#333'}`,
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              '&:hover': {
                backgroundColor: '#c82333',
                boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
              },
            }}
            endIcon={<RenderIcon name="view" sx={{ fontSize: { xs: '20px', sm: '22px' } }} />}
          >
            {t('contactForInfo')}
          </Button>
        </Box>
      </Card>
    </Box>
  );
};


export default TrendingItem;