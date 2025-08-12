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
} from "@mui/material";
import ma from "../../img/ma.jpg";
import { useNavigate } from "react-router-dom";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const RecentPosts = ({ _id, categoryname, region, image, createdAt, countryLabels, countryname }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();

  // Debug logging
  console.log('RecentPosts data:', { _id, categoryname, region, image, countryLabels, countryname, currentLanguage });

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
        height: { xs: 'auto', sm: '20rem' },
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        borderRadius: '12px',
        overflow: 'hidden',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-4px)' },
          boxShadow: isDarkMode
            ? '0 8px 24px rgba(0, 0, 0, 0.4)'
            : '0 8px 24px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
             {/* Card Image */}
       <CardMedia
         component="img"
         sx={{
           height: { xs: '160px', sm: '180px' },
           position: 'relative',
           width: '100%',
           objectFit: 'cover',
           '&::after': {
             content: '""',
             position: 'absolute',
             bottom: 0,
             left: 0,
             right: 0,
             height: '50%',
             background: isDarkMode
               ? 'linear-gradient(to top, rgba(30, 30, 30, 0.9), transparent)'
               : 'linear-gradient(to top, rgba(255, 255, 255, 0.9), transparent)',
           },
         }}
         image={image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : ma}
         title={categoryname}
         onError={(e) => {
           console.log('Image failed to load:', e.target.src);
           e.target.src = ma;
         }}
       />

      {/* Card Content */}
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {/* Category Badge */}
        <Box
          sx={{
            backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.15) : categoryStyle.light,
            padding: '4px 8px',
            borderRadius: '16px',
            alignSelf: 'flex-start',
            border: `1px solid ${isDarkMode ? alpha(categoryStyle.main, 0.3) : categoryStyle.main}`,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <RenderIcon name={`${categoryname?.toLowerCase()}cate`} />
          <Typography
            sx={{
              color: isDarkMode ? categoryStyle.main : categoryStyle.dark,
              fontSize: { xs: '10px', sm: '12px' },
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}
                     >
             {t(categoryname?.toLowerCase()) || categoryname}
           </Typography>
        </Box>

        {/* Location and Date Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <RenderIcon name="locat" />
                         <Typography
               sx={{
                 color: isDarkMode ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                 fontSize: { xs: '13px', sm: '14px' },
                 fontWeight: 500,
               }}
             >
               {region}
             </Typography>
             {countryLabels && (
               <Typography
                 sx={{
                   color: isDarkMode ? alpha('#fff', 0.7) : alpha('#000', 0.6),
                   fontSize: { xs: '11px', sm: '12px' },
                   fontWeight: 400,
                 }}
               >
                 {countryLabels[currentLanguage] || countryLabels.en || countryname}
               </Typography>
             )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <RenderIcon name="timerace" />
            <Typography
              sx={{
                color: isDarkMode ? alpha('#fff', 0.7) : alpha('#000', 0.6),
                fontSize: { xs: '13px', sm: '14px' },
                fontWeight: 500,
              }}
            >
              {new Date(createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Card Actions */}
      <CardActions
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: { xs: 1.5, sm: 2 },
          borderTop: '1px solid',
          borderColor: isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1),
          backgroundColor: isDarkMode ? alpha('#000', 0.2) : alpha('#f5f5f5', 0.5),
        }}
      >
        <Button
          onClick={handleViewDetails}
          sx={{
            color: isDarkMode ? categoryStyle.main : categoryStyle.dark,
            textTransform: 'none',
            fontSize: { xs: '13px', sm: '14px' },
            fontWeight: 600,
            padding: '6px 16px',
            borderRadius: '20px',
            backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.1) : alpha(categoryStyle.main, 0.08),
            '&:hover': {
              backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.2) : alpha(categoryStyle.main, 0.12),
            },
          }}
                     endIcon={<RenderIcon name="view" data-directional="true" />}
         >
           {t('viewDetails')}
         </Button>
      </CardActions>
    </Card>
  );
};

export default RecentPosts;