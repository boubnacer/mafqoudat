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
          backgroundColor: isDarkMode 
            ? 'linear-gradient(145deg, rgba(26,26,26,0.95) 0%, rgba(45,45,45,0.95) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)',
          position: 'relative',
          boxShadow: isDarkMode
            ? '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)'
            : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          border: `1px solid ${isDarkMode ? alpha('#fff', 0.12) : alpha('#000', 0.08)}`,
          height: { xs: 'auto', sm: '400px' },
          minHeight: { xs: '340px', sm: '400px' },
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: { xs: '16px', sm: '20px' },
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            transform: { xs: 'none', sm: 'translateY(-6px)' },
            boxShadow: isDarkMode
              ? '0 24px 48px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0,0,0,0.3)'
              : '0 24px 48px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0,0,0,0.1)',
            border: `1px solid ${isDarkMode ? alpha('#fff', 0.18) : alpha('#000', 0.12)}`,
          },
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        {/* Image Section with Enhanced Overlays */}
        <Box sx={{ position: 'relative', height: { xs: '260px', sm: '240px' } }}>
          <LazyCardMedia
            component="img"
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 1, // Base layer for image
              transition: 'transform 0.4s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
            image={image ? (image.startsWith('http') ? getOptimizedImageUrl(image, 'card') : `${API_BASE_URL}/${image}`) : ma}
            alt={categoryname}
            fallback={ma}
            onError={(e) => {
              // Image failed to load - silently handle
            }}
          />
          
          {/* Enhanced Gradient Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isDarkMode
                ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)'
                : 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)',
              pointerEvents: 'none',
              zIndex: 2, // Above image, below badges
            }}
          />

          {/* Enhanced Top Badges Container */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 16, sm: 16 },
              left: { xs: 16, sm: 16 },
              right: { xs: 16, sm: 16 },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
              zIndex: 10, // Ensure badges are above image
            }}
          >
            {/* Enhanced Category Badge */}
            <Box
              sx={{
                backgroundColor: isDarkMode 
                  ? alpha(categoryStyle.main, 0.25) 
                  : alpha(categoryStyle.background, 0.9),
                padding: { xs: '6px 10px', sm: '8px 12px' },
                borderRadius: { xs: '14px', sm: '16px' },
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.75, sm: 1 },
                backdropFilter: 'blur(12px)',
                border: `1px solid ${isDarkMode ? alpha(categoryStyle.main, 0.4) : alpha(categoryStyle.main, 0.3)}`,
                zIndex: 11, // Higher z-index for category badge
                boxShadow: isDarkMode
                  ? `0 4px 12px ${alpha(categoryStyle.main, 0.2)}`
                  : `0 4px 12px ${alpha(categoryStyle.main, 0.15)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: isDarkMode 
                    ? alpha(categoryStyle.main, 0.35) 
                    : alpha(categoryStyle.background, 1),
                  transform: 'scale(1.05)',
                }
              }}
            >
              <RenderIcon 
                name={`${categoryname?.toLowerCase()}cate`} 
                sx={{ 
                  fontSize: { xs: '14px', sm: '16px' }, 
                  color: isDarkMode ? categoryStyle.main : categoryStyle.text 
                }} 
              />
              <Typography
                sx={{
                  color: isDarkMode ? categoryStyle.main : categoryStyle.text,
                  fontSize: { xs: '11px', sm: '12px' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {categoryDisplayName}
              </Typography>
            </Box>
          </Box>

          {/* Enhanced Time Badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 16, sm: 16 },
              left: { xs: 16, sm: 16 },
              backgroundColor: isDarkMode 
                ? alpha('#000', 0.8) 
                : alpha('#000', 0.75),
              padding: { xs: '6px 10px', sm: '8px 12px' },
              borderRadius: { xs: '12px', sm: '14px' },
              backdropFilter: 'blur(12px)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)'}`,
              zIndex: 11, // Higher z-index for time badge
              boxShadow: isDarkMode
                ? '0 4px 12px rgba(0,0,0,0.4)'
                : '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: isDarkMode 
                  ? alpha('#000', 0.9) 
                  : alpha('#000', 0.85),
                transform: 'scale(1.05)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
              <TimeIcon sx={{ 
                fontSize: { xs: '14px', sm: '16px' }, 
                color: '#fff' 
              }} />
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: { xs: '11px', sm: '12px' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {created}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Enhanced Content Section */}
        <CardContent 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2.5, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: isDarkMode 
              ? alpha('#1a1a1a', 0.3) 
              : alpha('#ffffff', 0.5),
          }}
        >
          {/* Enhanced Location Info - Only City */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1.5, sm: 2 },
            p: { xs: 1, sm: 1.5 },
            backgroundColor: isDarkMode 
              ? alpha('#2d2d2d', 0.5) 
              : alpha('#f8f9fa', 0.8),
            borderRadius: { xs: '12px', sm: '14px' },
            border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: isDarkMode 
                ? alpha('#2d2d2d', 0.7) 
                : alpha('#f8f9fa', 1),
              transform: 'translateY(-2px)',
            }
          }}>
            <Avatar
              sx={{
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                backgroundColor: isDarkMode 
                  ? alpha(theme.palette.primary.main, 0.2) 
                  : alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                border: `2px solid ${isDarkMode ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.2)}`,
                boxShadow: isDarkMode
                  ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                  : `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
              }}
            >
              <LocationIcon sx={{ fontSize: { xs: '18px', sm: '20px' } }} />
            </Avatar>
            <Box>
              <Typography
                sx={{
                  color: isDarkMode ? alpha('#fff', 0.95) : alpha('#000', 0.9),
                  fontSize: { xs: '15px', sm: '17px' },
                  fontWeight: 700,
                  lineHeight: 1.3,
                  letterSpacing: '0.02em',
                }}
              >
                {displayCityName}
              </Typography>
            </Box>
          </Box>
        </CardContent>

        {/* Enhanced Actions Section */}
        <CardActions
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: { xs: 2, sm: 2.5 },
            borderTop: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
            backgroundColor: isDarkMode 
              ? 'linear-gradient(145deg, rgba(0,0,0,0.3) 0%, rgba(26,26,26,0.3) 100%)'
              : 'linear-gradient(145deg, rgba(248,249,250,0.8) 0%, rgba(255,255,255,0.8) 100%)',
            gap: { xs: 2, sm: 3 },
            mt: 'auto',
            flexShrink: 0,
            minHeight: { xs: '70px', sm: '80px' },
            backdropFilter: 'blur(8px)',
          }}
        >
          <Button
            onClick={handleReport}
            variant="outlined"
            size="small"
            sx={{
              color: theme.palette.error.main,
              borderColor: theme.palette.error.main,
              textTransform: 'none',
              fontSize: { xs: '11px', sm: '12px' },
              fontWeight: 700,
              padding: { xs: '10px 14px', sm: '12px 16px' },
              borderRadius: { xs: '10px', sm: '12px' },
              minWidth: 'auto',
              flexShrink: 0,
              gap: currentLanguage === 'ar' ? 1 : 0.75,
              backgroundColor: isDarkMode 
                ? alpha(theme.palette.error.main, 0.1) 
                : alpha(theme.palette.error.main, 0.05),
              borderWidth: '2px',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: theme.palette.error.main,
                color: '#fff',
                borderColor: theme.palette.error.main,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.4)}`,
              },
            }}
            startIcon={<ReportProblemOutlined sx={{ fontSize: { xs: '14px', sm: '16px' } }} />}
            endIcon={null}
          >
            {t('report')}
          </Button>

          <Button
            onClick={handleViewDetails}
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: '#fff',
              textTransform: 'none',
              fontSize: { xs: '11px', sm: '12px' },
              fontWeight: 700,
              padding: { xs: '10px 14px', sm: '12px 16px' },
              borderRadius: { xs: '10px', sm: '12px' },
              minWidth: 'auto',
              flexShrink: 0,
              gap: currentLanguage === 'ar' ? 1 : 0.75,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
            startIcon={null}
            endIcon={<ArrowIcon sx={{ fontSize: { xs: '14px', sm: '16px' }, transform: currentLanguage === 'ar' ? 'scaleX(-1)' : 'none' }} />}
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