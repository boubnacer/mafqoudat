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
} from "@mui/material";
import ma from "../../img/ma.jpg";
import { useNavigate } from "react-router-dom";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const RecentPosts = ({ _id, categoryname, region, exactLocation, image, createdAt, countryLabels, countryname, contact }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isMobile = useMediaQuery("(max-width:768px)");

  // Debug logging
  console.log('RecentPosts data:', { _id, categoryname, region, exactLocation, image, countryLabels, countryname, currentLanguage });

  const handleViewDetails = () => navigate(`/dash/posts/${_id}`);

  const getCategoryColor = (category) => {
    const categoryColors = {
      Bag: { main: '#4CAF50', light: '#E8F5E9', dark: '#2E7D32' },
      keys: { main: '#FF9800', light: '#FFF3E0', dark: '#E65100' },
      person: { main: '#2196F3', light: '#E3F2FD', dark: '#1565C0' },
      Money: { main: '#9C27B0', light: '#F3E5F5', dark: '#6A1B9A' },
      Devices: { main: '#00BCD4', light: '#E0F7FA', dark: '#00838F' },
      Wallet: { main: '#FF5722', light: '#FBE9E7', dark: '#BF360C' },
      Vehicle: { main: '#607D8B', light: '#ECEFF1', dark: '#37474F' },
      Document: { main: '#795548', light: '#EFEBE9', dark: '#4E342E' },
    };
    return categoryColors[category] || categoryColors.Bag;
  };

  const categoryStyle = getCategoryColor(categoryname);
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card
      sx={{
        backgroundColor: isDarkMode ? alpha('#1E1E1E', 0.8) : '#FFFFFF',
        position: 'relative',
        boxShadow: isDarkMode 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        height: { xs: 'auto', sm: '22rem' },
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        borderRadius: '16px',
        overflow: 'hidden',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-6px)' },
          boxShadow: isDarkMode
            ? '0 12px 32px rgba(0, 0, 0, 0.4)'
            : '0 12px 32px rgba(0, 0, 0, 0.15)',
        },
        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
      }}
    >
      {/* Card Image with Overlay */}
      <Box sx={{ position: 'relative', height: { xs: '180px', sm: '200px' } }}>
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
        
        {/* Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
            pointerEvents: 'none'
          }}
        />

        {/* Category Badge - Floating on Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: currentLanguage === 'ar' ? 'auto' : 12,
            right: currentLanguage === 'ar' ? 12 : 'auto',
            backgroundColor: alpha(categoryStyle.main, 0.9),
            padding: '6px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(categoryStyle.main, 0.3)}`,
          }}
        >
          <RenderIcon name={`${categoryname?.toLowerCase()}cate`} sx={{ fontSize: '14px', color: '#fff' }} />
          <Typography
            sx={{
              color: '#fff',
              fontSize: { xs: '10px', sm: '12px' },
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}
          >
            {t(categoryname?.toLowerCase()) || categoryname}
          </Typography>
        </Box>

        {/* Date Badge - Floating on Image */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: currentLanguage === 'ar' ? 'auto' : 12,
            right: currentLanguage === 'ar' ? 12 : 'auto',
            backgroundColor: alpha('#000', 0.7),
            padding: '4px 8px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography
            sx={{
              color: '#fff',
              fontSize: { xs: '10px', sm: '11px' },
              fontWeight: 500,
            }}
          >
            {new Date(createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>

      {/* Card Content */}
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Location Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <RenderIcon name="locat" sx={{ fontSize: '16px', color: theme.palette.primary.main }} />
            <Typography
              sx={{
                color: isDarkMode ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 600,
              }}
            >
              {exactLocation || region || t('unknownLocation')}
            </Typography>
          </Box>
          
          {countryLabels && (
            <Typography
              sx={{
                color: isDarkMode ? alpha('#fff', 0.7) : alpha('#000', 0.6),
                fontSize: { xs: '12px', sm: '13px' },
                fontWeight: 400,
                ml: 3, // Indent under location
              }}
            >
              {countryLabels[currentLanguage] || countryLabels.en || countryname}
            </Typography>
          )}
        </Box>

        {/* Contact Info (if available) */}
        {contact && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <RenderIcon name="contact" sx={{ fontSize: '14px', color: theme.palette.info.main }} />
              <Typography
                sx={{
                  color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                  fontSize: { xs: '12px', sm: '13px' },
                  fontWeight: 500,
                }}
              >
                {contact}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>

      {/* Card Actions */}
      <CardActions
        sx={{
          display: 'flex',
          justifyContent: 'center',
          p: { xs: 1.5, sm: 2 },
          borderTop: '1px solid',
          borderColor: isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1),
          backgroundColor: isDarkMode ? alpha('#000', 0.2) : alpha('#f5f5f5', 0.5),
          mt: 'auto', // Push to bottom
        }}
      >
        <Button
          onClick={handleViewDetails}
          variant="contained"
          fullWidth
          sx={{
            background: `linear-gradient(45deg, ${categoryStyle.main} 30%, ${categoryStyle.dark} 90%)`,
            color: '#fff',
            textTransform: 'none',
            fontSize: { xs: '13px', sm: '14px' },
            fontWeight: 600,
            padding: { xs: '8px 16px', sm: '10px 20px' },
            borderRadius: '12px',
            boxShadow: `0 4px 15px ${alpha(categoryStyle.main, 0.3)}`,
            '&:hover': {
              background: `linear-gradient(45deg, ${categoryStyle.dark} 30%, ${categoryStyle.main} 90%)`,
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 20px ${alpha(categoryStyle.main, 0.4)}`,
            },
          }}
          endIcon={<RenderIcon name="view" data-directional="true" sx={{ fontSize: '16px' }} />}
        >
          {t('viewDetails')}
        </Button>
      </CardActions>
    </Card>
  );
};

export default RecentPosts;