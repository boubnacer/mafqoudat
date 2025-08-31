import { 
  Box, 
  Button, 
  CardMedia, 
  Typography, 
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  useTheme,
  useMediaQuery,
  alpha
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import sear from "../../../img/sear.svg";
import { useState, useCallback, useMemo } from "react";
import ReportDialog from "../../../components/ReportDialog";
import { useSubmitReportMutation } from "../reportsApiSlice";
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  ContactPhone as ContactIcon,
  ReportProblem as ReportIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon,
  Tag as TagIcon,
  Visibility as ViewIcon,
  Flag as FlagIcon
} from "@mui/icons-material";

import "./editpost.css";
import { useTranslation } from "../../../utils/translations";
import { isRTL, getLabel } from "../../../utils/languageUtils";
import { getOptimizedImageUrl } from "../../../utils/cloudinaryUtils";
import LazyCardMedia from "../../../components/LazyCardMedia";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import RenderIcon from "../../../components/RenderIcon";
import { getCategoryConfig } from "../../../config/categories";

const SinglePostPage = ({
  _id,
  categoryname,
  region,
  exactLocation,
  contact,
  user,
  image,
  username,
  createdAt,
  updatedAt,
  countryname,
  countryLabels,
  foundLost,
  Floptions,
  description,
  contactPreferences,
  additionalContact,
  city,
  cityLabels,
  cityName,
  // Additional fields from Post model
  title,
  titleLabels,
  descriptionLabels,
  mainDate,
  exactDate,
  views,
  lastViewedAt,
  status,
  returned,
  resolvedAt,
  expiresAt,
  tags,
  promotionRequested,
  promotionRequestedAt,
  promotionProcessed,
  promotionProcessedAt,
  // Category object from aggregation
  Category
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const { usernameId } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = isRTL();

  const canEdit = user === usernameId;
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [submitReport] = useSubmitReportMutation();

  // Memoized event handlers
  const handleEdit = useCallback(() => {
    navigate(`/dash/posts/edit/${_id}`);
  }, [navigate, _id]);

  const handleReport = useCallback(() => {
    // Check if user is authenticated
    if (!usernameId) {
      // Store the current post URL in localStorage for redirect after login
      const currentPostUrl = window.location.pathname;
      localStorage.setItem('redirectAfterLogin', currentPostUrl);
      
      // Redirect to login page
      navigate('/login');
      return;
    }
    
    // If authenticated, open the dialog
    setReportDialogOpen(true);
  }, [usernameId, navigate]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSubmitReport = useCallback(async (reportData) => {
    try {
      await submitReport(reportData).unwrap();
    } catch (error) {
      throw new Error(error.data?.message || 'Failed to submit report');
    }
  }, [submitReport]);

  const handleCloseReportDialog = useCallback(() => {
    setReportDialogOpen(false);
  }, []);

  // Memoized computed values
  const locale = useMemo(() => {
    switch (currentLanguage) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  }, [currentLanguage]);

  const createdDate = useMemo(() => {
    return formatDistanceToNow(new Date(createdAt), { 
      addSuffix: true,
      locale
    });
  }, [createdAt, locale]);

  const updatedDate = useMemo(() => {
    return formatDistanceToNow(new Date(updatedAt), { 
      addSuffix: true,
      locale
    });
  }, [updatedAt, locale]);

  // Memoized category colors computation
  const categoryStyle = useMemo(() => {
    const config = getCategoryConfig(categoryname);
    const isDarkMode = theme.palette.mode === 'dark';
    
    return {
      main: config.color,
      light: config.backgroundColor,
      dark: config.color,
      icon: config.color,
      background: isDarkMode ? alpha(config.backgroundColor, 0.2) : config.backgroundColor,
      text: config.color
    };
  }, [categoryname, theme.palette.mode]);

  const isDarkMode = theme.palette.mode === 'dark';

  // Memoized category display name computation
  const categoryDisplayName = useMemo(() => {
    // First priority: Use the Category object from API aggregation (with labels)
    if (Category && Category.labels) {
      return Category.labels[currentLanguage] || Category.labels.en || Category.code || categoryname;
    }
    
    // Second priority: Use categoryname with hardcoded translations (fallback)
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
      'PERSON': {
        en: 'Person',
        fr: 'Personne',
        ar: 'شخص'
      },
      'SHOPPING': {
        en: 'Shopping',
        fr: 'Shopping',
        ar: 'تسوق'
      },
      'WORK': {
        en: 'Work',
        fr: 'Travail',
        ar: 'عمل'
      },
      'SPORTS': {
        en: 'Sports',
        fr: 'Sports',
        ar: 'رياضة'
      },
      'MUSIC': {
        en: 'Music',
        fr: 'Musique',
        ar: 'موسيقى'
      },
      'TOYS': {
        en: 'Toys',
        fr: 'Jouets',
        ar: 'ألعاب'
      },
      'BEAUTY': {
        en: 'Beauty',
        fr: 'Beauté',
        ar: 'جمال'
      },
      'CAMERA': {
        en: 'Camera',
        fr: 'Caméra',
        ar: 'كاميرا'
      },
      'TOOLS': {
        en: 'Tools',
        fr: 'Outils',
        ar: 'أدوات'
      },
      'GARDEN': {
        en: 'Garden',
        fr: 'Jardin',
        ar: 'حديقة'
      },
      'HOME': {
        en: 'Home',
        fr: 'Maison',
        ar: 'منزل'
      },
      'FOOD': {
        en: 'Food',
        fr: 'Nourriture',
        ar: 'طعام'
      },
      'OTHER': {
        en: 'Other',
        fr: 'Autre',
        ar: 'أخرى'
      }
    };
    
    const categoryCode = categoryname?.toUpperCase();
    const translations = categoryTranslations[categoryCode];
    if (translations) {
      return translations[currentLanguage] || translations.en || categoryname;
    }
    
    // Last fallback: return the original categoryname
    return categoryname || t('unknownCategory');
  }, [Category, categoryname, currentLanguage, t]);

  // Memoized city name computation
  const displayCityName = useMemo(() => {
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
    // First try to use the populated city data from the API
    if (cityLabels && cityLabels[currentLanguage]) {
      return cityLabels[currentLanguage];
    }
    if (cityName) {
      return cityName;
    }
    // Fallback to extracting from exactLocation
    return getCityFromLocation(exactLocation);
  }, [cityLabels, cityName, exactLocation, currentLanguage, t]);

  // Memoized found/lost status computation
  const foundLostStatus = useMemo(() => {
    // Debug logging to see what data we're receiving
    console.log('🔍 SinglePostPage Found/Lost Debug:', {
      foundLost,
      Floptions,
      foundLostType: typeof foundLost,
      FloptionsType: typeof Floptions,
      FloptionsKeys: Floptions ? Object.keys(Floptions) : null
    });

    // Simple and direct approach based on server logs (same as TrendingItem)
    let foundLostValue = "FOUND"; // Default
    let foundLostLabel = t('found'); // Default
    let foundLostColor = "#4CAF50"; // Default green for FOUND
    
    // Priority 1: Use Floptions.code if available (populated object from server)
    if (Floptions && Floptions.code) {
      console.log('🔍 Using Floptions.code:', Floptions.code);
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
    // Priority 2: Use foundLost as fallback (could be ObjectId or object)
    else if (foundLost) {
      console.log('🔍 Using foundLost fallback:', foundLost);
      if (typeof foundLost === 'string') {
        // If it's a string, check if it's an ObjectId or a code
        if (foundLost.length === 24) {
          // It's likely an ObjectId, default to FOUND for now
          foundLostValue = "FOUND";
          foundLostLabel = t('found');
          foundLostColor = "#4CAF50";
        } else {
          // It's a code string
          foundLostValue = foundLost.toUpperCase();
          if (foundLost.toUpperCase() === 'FOUND') {
            foundLostLabel = t('found');
            foundLostColor = "#4CAF50";
          } else if (foundLost.toUpperCase() === 'LOST') {
            foundLostLabel = t('lost');
            foundLostColor = "#F44336";
          }
        }
      } else if (foundLost.code) {
        // It's an object with code
        foundLostValue = foundLost.code;
        foundLostColor = foundLost.color || "#4CAF50";
        
        if (foundLost.code === 'FOUND') {
          foundLostLabel = t('found');
        } else if (foundLost.code === 'LOST') {
          foundLostLabel = t('lost');
          foundLostColor = foundLostColor || "#F44336";
        }
      }
    }

    const isFound = foundLostValue === "FOUND";
    const statusColor = isFound ? "success" : "error";
    const statusText = foundLostLabel;

    const result = { isFound, statusColor, statusText };
    console.log('🔍 SinglePostPage Found/Lost Final result:', result);
    
    return result;
  }, [foundLost, Floptions, currentLanguage, t]);

  // Memoized image URL computation
  const imageUrl = useMemo(() => {
    if (!image) return sear;
    return image.startsWith('http') 
      ? getOptimizedImageUrl(image, 'large') 
      : image;
  }, [image]);

  // Sanitize contactPreferences and additionalContact to prevent React errors
  const sanitizedContactPreferences = useMemo(() => {
    if (!contactPreferences || typeof contactPreferences !== 'object') {
      return { phone: true, email: false, whatsapp: false };
    }
    return {
      phone: Boolean(contactPreferences.phone),
      email: Boolean(contactPreferences.email),
      whatsapp: Boolean(contactPreferences.whatsapp)
    };
  }, [contactPreferences]);

  const sanitizedAdditionalContact = useMemo(() => {
    if (!additionalContact || typeof additionalContact !== 'object') {
      return {};
    }
    return {
      phone: additionalContact.phone || '',
      email: additionalContact.email || '',
      whatsapp: additionalContact.whatsapp || ''
    };
  }, [additionalContact]);

  return (
    <Box 
      sx={{ 
        p: { xs: 2, md: 4 },
        pt: { xs: "8rem", md: "10rem" },
        minHeight: "100vh",
        background: theme.palette.background.default
      }}
    >
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={!isRTLMode ? <ArrowBackIcon /> : null}
          endIcon={isRTLMode ? <ArrowBackIcon /> : null}
          onClick={handleBack}
          sx={{
            color: theme.palette.textColor.secondary,
            direction: isRTLMode ? 'rtl' : 'ltr',
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          {t('back')} {t('to')} {t('posts')}
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
              backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.8) : '#ffffff'
            }}
          >
            {/* Image Section */}
            <Box sx={{ position: 'relative' }}>
              <LazyCardMedia
                component="img"
                sx={{
                  width: '100%',
                  height: { xs: 300, sm: 400, md: 500 },
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
                image={imageUrl}
                alt={categoryDisplayName || 'Post Image'}
                fallback={sear}
              />
              
              {/* Status Badge Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  zIndex: 1
                }}
              >
                <Chip
                  label={foundLostStatus.statusText}
                  sx={{
                    backgroundColor: alpha(foundLostStatus.statusColor === 'success' ? '#4CAF50' : '#F44336', 0.95),
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '14px',
                    height: 32,
                    padding: '0 12px',
                    borderRadius: '16px',
                    boxShadow: `0 2px 8px ${alpha(foundLostStatus.statusColor === 'success' ? '#4CAF50' : '#F44336', 0.4)}`,
                    border: `1px solid ${alpha(foundLostStatus.statusColor === 'success' ? '#4CAF50' : '#F44336', 0.3)}`,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '& .MuiChip-label': {
                      color: 'white',
                      fontWeight: 700
                    },
                    '&:hover': {
                      backgroundColor: alpha(foundLostStatus.statusColor === 'success' ? '#4CAF50' : '#F44336', 1),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(foundLostStatus.statusColor === 'success' ? '#4CAF50' : '#F44336', 0.6)}`
                    }
                  }}
                />
              </Box>

              {/* Category Badge Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 1
                }}
              >
                <Box
                  sx={{
                    backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.2) : categoryStyle.background,
                    padding: '8px 12px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isDarkMode ? alpha(categoryStyle.main, 0.3) : categoryStyle.main}`,
                  }}
                >
                  <RenderIcon 
                    name={`${categoryname?.toLowerCase()}cate`} 
                    sx={{ 
                      fontSize: '16px', 
                      color: isDarkMode ? categoryStyle.main : categoryStyle.text 
                    }} 
                  />
                  <Typography
                    sx={{
                      color: isDarkMode ? categoryStyle.main : categoryStyle.text,
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    {categoryDisplayName}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Content Section */}
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              {/* Title */}
              <Typography 
                variant="h4" 
                fontWeight={700}
                sx={{ 
                  mb: 3,
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                  color: isDarkMode ? '#ffffff' : '#1a1a1a'
                }}
              >
                {displayCityName}
              </Typography>

              {/* Description */}
              {description && (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3,
                    lineHeight: 1.6,
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                    color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7)
                  }}
                >
                  {description}
                </Typography>
              )}

              {/* Location and Time Info */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <LocationIcon sx={{ color: 'text.secondary' }} />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                      >
                        {exactLocation || displayCityName}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <TimeIcon sx={{ color: 'text.secondary' }} />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                      >
                        {createdDate}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Contact Information */}
              {contact && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{ 
                      mb: 2,
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      color: isDarkMode ? '#ffffff' : '#1a1a1a'
                    }}
                  >
                    {t('contactInformation')}
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7)
                    }}
                  >
                    {contact}
                  </Typography>
                </Box>
              )}

              {/* Additional Contact */}
              {sanitizedAdditionalContact && (sanitizedAdditionalContact.phone || sanitizedAdditionalContact.email || sanitizedAdditionalContact.whatsapp) && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{ 
                      mb: 2,
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      color: isDarkMode ? '#ffffff' : '#1a1a1a'
                    }}
                  >
                    {t('additionalContact')}
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {sanitizedAdditionalContact.phone && (
                      <Typography 
                        variant="body1"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7)
                        }}
                      >
                        {t('phone')}: {sanitizedAdditionalContact.phone}
                      </Typography>
                    )}
                    {sanitizedAdditionalContact.email && (
                      <Typography 
                        variant="body1"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7)
                        }}
                      >
                        {t('email')}: {sanitizedAdditionalContact.email}
                      </Typography>
                    )}
                    {sanitizedAdditionalContact.whatsapp && (
                      <Typography 
                        variant="body1"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7)
                        }}
                      >
                        WhatsApp: {sanitizedAdditionalContact.whatsapp}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: '2rem' }}>
            {/* Actions Card */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
                backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.8) : '#ffffff'
              }}
            >
              <Typography 
                variant="h6" 
                fontWeight={600}
                sx={{ 
                  mb: 3,
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                  color: isDarkMode ? '#ffffff' : '#1a1a1a'
                }}
              >
                {t('actions')}
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                {canEdit && (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                    }}
                  >
                    {t('editPost')}
                  </Button>
                )}

                <Button
                  variant="outlined"
                  startIcon={<ReportIcon />}
                  onClick={handleReport}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: theme.palette.error.main,
                      color: 'white'
                    }
                  }}
                >
                  {t('report')}
                </Button>
              </Box>
            </Paper>

            {/* Post Details Card */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                borderRadius: 3,
                border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
                backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.8) : '#ffffff'
              }}
            >
              <Typography 
                variant="h6" 
                fontWeight={600}
                sx={{ 
                  mb: 3,
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                  color: isDarkMode ? '#ffffff' : '#1a1a1a'
                }}
              >
                {t('postDetails')}
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                  >
                    {t('postedBy')}:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={600}
                    sx={{ 
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      color: isDarkMode ? '#ffffff' : '#1a1a1a'
                    }}
                  >
                    {username || t('anonymous')}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                  >
                    {t('created')}:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={600}
                    sx={{ 
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      color: isDarkMode ? '#ffffff' : '#1a1a1a'
                    }}
                  >
                    {createdDate}
                  </Typography>
                </Box>

                {updatedAt !== createdAt && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                    >
                      {t('updated')}:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ 
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                        color: isDarkMode ? '#ffffff' : '#1a1a1a'
                      }}
                    >
                      {updatedDate}
                    </Typography>
                  </Box>
                )}

                {views !== undefined && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                    >
                      {t('views')}:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ 
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                        color: isDarkMode ? '#ffffff' : '#1a1a1a'
                      }}
                    >
                      {views}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Report Dialog */}
      <ReportDialog
        open={reportDialogOpen}
        onClose={handleCloseReportDialog}
        post={{
          _id,
          categoryname,
          region,
          exactLocation,
          contact,
          user,
          image,
          username,
          createdAt,
          updatedAt,
          countryname,
          countryLabels,
          foundLost,
          Floptions,
          description,
          contactPreferences: sanitizedContactPreferences,
          additionalContact: sanitizedAdditionalContact,
          city,
          cityLabels,
          cityName,
          title,
          titleLabels,
          descriptionLabels,
          mainDate,
          exactDate,
          views,
          lastViewedAt,
          status,
          returned,
          resolvedAt,
          expiresAt,
          tags,
          promotionRequested,
          promotionRequestedAt,
          promotionProcessed,
          promotionProcessedAt,
          Category
        }}
        onSubmit={handleSubmitReport}
      />
    </Box>
  );
};

export default SinglePostPage;
