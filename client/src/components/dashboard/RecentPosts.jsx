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
  ArrowForward as ArrowIcon
} from "@mui/icons-material";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const RecentPosts = ({ _id, categoryname, region, exactLocation, image, createdAt, countryLabels, countryname, contact }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isMobile = useMediaQuery("(max-width:768px)");

  // Debug logging
  console.log('RecentPosts data:', { _id, categoryname, region, exactLocation, image, countryLabels, countryname, currentLanguage });
  console.log('RecentPosts - Using modern design with only date and city');

  const handleViewDetails = () => navigate(`/dash/posts/${_id}`);

  const getCategoryColor = (category) => {
    const categoryColors = {
      Bag: { main: '#4CAF50', light: '#E8F5E9', dark: '#2E7D32', icon: '#2E7D32' },
      keys: { main: '#FF9800', light: '#FFF3E0', dark: '#E65100', icon: '#E65100' },
      person: { main: '#2196F3', light: '#E3F2FD', dark: '#1565C0', icon: '#1565C0' },
      Money: { main: '#9C27B0', light: '#F3E5F5', dark: '#6A1B9A', icon: '#6A1B9A' },
      Devices: { main: '#00BCD4', light: '#E0F7FA', dark: '#00838F', icon: '#00838F' },
      Wallet: { main: '#FF5722', light: '#FBE9E7', dark: '#BF360C', icon: '#BF360C' },
      Vehicle: { main: '#607D8B', light: '#ECEFF1', dark: '#37474F', icon: '#37474F' },
      Document: { main: '#795548', light: '#EFEBE9', dark: '#4E342E', icon: '#4E342E' },
    };
    return categoryColors[category] || categoryColors.Bag;
  };

  const categoryStyle = getCategoryColor(categoryname);
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card
      sx={{
        backgroundColor: isDarkMode ? alpha('#1E1E1E', 0.9) : '#FFFFFF',
        position: 'relative',
        boxShadow: isDarkMode 
          ? '0 8px 32px rgba(0, 0, 0, 0.4)'
          : '0 8px 32px rgba(0, 0, 0, 0.12)',
        height: { xs: 'auto', sm: '20rem' },
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: '24px',
        overflow: 'hidden',
        border: `1px solid ${isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`,
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-8px) scale(1.02)' },
          boxShadow: isDarkMode
            ? '0 20px 48px rgba(0, 0, 0, 0.5)'
            : '0 20px 48px rgba(0, 0, 0, 0.2)',
        },
        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
      }}
    >
      {/* Card Image with Modern Overlay */}
      <Box sx={{ position: 'relative', height: { xs: '160px', sm: '180px' } }}>
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
            console.log('Image failed to load:', e.target.src);
            e.target.src = ma;
          }}
        />
        
        {/* Modern Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none'
          }}
        />

        {/* Category Badge - Modern Floating Design */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: currentLanguage === 'ar' ? 'auto' : 16,
            right: currentLanguage === 'ar' ? 16 : 'auto',
            backgroundColor: alpha(categoryStyle.main, 0.95),
            padding: '8px 16px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(categoryStyle.main, 0.3)}`,
            boxShadow: `0 4px 16px ${alpha(categoryStyle.main, 0.3)}`,
          }}
        >
          <RenderIcon 
            name={`${categoryname?.toLowerCase()}cate`} 
            sx={{ fontSize: '16px', color: categoryStyle.icon || '#fff' }} 
          />
          <Typography
            sx={{
              color: '#fff',
              fontSize: { xs: '11px', sm: '13px' },
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            {t(categoryname?.toLowerCase()) || categoryname}
          </Typography>
        </Box>

        {/* Date Badge - Modern Floating Design */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: currentLanguage === 'ar' ? 'auto' : 16,
            right: currentLanguage === 'ar' ? 16 : 'auto',
            backgroundColor: alpha('#000', 0.8),
            padding: '6px 12px',
            borderRadius: '16px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarIcon sx={{ fontSize: '14px', color: '#fff' }} />
            <Typography
              sx={{
                color: '#fff',
                fontSize: { xs: '11px', sm: '12px' },
                fontWeight: 600,
              }}
            >
              {new Date(createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Card Content - Simplified */}
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
              width: 32,
              height: 32,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}
          >
            <LocationIcon sx={{ fontSize: '18px' }} />
          </Avatar>
          <Box>
            <Typography
              sx={{
                color: isDarkMode ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {exactLocation || region || t('unknownLocation')}
            </Typography>
            {countryLabels && (
              <Typography
                sx={{
                  color: isDarkMode ? alpha('#fff', 0.6) : alpha('#000', 0.5),
                  fontSize: { xs: '11px', sm: '12px' },
                  fontWeight: 400,
                }}
              >
                {countryLabels[currentLanguage] || countryLabels.en || countryname}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>

      {/* Card Actions - Modern Design */}
      <CardActions
        sx={{
          display: 'flex',
          justifyContent: 'center',
          p: { xs: 2, sm: 2.5 },
          borderTop: '1px solid',
          borderColor: isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06),
          backgroundColor: isDarkMode ? alpha('#000', 0.3) : alpha('#f8f9fa', 0.8),
          mt: 'auto',
        }}
      >
        <Button
          onClick={handleViewDetails}
          variant="contained"
          fullWidth
          sx={{
            background: `linear-gradient(135deg, ${categoryStyle.main} 0%, ${categoryStyle.dark} 100%)`,
            color: '#fff',
            textTransform: 'none',
            fontSize: { xs: '13px', sm: '14px' },
            fontWeight: 700,
            padding: { xs: '12px 20px', sm: '14px 24px' },
            borderRadius: '16px',
            boxShadow: `0 6px 20px ${alpha(categoryStyle.main, 0.4)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(135deg, ${categoryStyle.dark} 0%, ${categoryStyle.main} 100%)`,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 24px ${alpha(categoryStyle.main, 0.5)}`,
            },
          }}
          endIcon={<ArrowIcon sx={{ fontSize: '18px' }} />}
        >
          {t('viewDetails')}
        </Button>
      </CardActions>
    </Card>
  );
};

export default RecentPosts;