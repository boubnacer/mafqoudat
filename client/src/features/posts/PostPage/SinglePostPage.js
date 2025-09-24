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
  alpha,
  Alert
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import sear from "../../../img/sear.svg";
import { useState, useCallback, useMemo } from "react";
import ReportDialog from "../../../components/ReportDialog";
import { useSubmitReportMutation } from "../reportsApiSlice";
import { useDeletePostMutation } from "../postsApiSlice";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
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
  Category,
  // API transformation fields
  foundLostLabel
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const { usernameId, isAuthenticated } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = isRTL();

  const canEdit = user === usernameId && isAuthenticated;
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [submitReport] = useSubmitReportMutation();
  const [deletePost, { isLoading: isDeleting, isSuccess: isDeleteSuccess }] = useDeletePostMutation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Memoized event handlers
  const handleEdit = useCallback(() => {
    navigate(`/dash/posts/edit/${_id}`);
  }, [navigate, _id]);

  const handleReport = useCallback(() => {
    // Check if user is authenticated
    if (!usernameId) {
      // Store the current post URL in localStorage for redirect after signup
      const currentPostUrl = window.location.pathname;
      localStorage.setItem('redirectAfterLogin', currentPostUrl);
      
      // Redirect to signup page
      navigate('/signup');
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
      const result = await submitReport(reportData).unwrap();
      return result;
    } catch (error) {
      throw new Error(error.data?.message || 'Failed to submit report');
    }
  }, [submitReport]);

  const handleCloseReportDialog = useCallback(() => {
    setReportDialogOpen(false);
  }, []);

  const handleDeletePost = useCallback(async () => {
    if (window.confirm(t('confirmDeletePost') || 'Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost({ id: _id }).unwrap();
        setSuccessMessage(t('postDeletedSuccessfully') || 'Post deleted successfully! The post has been removed.');
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate('/dash');
        }, 2000);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  }, [deletePost, _id, navigate, t]);

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

    let foundLostValue = null;
    let displayLabel = null;
    let foundLostColor = null;
    
    // Priority 1: Use Floptions.code if available (populated object from server)
    if (Floptions) {
      
      // Handle both array and object formats
      let flOption = Floptions;
      if (Array.isArray(Floptions)) {
        flOption = Floptions[0]; // Take first element if it's an array
      }
      
      if (flOption && flOption.code) {
        foundLostValue = flOption.code;
        foundLostColor = flOption.color;
        
        // Set label and color based on code
        if (flOption.code === 'FOUND') {
          displayLabel = t('found');
          foundLostColor = foundLostColor || "#4CAF50";
        } else if (flOption.code === 'LOST') {
          displayLabel = t('lost');
          foundLostColor = foundLostColor || "#F44336";
        }
      } else {
      }
    }
    // Priority 2: Use foundLost as fallback (could be ObjectId or object)
    else if (foundLost) {
      if (typeof foundLost === 'string') {
        // If it's a string, check if it's an ObjectId or a code
        if (foundLost.length === 24) {
          // It's likely an ObjectId, we can't determine the value from this
          // This should be handled by the server to populate Floptions
          foundLostValue = null;
        } else {
          // It's a code string
          foundLostValue = foundLost.toUpperCase();
          if (foundLost.toUpperCase() === 'FOUND') {
            displayLabel = t('found');
            foundLostColor = "#4CAF50";
          } else if (foundLost.toUpperCase() === 'LOST') {
            displayLabel = t('lost');
            foundLostColor = "#F44336";
          }
        }
      } else if (foundLost.code) {
        // It's an object with code
        foundLostValue = foundLost.code;
        foundLostColor = foundLost.color;
        
        if (foundLost.code === 'FOUND') {
          displayLabel = t('found');
          foundLostColor = foundLostColor || "#4CAF50";
        } else if (foundLost.code === 'LOST') {
          displayLabel = t('lost');
          foundLostColor = foundLostColor || "#F44336";
        }
      }
    }

    // If we still don't have a value, we need to determine it from the data
    // Check if we can infer from other fields or if we need to make an API call
    if (!foundLostValue) {
      
      // Try to get from the API response or make a fallback determination
      if (foundLost && typeof foundLost === 'object' && foundLost._id) {
        // We have an ObjectId reference, but need the actual data
      }
      
      // Check if we can determine from the post title or description
      // This is a fallback for when the server doesn't populate the foundLost field
      if (titleLabels && titleLabels[currentLanguage]) {
        const title = titleLabels[currentLanguage].toLowerCase();
        if (title.includes('lost') || title.includes('perdu') || title.includes('مفقود')) {
          foundLostValue = "LOST";
          displayLabel = t('lost');
          foundLostColor = "#F44336";
        } else if (title.includes('found') || title.includes('trouvé') || title.includes('موجود')) {
          foundLostValue = "FOUND";
          displayLabel = t('found');
          foundLostColor = "#4CAF50";
        }
      }
      
      // If still no value, check description
      if (!foundLostValue && description) {
        const desc = description.toLowerCase();
        if (desc.includes('lost') || desc.includes('perdu') || desc.includes('مفقود')) {
          foundLostValue = "LOST";
          displayLabel = t('lost');
          foundLostColor = "#F44336";
        } else if (desc.includes('found') || desc.includes('trouvé') || desc.includes('موجود')) {
          foundLostValue = "FOUND";
          displayLabel = t('found');
          foundLostColor = "#4CAF50";
        }
      }
      
      // If still no value, check if we have a foundLostLabel from the API transformation
      if (!foundLostValue && foundLostLabel) {
        const label = foundLostLabel.toLowerCase();
        if (label.includes('lost') || label.includes('perdu') || label.includes('مفقود')) {
          foundLostValue = "LOST";
          displayLabel = t('lost');
          foundLostColor = "#F44336";
        } else if (label.includes('found') || label.includes('trouvé') || label.includes('موجود')) {
          foundLostValue = "FOUND";
          displayLabel = t('found');
          foundLostColor = "#4CAF50";
        }
      }
      
      // Additional fallback: Check if there's a foundLostType field
      if (!foundLostValue && foundLost && typeof foundLost === 'object') {
        if (foundLost.foundLostType) {
          const type = foundLost.foundLostType.toLowerCase();
          if (type.includes('lost')) {
            foundLostValue = "LOST";
            displayLabel = t('lost');
            foundLostColor = "#F44336";
          } else if (type.includes('found')) {
            foundLostValue = "FOUND";
            displayLabel = t('found');
            foundLostColor = "#4CAF50";
          }
        }
      }
      
      // Last resort: Check if there's any other field that might indicate status
      if (!foundLostValue) {
        

        
        // Additional fallback: Check if we can determine from the foundLost ObjectId
        // This is a last resort when the server doesn't populate the lookup fields
        if (!foundLostValue && foundLost && typeof foundLost === 'string' && foundLost.length === 24) {
          // These are the known ObjectIds from your database
          if (foundLost === '68b708a085dd243c40a90826') { // LOST
            foundLostValue = "LOST";
            displayLabel = t('lost');
            foundLostColor = "#F44336";
          } else if (foundLost === '68b708a085dd243c40a90825') { // FOUND
            foundLostValue = "FOUND";
            displayLabel = t('found');
            foundLostColor = "#4CAF50";
          }
        }
        

      }
    }

    // Set defaults only if we couldn't determine the actual value
    if (!foundLostValue) {
      // Try to infer from the post title, description, or other fields
      // For now, we'll use a neutral approach and let the user know
      foundLostValue = "UNKNOWN";
      displayLabel = t('statusUnknown') || "Status Unknown";
      foundLostColor = "#FF9800"; // Orange for unknown
    }

    const isFound = foundLostValue === "FOUND";
    const statusColor = isFound ? "success" : foundLostValue === "LOST" ? "error" : "warning";
    const statusText = displayLabel;

    const result = { isFound, statusColor, statusText };
    
    return result;
  }, [foundLost, Floptions, foundLostLabel, titleLabels, description, currentLanguage, t]);

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
        pt: { xs: "4rem", md: "5rem" },
        minHeight: "100vh",
        background: isDarkMode ? theme.palette.background.default : '#f5f5f5'
      }}
    >

      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.12)}`,
              backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.8) : '#ffffff',
              boxShadow: 'none'
            }}
          >
            {/* Image Section */}
            <Box sx={{ position: 'relative', zIndex: 1 }}>
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
                  zIndex: 10
                }}
              >
                <Chip
                  label={foundLostStatus.statusText}
                  sx={{
                    backgroundColor: alpha(
                      foundLostStatus.statusColor === 'success' ? '#4CAF50' : 
                      foundLostStatus.statusColor === 'error' ? '#F44336' : 
                      '#FF9800', 0.95
                    ),
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '14px',
                    height: 32,
                    padding: '0 12px',
                    borderRadius: '16px',
                    boxShadow: `0 4px 12px ${alpha('#000', 0.3)}, 0 2px 8px ${alpha(
                      foundLostStatus.statusColor === 'success' ? '#4CAF50' : 
                      foundLostStatus.statusColor === 'error' ? '#F44336' : 
                      '#FF9800', 0.4
                    )}`,
                    border: `2px solid ${alpha('#fff', 0.8)}`,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    '& .MuiChip-label': {
                      color: 'white',
                      fontWeight: 700,
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    },
                    '&:hover': {
                      backgroundColor: alpha(
                        foundLostStatus.statusColor === 'success' ? '#4CAF50' : 
                        foundLostStatus.statusColor === 'error' ? '#F44336' : 
                        '#FF9800', 1
                      ),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 16px ${alpha('#000', 0.4)}, 0 4px 12px ${alpha(
                        foundLostStatus.statusColor === 'success' ? '#4CAF50' : 
                        foundLostStatus.statusColor === 'error' ? '#F44336' : 
                        '#FF9800', 0.6
                      )}`
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
                  zIndex: 5
                }}
              >
                <Box
                  sx={{
                    backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.9) : alpha(categoryStyle.background, 0.95),
                    padding: '8px 12px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backdropFilter: 'blur(10px)',
                    border: `2px solid ${alpha('#fff', 0.8)}`,
                    boxShadow: `0 4px 12px ${alpha('#000', 0.3)}, 0 2px 8px ${alpha(categoryStyle.main, 0.4)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: isDarkMode ? alpha(categoryStyle.main, 1) : alpha(categoryStyle.background, 1),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 16px ${alpha('#000', 0.4)}, 0 4px 12px ${alpha(categoryStyle.main, 0.6)}`
                    }
                  }}
                >
                  <RenderIcon 
                    name={`${categoryname?.toLowerCase()}cate`} 
                    sx={{ 
                      fontSize: '16px', 
                      color: isDarkMode ? '#fff' : categoryStyle.text,
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                    }} 
                  />
                  <Typography
                    sx={{
                      color: isDarkMode ? '#fff' : categoryStyle.text,
                      fontSize: '14px',
                      fontWeight: 600,
                      textShadow: isDarkMode ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
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
                  color: isDarkMode ? '#ffffff' : '#1a1a1a',
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
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
                    color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                    fontSize: { xs: '1rem', sm: '1rem', md: '1rem' }
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
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '0.95rem', md: '0.95rem' }
                        }}
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
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '0.95rem', md: '0.95rem' }
                        }}
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
                      color: isDarkMode ? '#ffffff' : '#1a1a1a',
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.25rem' }
                    }}
                  >
                    {t('contactInformation')}
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                      fontSize: { xs: '1rem', sm: '1rem', md: '1rem' }
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
                      color: isDarkMode ? '#ffffff' : '#1a1a1a',
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.25rem' }
                    }}
                  >
                    {t('additionalContactDetails')}
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {sanitizedAdditionalContact.phone && (
                      <Typography 
                        variant="body1"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' }
                        }}
                      >
                        {t('phoneNumber')}: {sanitizedAdditionalContact.phone}
                      </Typography>
                    )}
                    {sanitizedAdditionalContact.email && (
                      <Typography 
                        variant="body1"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' }
                        }}
                      >
                        {t('emailAddress')}: {sanitizedAdditionalContact.email}
                      </Typography>
                    )}
                    {sanitizedAdditionalContact.whatsapp && (
                      <Typography 
                        variant="body1"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' }
                        }}
                      >
                        {t('whatsappNumber')}: {sanitizedAdditionalContact.whatsapp}
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
                border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.12)}`,
                backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.8) : '#ffffff',
                boxShadow: 'none'
              }}
            >
              <Typography 
                variant="h6" 
                fontWeight={600}
                sx={{ 
                  mb: 3,
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                  color: isDarkMode ? '#ffffff' : '#1a1a1a',
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.25rem' }
                }}
              >
                {t('actions')}
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                {canEdit && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                      fullWidth
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                        gap: currentLanguage === 'ar' ? 1 : 0.5,
                        boxShadow: 'none',
                        border: isDarkMode 
                          ? `1px solid ${theme.palette.primary.main}` 
                          : `1px solid ${alpha('#000', 0.3)}`,
                        '&:hover': {
                          boxShadow: 'none',
                          backgroundColor: isDarkMode 
                            ? alpha(theme.palette.primary.main, 0.1) 
                            : alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                    >
                      {t('editPost')}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeletePost}
                      disabled={isDeleting}
                      fullWidth
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                        gap: currentLanguage === 'ar' ? 1 : 0.5,
                        boxShadow: 'none',
                        borderColor: theme.palette.error.main,
                        color: theme.palette.error.main,
                        '&:hover': {
                          backgroundColor: theme.palette.error.main,
                          color: 'white',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      {isDeleting ? t('deleting') || 'Deleting...' : t('deletePost')}
                    </Button>
                  </>
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
                    gap: currentLanguage === 'ar' ? 1 : 0.5,
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: theme.palette.error.main,
                      color: 'white',
                      boxShadow: 'none'
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
                border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.12)}`,
                backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.8) : '#ffffff',
                boxShadow: 'none'
              }}
            >
              <Typography 
                variant="h6" 
                fontWeight={600}
                sx={{ 
                  mb: 3,
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                  color: isDarkMode ? '#ffffff' : '#1a1a1a',
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.25rem' }
                }}
              >
                {t('postDetails')}
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.875rem' }
                    }}
                  >
                    {t('postedBy')}:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={600}
                    sx={{ 
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      color: isDarkMode ? '#ffffff' : '#1a1a1a',
                      fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.875rem' }
                    }}
                  >
                    {username || t('anonymous')}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.875rem' }
                    }}
                  >
                    {t('created')}:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={600}
                    sx={{ 
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      color: isDarkMode ? '#ffffff' : '#1a1a1a',
                      fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.875rem' }
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
                      sx={{ 
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                        fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.875rem' }
                      }}
                    >
                      {t('updated')}:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ 
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                        color: isDarkMode ? '#ffffff' : '#1a1a1a',
                        fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.875rem' }
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
                      sx={{ 
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                        fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.875rem' }
                      }}
                    >
                      {t('views')}:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ 
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                        color: isDarkMode ? '#ffffff' : '#1a1a1a',
                        fontSize: { xs: '0.9rem', sm: '0.875rem', md: '0.875rem' }
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

      {/* Success Message */}
      {showSuccessMessage && (
        <Box
          sx={{
            position: 'fixed',
            top: { xs: '80px', md: '100px' },
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: { xs: '90%', sm: '400px' },
            width: '100%',
            animation: 'slideDown 0.3s ease-out',
            '@keyframes slideDown': {
              '0%': {
                opacity: 0,
                transform: 'translateX(-50%) translateY(-20px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateX(-50%) translateY(0)',
              },
            },
          }}
        >
          <Alert
            severity="success"
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
              border: `1px solid ${alpha('#4CAF50', 0.2)}`,
              backgroundColor: isDarkMode ? alpha('#1B5E20', 0.9) : alpha('#E8F5E8', 0.95),
              backdropFilter: 'blur(10px)',
              '& .MuiAlert-message': {
                color: isDarkMode ? '#E8F5E8' : '#2E7D32',
                fontWeight: 600,
                direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
              },
              '& .MuiAlert-icon': {
                color: '#4CAF50',
              },
            }}
          >
            {successMessage}
          </Alert>
        </Box>
      )}

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
          user: user || 'anonymous', // Ensure user field is never undefined
          image,
          username: username || 'Anonymous', // Ensure username field is never undefined
          createdAt,
          updatedAt,
          countryname,
          countryLabels,
          foundLost: foundLost || 'UNKNOWN', // Ensure foundLost field is never undefined
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
