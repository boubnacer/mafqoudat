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
import { useState } from "react";
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

  // Get category name with proper multilingual support
  const getCategoryDisplayName = () => {
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
  };

  const categoryDisplayName = getCategoryDisplayName();

  const handleEdit = () => navigate(`/dash/posts/edit/${_id}`);
  const handleReport = () => {
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
  };
  const handleBack = () => navigate(-1);

  const handleSubmitReport = async (reportData) => {
    try {
      await submitReport(reportData).unwrap();
    } catch (error) {
      throw new Error(error.data?.message || 'Failed to submit report');
    }
  };

  // Format dates using date-fns with proper locale support
  const getLocale = () => {
    switch (currentLanguage) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  };

  const createdDate = formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true,
    locale: getLocale()
  });

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
    // First try to use the populated city data from the API
    if (cityLabels && cityLabels[currentLanguage]) {
      return cityLabels[currentLanguage];
    }
    if (cityName) {
      return cityName;
    }
    // Fallback to extracting from exactLocation
    return getCityFromLocation(exactLocation);
  };

  const displayCityName = getCityName();

  const updatedDate = formatDistanceToNow(new Date(updatedAt), { 
    addSuffix: true,
    locale: getLocale()
  });

    // Determine Found/Lost status with proper multilingual support
  let foundLostValue = "FOUND";
  let foundLostLabel = t('found');
  
  if (foundLost) {
    if (typeof foundLost === 'string') {
      foundLostValue = foundLost.toUpperCase();
      foundLostLabel = foundLost === 'FOUND' ? t('found') : t('lost');
    } else if (foundLost.code) {
      foundLostValue = foundLost.code;
      foundLostLabel = getLabel(foundLost.labels, currentLanguage) || 
                      (foundLost.code === 'FOUND' ? t('found') : t('lost'));
    }
  }

  if (Floptions && Floptions.length > 0) {
    const flOption = Floptions[0];
    if (typeof flOption === 'string') {
      foundLostValue = flOption.toUpperCase();
      foundLostLabel = flOption === 'FOUND' ? t('found') : t('lost');
    } else if (flOption.code) {
      foundLostValue = flOption.code;
      foundLostLabel = getLabel(flOption.labels, currentLanguage) || 
                      (flOption.code === 'FOUND' ? t('found') : t('lost'));
    }
  }

  const isFound = foundLostValue === "FOUND";
  const statusColor = isFound ? "success" : "error";
  const statusText = foundLostLabel;

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
            elevation={3} 
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              background: theme.palette.background.paper
            }}
          >
            {/* Image Section */}
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                sx={{ 
                  height: { xs: 250, sm: 300, md: 400 },
                  width: '100%',
                  objectFit: 'cover'
                }}
                image={image ? (image.startsWith('http') ? image : `${process.env.REACT_APP_API_URL || "http://localhost:3500"}/${image}`) : sear}
                title={categoryname}
                onError={(e) => {
                  console.log('Image failed to load:', e.target.src);
                  e.target.src = sear;
                }}
              />
              
              {/* Status Badge */}
              <Chip 
                label={statusText}
                color={statusColor}
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  px: 2
                }}
              />

              {/* Category Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
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

            {/* Content Section */}
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              {/* Header */}
              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-start' }} mb={3} gap={2}>
                <Box>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      color: theme.palette.textColor.main,
                      fontWeight: 700,
                      mb: 1,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                    }}
                  >
                    {categoryDisplayName}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: theme.palette.textColor.secondary,
                      fontWeight: 500,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    {displayCityName}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={2} sx={{ direction: isRTLMode ? 'rtl' : 'ltr', flexWrap: 'wrap' }}>
                  <Tooltip title={t('sharePost')}>
                    <IconButton
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:hover': { backgroundColor: theme.palette.primary.light + '20' },
                        mx: isRTLMode ? 0.5 : 0.5
                      }}
                    >
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {canEdit && (
                    <Tooltip title={t('editPost')}>
                      <IconButton
                        onClick={handleEdit}
                        sx={{ 
                          color: theme.palette.info.main,
                          '&:hover': { backgroundColor: theme.palette.info.light + '20' },
                          mx: isRTLMode ? 0.5 : 0.5
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  <Tooltip title={t('reportPost')}>
                    <IconButton
                      onClick={() => {
                        if (!usernameId) {
                          navigate('/login');
                        } else {
                          handleReport();
                        }
                      }}
                      sx={{ 
                        color: theme.palette.error.main,
                        '&:hover': { backgroundColor: theme.palette.error.light + '20' },
                        mx: isRTLMode ? 0.5 : 0.5
                      }}
                    >
                      <ReportIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Description */}
              {description && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.textColor.main,
                      fontWeight: 600,
                      mb: 2
                    }}
                  >
                    {t('description')}
                  </Typography>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      background: theme.palette.background.default
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: theme.palette.textColor.main,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {description}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Contact Information */}
              {contact && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.textColor.main,
                      fontWeight: 600,
                      mb: 2
                    }}
                  >
                    {t('contactInformation')}
                  </Typography>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      background: theme.palette.background.default
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <ContactIcon sx={{ color: theme.palette.primary.main }} />
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: theme.palette.textColor.main,
                          fontWeight: 500
                        }}
                      >
                        {contact}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Post Details */}
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: theme.palette.textColor.main,
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  {t('postDetails')}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <PersonIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('postedBy')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                          {username || "Unknown User"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <LocationIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('exactLocation')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                          {exactLocation || t('unknownLocation')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <LocationIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('country')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                          {countryLabels?.[currentLanguage] || countryLabels?.en || countryname || t('unknownCountry')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <CalendarIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('created')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                          {createdDate}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {updatedAt !== createdAt && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <CalendarIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('lastUpdated')}
                          </Typography>
                          <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                            {updatedDate}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {/* Additional Post Information from Post Model */}
                  {title && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <TagIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('title')}
                          </Typography>
                          <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                            {title}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {mainDate && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <TimeIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('mainDate')}
                          </Typography>
                          <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                            {mainDate}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {exactDate && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <TimeIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('exactDate')}
                          </Typography>
                          <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                            {formatDistanceToNow(new Date(exactDate), { 
                              addSuffix: true,
                              locale: getLocale()
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {views !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <ViewIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('views')}
                          </Typography>
                          <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                            {views}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {status && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <FlagIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('status')}
                          </Typography>
                          <Chip 
                            label={t(status)}
                            color={status === 'active' ? 'success' : status === 'resolved' ? 'primary' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {returned && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <FlagIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('returned')}
                          </Typography>
                          <Chip 
                            label={returned ? t('yes') : t('no')}
                            color={returned ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {tags && tags.length > 0 && (
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <TagIcon sx={{ color: theme.palette.textColor.secondary, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('tags')}
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {tags.map((tag, index) => (
                              <Chip 
                                key={index}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: { xs: 'static', lg: 'sticky' }, top: '2rem' }}>
            {/* Quick Actions */}
            <Paper 
              elevation={2} 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                borderRadius: 3,
                mb: 3,
                background: theme.palette.background.paper
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.textColor.main,
                  fontWeight: 600,
                  mb: 2
                }}
              >
                {t('quickActions')}
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
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    {t('editPost')}
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {t('sharePost')}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<ReportIcon />}
                  onClick={handleReport}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    color: theme.palette.error.main,
                    borderColor: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: theme.palette.error.light + '20',
                      borderColor: theme.palette.error.main
                    }
                  }}
                >
                  {t('reportPost')}
                </Button>
              </Box>
            </Paper>

            {/* Additional Information */}
            <Paper 
              elevation={2} 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                borderRadius: 3,
                background: theme.palette.background.paper
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.textColor.main,
                  fontWeight: 600,
                  mb: 2
                }}
              >
                {t('additionalInsights')}
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <VisibilityIcon sx={{ color: theme.palette.info.main, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('postStatus')}
                    </Typography>
                    <Chip 
                      label={statusText}
                      color={statusColor}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <CategoryIcon sx={{ color: theme.palette.primary.main, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('category')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                      {categoryDisplayName}
                    </Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <LocationIcon sx={{ color: theme.palette.success.main, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('exactLocation')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                      {exactLocation || t('unknownLocation')}
                    </Typography>
                  </Box>
                </Box>

                {contact && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <ContactIcon sx={{ color: theme.palette.warning.main, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('contact')}
                      </Typography>
                      <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                        {contact}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Additional Contact Information */}
                {additionalContact && (
                  <>
                    {additionalContact.phone && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <ContactIcon sx={{ color: theme.palette.warning.main, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('additionalPhone')}
                          </Typography>
                          <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                            {additionalContact.phone}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {additionalContact.email && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <ContactIcon sx={{ color: theme.palette.warning.main, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('additionalEmail')}
                          </Typography>
                          <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                            {additionalContact.email}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {additionalContact.whatsapp && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <ContactIcon sx={{ color: theme.palette.warning.main, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('additionalWhatsapp')}
                          </Typography>
                          <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                            {additionalContact.whatsapp}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </>
                )}

                {/* Contact Preferences */}
                {contactPreferences && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <ContactIcon sx={{ color: theme.palette.info.main, ml: isRTLMode ? 1 : 0, mr: isRTLMode ? 0 : 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('contactPreferences')}
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {contactPreferences.phone && (
                          <Chip label={t('phone')} size="small" color="primary" variant="outlined" />
                        )}
                        {contactPreferences.email && (
                          <Chip label={t('email')} size="small" color="primary" variant="outlined" />
                        )}
                        {contactPreferences.whatsapp && (
                          <Chip label={t('whatsapp')} size="small" color="primary" variant="outlined" />
                        )}
                      </Box>
                    </Box>
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
        onClose={() => setReportDialogOpen(false)}
        post={{
          _id,
          categoryname,
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
