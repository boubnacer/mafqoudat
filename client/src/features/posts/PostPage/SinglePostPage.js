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
import noImageSvg from "../../../img/noimage.svg";
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
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
  WhatsApp as WhatsAppIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";

import "./editpost.css";
import { useTranslation } from "../../../utils/translations";
import { isRTL, getLabel } from "../../../utils/languageUtils";
import { getOptimizedImageUrl } from "../../../utils/cloudinaryUtils";
import LazyCardMedia from "../../../components/LazyCardMedia";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import RenderIcon from "../../../components/RenderIcon";
import { authStorage } from "../../../utils/authStorage";
import { getCategoryConfig } from "../../../config/categories";
import PromotionDialog from "../../../components/PromotionDialog";
import ClaimItemDialog from "../../../components/ClaimItemDialog";

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
  foundLostLabel,
  // Refetch function
  refetchPost
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const { usernameId, isAuthenticated, role } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = isRTL();

  const canEdit = user === usernameId && isAuthenticated;
  const canDelete = canEdit || (role === 'admin' && isAuthenticated);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [submitReport] = useSubmitReportMutation();
  const [deletePost, { isLoading: isDeleting, isSuccess: isDeleteSuccess }] = useDeletePostMutation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  // Memoized event handlers
  const handleEdit = useCallback(() => {
    navigate(`/dash/posts/edit/${_id}`);
  }, [navigate, _id]);

  const handleReport = useCallback(() => {
    // Check if user is authenticated
    if (!usernameId) {
      // Store the current post URL in localStorage for redirect after login
      const currentPostUrl = window.location.pathname;
      authStorage.setRedirectAfterLogin(currentPostUrl);
      
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

  const handlePromotionRequest = useCallback(() => {
    setShowPromotionDialog(true);
  }, []);

  const handleClosePromotionDialog = useCallback(() => {
    setShowPromotionDialog(false);
  }, []);

  const handlePromotionRequested = useCallback(() => {
    // Handle successful promotion request
    setSuccessMessage(t('promotionRequested') || 'Promotion request submitted successfully!');
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  }, [t]);

  const handleClaimItem = useCallback(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !usernameId) {
      // Store the current post URL in localStorage for redirect after login
      const currentPostUrl = window.location.pathname;
      authStorage.setRedirectAfterLogin(currentPostUrl);
      
      // Redirect to login page
      navigate('/login');
      return;
    }
    
    // If authenticated, open the claim dialog
    setShowClaimDialog(true);
  }, [isAuthenticated, usernameId, navigate]);

  const handleCloseClaimDialog = useCallback(() => {
    setShowClaimDialog(false);
  }, []);

  const handleItemMarkedAsReturned = useCallback(() => {
    // Handle successful marking as returned
    setSuccessMessage(t('itemMarkedAsReturned') || 'Item marked as returned successfully!');
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      // Refetch the post data to get updated returned status
      if (refetchPost) {
        refetchPost();
      } else {
        // Fallback to page reload if refetch is not available
        window.location.reload();
      }
    }, 2000);
  }, [t, refetchPost]);

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
    
    // Last fallback: return the original categoryname or unknown
    return categoryname || t('unknownCategory');
  }, [Category, categoryname, currentLanguage, t]);

  // Memoized city name computation
  const displayCityName = useMemo(() => {
    // Get city name with proper multilingual support
    // First priority: Use the populated city data from the API
    if (cityLabels && cityLabels[currentLanguage]) {
      return cityLabels[currentLanguage];
    }
    // Second priority: Use the English city name as fallback
    if (cityName) {
      return cityName;
    }
    // Third priority: Use the city field directly (for custom city names like API cities)
    if (city && typeof city === 'string' && city.trim()) {
      return city.trim();
    }
    // Last fallback: "Unknown City"
    return t('unknownCity') || 'Unknown City';
  }, [cityLabels, cityName, city, currentLanguage, t]);

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

  // Memoized image URL computation - only use Cloudinary if image exists and is uploaded by user
  const imageUrl = useMemo(() => {
    if (!image) return noImageSvg;
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
        p: { xs: 1.5, sm: 2, md: 4 },
        pt: { xs: "4rem", sm: "4.5rem", md: "5rem" },
        mt: { xs: "2rem", sm: "1.5rem", md: "1rem" },
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
                  objectFit: image ? 'cover' : 'contain',
                  objectPosition: 'center',
                  backgroundColor: 'transparent',
                }}
                image={imageUrl}
                alt={categoryDisplayName || 'Post Image'}
                fallback={noImageSvg}
              />
              
              {/* No Image Overlay */}
              {!image && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 3,
                    textAlign: 'center',
                    backgroundColor: alpha(isDarkMode ? '#000' : '#fff', 0.9),
                    borderRadius: '16px',
                    padding: '20px 24px',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(isDarkMode ? '#fff' : '#000', 0.1)}`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    maxWidth: '80%',
                  }}
                >
                  <Typography
                    sx={{
                      color: isDarkMode ? '#fff' : '#000',
                      fontSize: { xs: '16px', sm: '18px', md: '20px' },
                      fontWeight: 600,
                      lineHeight: 1.3,
                      mb: 1,
                    }}
                  >
                    {t('noImageAvailable')}
                  </Typography>
                  <Typography
                    sx={{
                      color: isDarkMode ? alpha('#fff', 0.7) : alpha('#000', 0.6),
                      fontSize: { xs: '12px', sm: '14px', md: '16px' },
                      fontWeight: 400,
                      lineHeight: 1.4,
                    }}
                  >
                    {t('postHasNoImage')}
                  </Typography>
                </Box>
              )}
              
              {/* Status Badge Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  zIndex: 2
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
                    '& .MuiChip-label': {
                      color: 'white',
                      fontWeight: 700
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
                  zIndex: 2
                }}
              >
                <Box
                  sx={{
                    backgroundColor: isDarkMode ? 'rgb(232, 245, 233)' : categoryStyle.background,
                    padding: '6px 12px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isDarkMode ? alpha(categoryStyle.main, 0.3) : categoryStyle.main}`,
                    zIndex: 11
                  }}
                >
                  <RenderIcon 
                    name={`${categoryname?.toLowerCase()}cate`} 
                    sx={{ 
                      fontSize: '18px', 
                      color: isDarkMode ? categoryStyle.main : categoryStyle.text
                    }} 
                  />
                  <Typography
                    sx={{
                      color: isDarkMode ? categoryStyle.main : categoryStyle.text,
                      fontSize: '14px',
                      fontWeight: 700,
                      lineHeight: 1
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

              {/* Separator Line */}
              <Divider sx={{ my: 3, borderColor: isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1) }} />

              {/* Additional Post Information */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" flexDirection="column" gap={{ xs: 1.5, sm: 2, md: 2 }}>

                    {/* Description with descriptionLabels support */}
                    <Box display="flex" 
                         sx={{ 
                           flexDirection: { xs: 'row', sm: 'row' }, 
                           gap: { xs: 1, sm: 2 },
                           alignItems: { xs: 'center', sm: 'flex-start' }
                         }}>
                  <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontWeight: 500,
                          flexShrink: 0
                        }}
                      >
                        {t('description')}:
                      </Typography>
                      <Typography 
                        variant="body2" 
                    fontWeight={600}
                    sx={{ 
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      color: isDarkMode ? '#ffffff' : '#1a1a1a',
                          fontSize: '0.875rem',
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left',
                          flex: 1,
                          lineHeight: 1.4
                    }}
                  >
                        {(descriptionLabels && descriptionLabels[currentLanguage]) || description || t('noDescriptionProvided')}
                  </Typography>
                    </Box>

                    {/* Category with categoryDisplayName */}
                    <Box display="flex" 
                         sx={{ 
                           flexDirection: { xs: 'row', sm: 'row' }, 
                           gap: { xs: 1, sm: 2 },
                           alignItems: { xs: 'center', sm: 'flex-start' }
                         }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontWeight: 500,
                          flexShrink: 0
                        }}
                      >
                        {t('category')}:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: categoryStyle.text,
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                        }}
                      >
                        {categoryDisplayName}
                      </Typography>
                    </Box>

                    {/* Status with foundLostStatus */}
                    <Box display="flex" 
                         sx={{ 
                           flexDirection: { xs: 'row', sm: 'row' }, 
                           gap: { xs: 1, sm: 2 },
                           alignItems: { xs: 'center', sm: 'flex-start' }
                         }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontWeight: 500,
                          flexShrink: 0
                        }}
                      >
                        {t('status')}:
                      </Typography>
                      <Chip
                        label={foundLostStatus.statusText}
                        size="small"
                        sx={{
                          backgroundColor: foundLostStatus.statusColor === 'success' ? '#4CAF50' : 
                                         foundLostStatus.statusColor === 'error' ? '#F44336' : 
                                         '#FF9800',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                          '& .MuiChip-label': {
                            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                            color: 'white',
                            fontWeight: 600
                          }
                        }}
                      />
                    </Box>

                    {/* Location with exactLocation */}
                    <Box display="flex" 
                         sx={{ 
                           flexDirection: { xs: 'row', sm: 'row' }, 
                           gap: { xs: 1, sm: 2 },
                           alignItems: { xs: 'center', sm: 'flex-start' }
                         }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontWeight: 500,
                          flexShrink: 0
                        }}
                      >
                        {t('exactLocation')}:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: isDarkMode ? '#ffffff' : '#1a1a1a',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                        }}
                      >
                        {exactLocation || t('noLocationProvided')}
                      </Typography>
                    </Box>

                    {/* City with displayCityName */}
                    <Box display="flex" 
                         sx={{ 
                           flexDirection: { xs: 'row', sm: 'row' }, 
                           gap: { xs: 1, sm: 2 },
                           alignItems: { xs: 'center', sm: 'flex-start' }
                         }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontWeight: 500,
                          flexShrink: 0
                        }}
                      >
                        {t('city')}:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: isDarkMode ? '#ffffff' : '#1a1a1a',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                        }}
                      >
                        {displayCityName}
                      </Typography>
                    </Box>

                    {/* Country with countryLabels support */}
                    <Box display="flex" 
                         sx={{ 
                           flexDirection: { xs: 'row', sm: 'row' }, 
                           gap: { xs: 1, sm: 2 },
                           alignItems: { xs: 'center', sm: 'flex-start' }
                         }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontWeight: 500,
                          flexShrink: 0
                        }}
                      >
                        {t('country')}:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: isDarkMode ? '#ffffff' : '#1a1a1a',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                        }}
                      >
                        {(countryLabels && countryLabels[currentLanguage]) || (countryname && typeof countryname === 'string' && countryname.length > 3 ? countryname : t('noCountryProvided'))}
                      </Typography>
                    </Box>

                    {/* Exact Date (using mainDate string) */}
                    <Box display="flex" 
                         sx={{ 
                           flexDirection: { xs: 'row', sm: 'row' }, 
                           gap: { xs: 1, sm: 2 },
                           alignItems: { xs: 'center', sm: 'flex-start' }
                         }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontWeight: 500,
                          flexShrink: 0
                        }}
                      >
                        {t('exactDate')}:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          color: isDarkMode ? '#ffffff' : '#1a1a1a',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                        }}
                      >
                        {mainDate && mainDate.trim() ? mainDate : t('noDateProvided')}
                      </Typography>
                    </Box>


                    {/* Tags - if available */}
                    {tags && tags.length > 0 && (
                      <Box display="flex" 
                           sx={{ 
                             flexDirection: { xs: 'column', sm: 'row' }, 
                             gap: { xs: 0.5, sm: 2 },
                             alignItems: { xs: 'flex-start', sm: 'flex-start' }
                           }}>
                      <Typography 
                          variant="body2" 
                          color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                            fontSize: '0.875rem',
                            minWidth: { xs: 'auto', sm: '120px' },
                            fontWeight: 500,
                            flexShrink: 0
                          }}
                        >
                          {t('tags')}:
                      </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5} sx={{ flex: 1 }}>
                          {tags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              sx={{
                                fontSize: '0.75rem',
                                height: 24,
                                backgroundColor: isDarkMode ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                '& .MuiChip-label': {
                                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Posted By with username */}
                    <Box display="flex" 
                         sx={{ 
                           flexDirection: { xs: 'row', sm: 'row' }, 
                           gap: { xs: 1, sm: 2 },
                           alignItems: { xs: 'center', sm: 'flex-start' }
                         }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontWeight: 500,
                          flexShrink: 0
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
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                        }}
                      >
                        {username || t('anonymous')}
                      </Typography>
                    </Box>

                    {/* Created date */}
                    <Box display="flex" 
                         sx={{ 
                           flexDirection: { xs: 'row', sm: 'row' }, 
                           gap: { xs: 1, sm: 2 },
                           alignItems: { xs: 'center', sm: 'flex-start' }
                         }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontWeight: 500,
                          flexShrink: 0
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
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                        }}
                      >
                        {createdDate}
                      </Typography>
                    </Box>

                    {/* Views */}
                    {views !== undefined && (
                      <Box display="flex" 
                           sx={{ 
                             flexDirection: { xs: 'column', sm: 'row' }, 
                             gap: { xs: 0.5, sm: 2 },
                             alignItems: { xs: 'flex-start', sm: 'flex-start' }
                           }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                            fontSize: '0.875rem',
                            minWidth: { xs: 'auto', sm: '120px' },
                            fontWeight: 500,
                            flexShrink: 0
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
                            fontSize: '0.875rem',
                            textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                          }}
                        >
                          {views}
                        </Typography>
                  </Box>
                    )}

                    {/* Post status - active/resolved/expired */}
                    {status && (
                      <Box display="flex" 
                           sx={{ 
                             flexDirection: { xs: 'column', sm: 'row' }, 
                             gap: { xs: 0.5, sm: 2 },
                             alignItems: { xs: 'flex-start', sm: 'flex-start' }
                           }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                            fontSize: '0.875rem',
                            minWidth: { xs: 'auto', sm: '120px' },
                            fontWeight: 500,
                            flexShrink: 0
                          }}
                        >
                          {t('postStatus')}:
                        </Typography>
                        <Chip
                          label={status}
                          size="small"
                          sx={{
                            backgroundColor: status === 'active' ? '#4CAF50' : 
                                           status === 'resolved' ? '#2196F3' : 
                                           status === 'expired' ? '#FF9800' : 
                                           alpha(theme.palette.primary.main, 0.1),
                            color: status === 'active' || status === 'resolved' || status === 'expired' ? '#fff' : theme.palette.primary.main,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                            '& .MuiChip-label': {
                              direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                              fontWeight: 600
                            }
                          }}
                        />
                </Box>
              )}

                    {/* Returned status */}
                    {returned !== undefined && (
                      <Box display="flex" 
                           sx={{ 
                             flexDirection: { xs: 'row', sm: 'row' }, 
                             gap: { xs: 1, sm: 2 },
                             alignItems: { xs: 'center', sm: 'flex-start' }
                           }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                            fontSize: '0.875rem',
                            minWidth: { xs: 'auto', sm: '120px' },
                            fontWeight: 500,
                            flexShrink: 0
                          }}
                        >
                          {t('returned')}:
                        </Typography>
                        <Chip
                          label={returned ? t('yes') : t('no')}
                          size="small"
                          sx={{
                            backgroundColor: returned ? '#4CAF50' : '#F44336',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                            '& .MuiChip-label': {
                              direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                              fontWeight: 600
                            }
                          }}
                        />
                      </Box>
                    )}
                </Box>
              </Box>

              {/* Contact Information - Removed as contact info will be shown in claim dialog */}
              {/* Additional Contact - Removed as contact info will be shown in claim dialog */}
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: { xs: 'static', lg: 'sticky' }, top: { lg: '2rem' } }}>
            {/* Debug Info - Remove this after testing */}
            {process.env.NODE_ENV === 'development' && (
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f0f0f0' }}>
                <Typography variant="caption" display="block">
                  Debug Info:
                </Typography>
                <Typography variant="caption" display="block">
                  isAuthenticated: {String(isAuthenticated)}
                </Typography>
                <Typography variant="caption" display="block">
                  usernameId: {String(usernameId)}
                </Typography>
                <Typography variant="caption" display="block">
                  user: {String(user)}
                </Typography>
                <Typography variant="caption" display="block">
                  returned: {String(returned)}
                </Typography>
                <Typography variant="caption" display="block">
                  Should show claim: {String(usernameId !== user && !returned)}
                </Typography>
              </Paper>
            )}

            {/* Claim Item Section - Show for all users who are NOT the post owner */}
            {usernameId !== user && !returned && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 3,
                  borderRadius: 3,
                  border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.12)}`,
                  backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.8) : '#ffffff',
                  boxShadow: 'none',
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(66, 165, 245, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(30, 136, 229, 0.02) 100%)',
                  border: `2px solid ${isDarkMode ? alpha('#2196F3', 0.2) : alpha('#1976D2', 0.2)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: isDarkMode 
                      ? 'linear-gradient(90deg, #2196F3, #42A5F5)' 
                      : 'linear-gradient(90deg, #1976D2, #1E88E5)',
                  }
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box
                    sx={{
                      backgroundColor: isDarkMode ? alpha('#2196F3', 0.2) : alpha('#1976D2', 0.1),
                      borderRadius: '50%',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircleIcon sx={{ 
                      color: isDarkMode ? '#2196F3' : '#1976D2',
                      fontSize: 24
                    }} />
                  </Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700}
                    sx={{ 
                      color: isDarkMode ? '#2196F3' : '#1976D2',
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.25rem' },
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                    }}
                  >
                    {foundLostStatus.isFound 
                      ? t('doYouThinkThisItemIsYours')
                      : t('didYouFindThisItem')
                    }
                  </Typography>
                </Box>

                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3,
                    color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                    fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                    lineHeight: 1.6,
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                  }}
                >
                  {foundLostStatus.isFound 
                    ? t('ifYouLostThisItem')
                    : t('ifYouFoundThisItem')
                  }
                </Typography>

                <Button
                  variant="contained"
                  onClick={handleClaimItem}
                  fullWidth
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                    gap: currentLanguage === 'ar' ? 1 : 0.5,
                    background: isDarkMode
                      ? 'linear-gradient(45deg, #2196F3 30%, #42A5F5 90%)'
                      : 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                    color: '#ffffff',
                    py: 1.5,
                    fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                    '&:hover': {
                      background: isDarkMode
                        ? 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)'
                        : 'linear-gradient(45deg, #0D47A1 30%, #1565C0 90%)',
                      transform: 'translateY(-1px)',
                      boxShadow: isDarkMode
                        ? '0 8px 20px rgba(33, 150, 243, 0.3)'
                        : '0 8px 20px rgba(25, 118, 210, 0.3)',
                    },
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: isDarkMode
                      ? '0 4px 12px rgba(33, 150, 243, 0.2)'
                      : '0 4px 12px rgba(25, 118, 210, 0.2)',
                  }}
                >
                  {foundLostStatus.isFound ? t('yesThisIsMyItem') : t('yesIFoundThisItem')}
                </Button>
              </Paper>
            )}

            {/* Promotion Section - Only show for post owner */}
            {canEdit && !promotionRequested && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 3,
                  borderRadius: 3,
                  border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.12)}`,
                  backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.8) : '#ffffff',
                  boxShadow: 'none',
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(102, 187, 106, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(56, 142, 60, 0.02) 100%)',
                  border: `2px solid ${isDarkMode ? alpha('#4CAF50', 0.2) : alpha('#2E7D32', 0.2)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: isDarkMode 
                      ? 'linear-gradient(90deg, #4CAF50, #66BB6A)' 
                      : 'linear-gradient(90deg, #2E7D32, #388E3C)',
                  }
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box
                    sx={{
                      backgroundColor: isDarkMode ? alpha('#4CAF50', 0.2) : alpha('#2E7D32', 0.1),
                      borderRadius: '50%',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <TrendingUpIcon sx={{ 
                      color: isDarkMode ? '#4CAF50' : '#2E7D32',
                      fontSize: 24
                    }} />
                  </Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700}
                    sx={{ 
                      color: isDarkMode ? '#4CAF50' : '#2E7D32',
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.25rem' },
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                    }}
                  >
                    {foundLostStatus.isFound ? t('promoteYourFoundItem') : t('boostYourChances')}
                  </Typography>
                </Box>

                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3,
                    color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                    fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                    lineHeight: 1.6,
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                  }}
                >
                  {foundLostStatus.isFound 
                    ? t('teamHasPromotionTechniques') 
                    : t('teamHasTechniques')
                  }
                </Typography>

                <Button
                  variant="contained"
                  onClick={handlePromotionRequest}
                  fullWidth
                  startIcon={<WhatsAppIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                    gap: currentLanguage === 'ar' ? 1 : 0.5,
                    background: isDarkMode
                      ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                      : 'linear-gradient(45deg, #2E7D32 30%, #388E3C 90%)',
                    color: '#ffffff',
                    py: 1.5,
                    fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                    '&:hover': {
                      background: isDarkMode
                        ? 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)'
                        : 'linear-gradient(45deg, #1B5E20 30%, #2E7D32 90%)',
                      transform: 'translateY(-1px)',
                      boxShadow: isDarkMode
                        ? '0 8px 20px rgba(76, 175, 80, 0.3)'
                        : '0 8px 20px rgba(46, 125, 50, 0.3)',
                    },
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: isDarkMode
                      ? '0 4px 12px rgba(76, 175, 80, 0.2)'
                      : '0 4px 12px rgba(46, 125, 50, 0.2)',
                  }}
                >
                  {t('yesPromote')}
                </Button>
              </Paper>
            )}

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
                )}
                
                {canDelete && (
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

      {/* Promotion Dialog */}
      <PromotionDialog
        open={showPromotionDialog}
        onClose={handleClosePromotionDialog}
        postId={_id}
        isLostItem={!foundLostStatus.isFound}
        onPromotionRequested={handlePromotionRequested}
      />

      {/* Claim Item Dialog */}
      <ClaimItemDialog
        open={showClaimDialog}
        onClose={handleCloseClaimDialog}
        postId={_id}
        isFoundPost={foundLostStatus.isFound}
        contactInfo={{
          phone: contact,
          additionalContact: sanitizedAdditionalContact
        }}
        onItemMarkedAsReturned={handleItemMarkedAsReturned}
      />
    </Box>
  );
};

export default SinglePostPage;
