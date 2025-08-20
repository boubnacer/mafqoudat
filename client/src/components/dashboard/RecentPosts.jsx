import {
  Box,
  Typography,
  useTheme,
  Card,
  CardMedia,
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

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const RecentPosts = ({ _id, categoryname, region, exactLocation, image, createdAt, countryLabels, countryname, contact }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isMobile = useMediaQuery("(max-width:768px)");
  const { usernameId } = useAuth();

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
  const handleReport = () => navigate(`/dash/posts/report/${_id}`);

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

  // Use city field if available, otherwise extract from exactLocation
  const cityName = getCityFromLocation(exactLocation || region);

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
      }
    };
    
    const translations = categoryTranslations[categoryCode];
    if (translations) {
      return translations[currentLanguage] || translations.en || categoryCode;
    }
    return categoryCode || t('unknownCategory');
  };

  const categoryDisplayName = getCategoryDisplayName(categoryname);

  // Get category color function with actual database colors
  const getCategoryColor = (category) => {
    const categoryColors = {
      ELECTRONICS: { 
        main: '#2196F3', 
        light: '#E3F2FD', 
        dark: '#1565C0', 
        icon: '#1565C0',
        background: '#E3F2FD',
        text: '#1565C0'
      },
      DOCUMENTS: { 
        main: '#FF9800', 
        light: '#FFF3E0', 
        dark: '#E65100', 
        icon: '#E65100',
        background: '#FFF3E0',
        text: '#E65100'
      },
      JEWELRY: { 
        main: '#E91E63', 
        light: '#FCE4EC', 
        dark: '#AD1457', 
        icon: '#AD1457',
        background: '#FCE4EC',
        text: '#AD1457'
      },
      CLOTHING: { 
        main: '#9C27B0', 
        light: '#F3E5F5', 
        dark: '#6A1B9A', 
        icon: '#6A1B9A',
        background: '#F3E5F5',
        text: '#6A1B9A'
      },
      PETS: { 
        main: '#795548', 
        light: '#EFEBE9', 
        dark: '#4E342E', 
        icon: '#4E342E',
        background: '#EFEBE9',
        text: '#4E342E'
      },
      VEHICLES: { 
        main: '#607D8B', 
        light: '#ECEFF1', 
        dark: '#37474F', 
        icon: '#37474F',
        background: '#ECEFF1',
        text: '#37474F'
      },
      // Fallback for old category names
      Bag: { 
        main: '#4CAF50', 
        light: '#E8F5E9', 
        dark: '#2E7D32', 
        icon: '#2E7D32',
        background: '#E8F5E9',
        text: '#2E7D32'
      },
      keys: { 
        main: '#FF9800', 
        light: '#FFF3E0', 
        dark: '#E65100', 
        icon: '#E65100',
        background: '#FFF3E0',
        text: '#E65100'
      },
      person: { 
        main: '#2196F3', 
        light: '#E3F2FD', 
        dark: '#1565C0', 
        icon: '#1565C0',
        background: '#E3F2FD',
        text: '#1565C0'
      },
      Money: { 
        main: '#9C27B0', 
        light: '#F3E5F5', 
        dark: '#6A1B9A', 
        icon: '#6A1B9A',
        background: '#F3E5F5',
        text: '#6A1B9A'
      },
      Devices: { 
        main: '#00BCD4', 
        light: '#E0F7FA', 
        dark: '#00838F', 
        icon: '#00838F',
        background: '#E0F7FA',
        text: '#00838F'
      },
      Wallet: { 
        main: '#FF5722', 
        light: '#FBE9E7', 
        dark: '#BF360C', 
        icon: '#BF360C',
        background: '#FBE9E7',
        text: '#BF360C'
      },
      Vehicle: { 
        main: '#607D8B', 
        light: '#ECEFF1', 
        dark: '#37474F', 
        icon: '#37474F',
        background: '#ECEFF1',
        text: '#37474F'
      },
      Document: { 
        main: '#795548', 
        light: '#EFEBE9', 
        dark: '#4E342E', 
        icon: '#4E342E',
        background: '#EFEBE9',
        text: '#4E342E'
      },
    };
    return categoryColors[category] || categoryColors.ELECTRONICS;
  };

  const categoryStyle = getCategoryColor(categoryname);
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card
      sx={{
        backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.9) : '#ffffff',
        position: 'relative',
        boxShadow: 'none',
        border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
        height: { xs: 'auto', sm: '360px' },
        minHeight: { xs: '280px', sm: '360px' },
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: '20px',
        overflow: 'hidden',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-4px)' },
          boxShadow: isDarkMode
            ? '0 20px 40px rgba(0, 0, 0, 0.3)'
            : '0 20px 40px rgba(0, 0, 0, 0.08)',
        },
        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
      }}
    >
      {/* Image Section with Overlays */}
      <Box sx={{ position: 'relative', height: { xs: '220px', sm: '200px' } }}>
        <CardMedia
          component="img"
          sx={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          image={image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : ma}
          title={categoryname}
          onError={(e) => {
            e.target.src = ma;
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
            pointerEvents: 'none'
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
            }}
          >
            <RenderIcon 
              name={`${categoryname?.toLowerCase()}cate`} 
              sx={{ 
                fontSize: '12px', 
                color: isDarkMode ? categoryStyle.main : categoryStyle.text 
              }} 
            />
                          <Typography
                sx={{
                  color: isDarkMode ? categoryStyle.main : categoryStyle.text,
                  fontSize: '10px',
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
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimeIcon sx={{ fontSize: '12px', color: '#fff' }} />
            <Typography
              sx={{
                color: '#fff',
                fontSize: '10px',
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
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {/* Location Info - Only City */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
              sx={{
                width: 28,
                height: 28,
                backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                color: theme.palette.text.secondary,
              }}
            >
              <LocationIcon sx={{ fontSize: '16px' }} />
            </Avatar>
          <Box>
                         <Typography
               sx={{
                 color: isDarkMode ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                 fontSize: { xs: '14px', sm: '16px' },
                 fontWeight: 700,
                 lineHeight: 1.2,
               }}
             >
               {cityName}
             </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Actions Section */}
      <CardActions
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: { xs: 1.5, sm: 2 },
          borderTop: '1px solid',
          borderColor: isDarkMode ? alpha('#fff', 0.06) : alpha('#000', 0.04),
          backgroundColor: isDarkMode ? alpha('#000', 0.2) : alpha('#f8f9fa', 0.5),
          gap: 3,
          mt: 'auto',
          flexShrink: 0,
          minHeight: '60px',
        }}
      >
        <Button
          onClick={() => {
            if (!usernameId) {
              navigate('/login');
            } else {
              handleReport();
            }
          }}
          variant="outlined"
          size="small"
                      sx={{
              color: theme.palette.error.main,
              borderColor: theme.palette.error.main,
              textTransform: 'none',
              fontSize: { xs: '10px', sm: '11px' },
              fontWeight: 600,
              padding: { xs: '8px 12px', sm: '8px 12px' },
              borderRadius: '8px',
              minWidth: 'auto',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: theme.palette.error.main,
                color: '#fff',
                borderColor: theme.palette.error.main,
              },
            }}
          startIcon={currentLanguage === 'ar' ? null : <ReportProblemOutlined sx={{ fontSize: '12px' }} />}
          endIcon={currentLanguage === 'ar' ? <ReportProblemOutlined sx={{ fontSize: '12px' }} /> : null}
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
              fontSize: { xs: '10px', sm: '11px' },
              fontWeight: 700,
              padding: { xs: '8px 12px', sm: '8px 12px' },
              borderRadius: '8px',
              minWidth: 'auto',
              flexShrink: 0,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
          startIcon={currentLanguage === 'ar' ? <ArrowIcon sx={{ fontSize: '12px', transform: 'scaleX(-1)' }} /> : null}
          endIcon={currentLanguage === 'ar' ? null : <ArrowIcon sx={{ fontSize: '12px' }} />}
        >
          {t('viewDetails')}
        </Button>
      </CardActions>
    </Card>
  );
};

export default RecentPosts;