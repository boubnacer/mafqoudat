import {
  Box,
  Typography,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Button,
  alpha,
  Chip,
  useMediaQuery,
  Avatar,
} from "@mui/material";
import ma from "../../img/ma.jpg";
import { useNavigate } from "react-router-dom";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import LazyCardMedia from "../LazyCardMedia";
import { 
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowIcon,
  AccessTime as TimeIcon,
  ReportProblemOutlined,
} from "@mui/icons-material";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import useAuth from "../../hooks/useAuth";
import { getCategoryConfig } from "../../config/categories";
import { useState } from "react";
import ReportDialog from "../ReportDialog";
import { useSubmitReportMutation } from "../../features/posts/reportsApiSlice";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const RecentPosts = ({ _id, categoryname, exactLocation, image, createdAt, countryLabels, countryname, contact, city, cityLabels, cityName }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isMobile = useMediaQuery("(max-width:768px)");
  const { usernameId } = useAuth();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [submitReport] = useSubmitReportMutation();



  // Format date using date-fns with proper locale support
  const getLocale = () => {
    switch (currentLanguage) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  };

  const created = formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true,
    locale: getLocale()
  });

  const handleViewDetails = () => navigate(`/dash/posts/${_id}`);
  const handleReport = () => {
    // Check if user is authenticated
    if (!usernameId) {
      // Store the current post URL for redirect after login
      const currentPostUrl = `/dash/posts/${_id}`;
      localStorage.setItem('redirectAfterLogin', currentPostUrl);
      
      navigate('/login');
      return;
    }
    
    // If authenticated, open the dialog
    setReportDialogOpen(true);
  };

  const handleSubmitReport = async (reportData) => {
    try {
      const result = await submitReport(reportData).unwrap();
      return result;
    } catch (error) {
      throw new Error(error.data?.message || 'Failed to submit report');
    }
  };

  // Extract city from location (show only city)
  const getCityFromLocation = (location) => {
    if (!location) return t('unknownLocation');
    // Split by comma and take the first part (usually the city)
    const parts = location.split(',');
    const city = parts[0].trim();
    // Remove any extra location details that might be in parentheses
    const cleanCity = city.split('(')[0].trim();
    // Remove any numbers or extra details
    return cleanCity.replace(/\d+/g, '').trim();
  };

  // Get city name with proper multilingual support
  const getCityName = () => {
    // First priority: Use the populated city labels from the API (multilingual)
    if (cityLabels && typeof cityLabels === 'object') {
      const cityLabel = cityLabels[currentLanguage] || cityLabels.en;
      if (cityLabel && cityLabel.trim()) {
        return cityLabel.trim();
      }
    }
    
    // Second priority: Use the cityName field from API
    if (cityName && typeof cityName === 'string' && cityName.trim()) {
      return cityName.trim();
    }
    
    // Third priority: Use the city field directly (for custom city names)
    if (city && typeof city === 'string' && city.trim()) {
      return city.trim();
    }
    
    // Last fallback: extracting from exactLocation
    return getCityFromLocation(exactLocation);
  };

  const displayCityName = getCityName();

  // Get category name safely with multilingual support
  const getCategoryDisplayName = (categoryCode) => {
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
    
    const translations = categoryTranslations[categoryCode];
    if (translations) {
      return translations[currentLanguage] || translations.en || categoryCode;
    }
    return categoryCode || t('unknownCategory');
  };

  const categoryDisplayName = getCategoryDisplayName(categoryname);

  // Get category colors using centralized configuration
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
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <>
      <Card
        sx={{
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          position: 'relative',
          boxShadow: isDarkMode
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.1)',
          border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
          height: { xs: 'auto', sm: '380px' },
          minHeight: { xs: '360px', sm: '380px' },
          width: { xs: '100%', sm: 'auto' },
          maxWidth: { xs: '100%', sm: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '20px',
          overflow: 'hidden',
          '&:hover': {
            transform: { xs: 'none', sm: 'translateY(-4px)' },
            boxShadow: isDarkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
          },
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        {/* Image Section with Overlays */}
        <Box sx={{ position: 'relative', height: { xs: '260px', sm: '220px' } }}>
          <LazyCardMedia
            component="img"
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 1, // Base layer for image
            }}
            image={image ? (image.startsWith('http') ? getOptimizedImageUrl(image, 'card') : `${API_BASE_URL}/${image}`) : ma}
            alt={categoryname}
            fallback={ma}
            onError={(e) => {
              // Image failed to load - silently handle
            }}
          />
          
          {/* Gradient Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
              pointerEvents: 'none',
              zIndex: 2, // Above image, below badges
            }}
          />

          {/* Top Badges Container */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
              zIndex: 10, // Ensure badges are above image
            }}
          >
            {/* Category Badge */}
            <Box
              sx={{
                backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.2) : categoryStyle.background,
                padding: '4px 8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isDarkMode ? alpha(categoryStyle.main, 0.3) : categoryStyle.main}`,
                zIndex: 11, // Higher z-index for category badge
              }}
            >
              <RenderIcon 
                name={`${categoryname?.toLowerCase()}cate`} 
                sx={{ 
                  fontSize: { xs: '14px', sm: '12px' }, 
                  color: isDarkMode ? categoryStyle.main : categoryStyle.text 
                }} 
              />
              <Typography
                sx={{
                  color: isDarkMode ? categoryStyle.main : categoryStyle.text,
                  fontSize: { xs: '12px', sm: '10px' },
                  fontWeight: 600,
                }}
              >
                {categoryDisplayName}
              </Typography>
            </Box>
          </Box>

          {/* Time Badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              backgroundColor: alpha('#000', 0.7),
              padding: '4px 8px',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 11, // Higher z-index for time badge
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimeIcon sx={{ fontSize: { xs: '14px', sm: '12px' }, color: '#fff' }} />
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: { xs: '12px', sm: '10px' },
                  fontWeight: 600,
                }}
              >
                {created}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        <CardContent 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2.5, sm: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {/* Location Info - Only City */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: { xs: 32, sm: 28 },
                height: { xs: 32, sm: 28 },
                backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                color: theme.palette.text.secondary,
              }}
            >
              <LocationIcon sx={{ fontSize: { xs: '18px', sm: '16px' } }} />
            </Avatar>
            <Box>
              <Typography
                sx={{
                  color: isDarkMode ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                  fontSize: { xs: '16px', sm: '16px' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {displayCityName}
              </Typography>
            </Box>
          </Box>
        </CardContent>

        {/* Actions Section */}
        <CardActions
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: { xs: 2, sm: 2 },
            borderTop: '1px solid',
            borderColor: isDarkMode ? alpha('#fff', 0.06) : alpha('#000', 0.04),
            backgroundColor: isDarkMode ? alpha('#000', 0.2) : alpha('#f8f9fa', 0.5),
            gap: 3,
            mt: 'auto',
            flexShrink: 0,
            minHeight: { xs: '70px', sm: '60px' },
          }}
        >
          <Button
            onClick={handleReport}
            variant="outlined"
            size="small"
            sx={{
              color: isDarkMode ? '#f44336' : '#d32f2f',
              borderColor: isDarkMode ? '#f44336' : '#d32f2f',
              textTransform: 'none',
              fontSize: { xs: '12px', sm: '11px' },
              fontWeight: 600,
              padding: { xs: '10px 14px', sm: '8px 12px' },
              borderRadius: '8px',
              minWidth: 'auto',
              flexShrink: 0,
              gap: currentLanguage === 'ar' ? 1 : 0.5,
              backgroundColor: isDarkMode ? alpha('#f44336', 0.1) : alpha('#d32f2f', 0.05),
              '&:hover': {
                backgroundColor: isDarkMode ? '#f44336' : '#d32f2f',
                color: '#fff',
                borderColor: isDarkMode ? '#f44336' : '#d32f2f',
              },
            }}
            startIcon={<ReportProblemOutlined sx={{ fontSize: { xs: '14px', sm: '12px' } }} />}
            endIcon={null}
          >
            {t('report')}
          </Button>

          <Button
            onClick={handleViewDetails}
            variant="contained"
            sx={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)'
                : 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
              color: '#fff',
              textTransform: 'none',
              fontSize: { xs: '12px', sm: '11px' },
              fontWeight: 700,
              padding: { xs: '10px 14px', sm: '8px 12px' },
              borderRadius: '8px',
              minWidth: 'auto',
              flexShrink: 0,
              gap: currentLanguage === 'ar' ? 1 : 0.5,
              boxShadow: isDarkMode 
                ? '0 2px 8px rgba(25, 118, 210, 0.3)'
                : '0 2px 8px rgba(25, 118, 210, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)'
                  : 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
                transform: 'translateY(-1px)',
                boxShadow: isDarkMode 
                  ? '0 4px 12px rgba(25, 118, 210, 0.4)'
                  : '0 4px 12px rgba(25, 118, 210, 0.5)',
              },
            }}
            startIcon={null}
            endIcon={<ArrowIcon sx={{ fontSize: { xs: '14px', sm: '12px' }, transform: currentLanguage === 'ar' ? 'scaleX(-1)' : 'none' }} />}
          >
            {t('viewDetails')}
          </Button>
        </CardActions>
      </Card>
    
      {/* Report Dialog */}
      <ReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        post={{
          _id,
          categoryname,
          exactLocation,
          image,
          createdAt,
          countryLabels,
          countryname,
          contact,
          city,
          cityLabels,
          cityName,
          // Add missing fields with fallbacks
          user: 'anonymous', // RecentPosts doesn't have user data, use fallback
          foundLost: 'UNKNOWN', // RecentPosts doesn't have foundLost data, use fallback
          username: 'Anonymous' // RecentPosts doesn't have username, use fallback
        }}
        onSubmit={handleSubmitReport}
      />
    </>
  );
};

export default RecentPosts;