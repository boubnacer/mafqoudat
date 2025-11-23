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
import { getCategoryConfig, getCategoryIcon } from "../../../config/categories";
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
  // Categories array from aggregation (new format)
  Categories,
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

  const canEdit = (user === usernameId || role === 'admin') && isAuthenticated;
  const canDelete = canEdit;
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
      authStorage.setRedirectAfterLoginWithMessage(currentPostUrl, 'loginRequiredReportPost');
      
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
      authStorage.setRedirectAfterLoginWithMessage(currentPostUrl, 'loginRequiredClaimItem');
      
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
    const timeAgo = formatDistanceToNow(new Date(createdAt), { 
      addSuffix: true,
      locale
    });
    return `${t('posted')} ${timeAgo}`;
  }, [createdAt, locale, t]);

  const updatedDate = useMemo(() => {
    return formatDistanceToNow(new Date(updatedAt), { 
      addSuffix: true,
      locale
    });
  }, [updatedAt, locale]);

  const isDarkMode = theme.palette.mode === 'dark';

  // Memoized categories array computation - support both new Categories array and legacy Category
  const categories = useMemo(() => {
    const cats = [];
    
    // First priority: Use the Categories array from API aggregation (new format)
    if (Categories && Array.isArray(Categories) && Categories.length > 0) {
      Categories.forEach(cat => {
        if (cat && cat.code) {
          cats.push({
            code: cat.code,
            labels: cat.labels,
            _id: cat._id
          });
        }
      });
    }
    
    // Fallback: Use the legacy Category object (backward compatibility)
    if (cats.length === 0 && Category && Category.code) {
      cats.push({
        code: Category.code,
        labels: Category.labels,
        _id: Category._id
      });
    }
    
    // Last fallback: Use categoryname if available
    if (cats.length === 0 && categoryname) {
      cats.push({
        code: categoryname,
        labels: null,
        _id: null
      });
    }
    
    return cats.length > 0 ? cats : [{ code: 'OTHER', labels: null, _id: null }];
  }, [Categories, Category, categoryname]);

  // Memoized category display names computation
  const categoryNames = useMemo(() => {
    return categories.map(cat => {
      if (cat.labels) {
        return cat.labels[currentLanguage] || cat.labels.en || cat.code;
      }
      return cat.code || t('unknownCategory');
    });
  }, [categories, currentLanguage, t]);

  // Memoized category styles computation
  const categoryStyles = useMemo(() => {
    return categories.map(cat => {
      try {
        const config = getCategoryConfig(cat.code);
        const isDarkMode = theme.palette.mode === 'dark';
        return {
          main: config.color,
          light: config.backgroundColor,
          dark: config.color,
          icon: config.color,
          background: isDarkMode ? alpha(config.backgroundColor, 0.2) : config.backgroundColor,
          text: config.color
        };
      } catch (error) {
        return {
          main: '#2196F3',
          light: '#E3F2FD',
          dark: '#1976D2',
          icon: '#2196F3',
          background: isDarkMode ? alpha('#E3F2FD', 0.2) : '#E3F2FD',
          text: '#2196F3'
        };
      }
    });
  }, [categories, theme.palette.mode]);

  // Legacy single category name for backward compatibility (first category)
  const categoryDisplayName = useMemo(() => {
    return categoryNames[0] || t('unknownCategory');
  }, [categoryNames, t]);

  // Legacy single category style for backward compatibility (first category)
  const categoryStyle = useMemo(() => {
    return categoryStyles[0] || {
      main: '#2196F3',
      light: '#E3F2FD',
      dark: '#1976D2',
      icon: '#2196F3',
      background: isDarkMode ? alpha('#E3F2FD', 0.2) : '#E3F2FD',
      text: '#2196F3'
    };
  }, [categoryStyles, isDarkMode]);

  // Extract city from location (show only city) - helper function
  const getCityFromLocation = useCallback((location) => {
    if (!location) return t('unknownLocation');
    // Split by comma and take the first part (usually the city)
    const parts = location.split(',');
    const city = parts[0].trim();
    // Remove any extra location details that might be in parentheses
    const cleanCity = city.split('(')[0].trim();
    // Remove any numbers or extra details
    return cleanCity.replace(/\d+/g, '').trim();
  }, [t]);

  // Memoized city name computation - standardized with RecentPosts approach
  const displayCityName = useMemo(() => {
    // Get city name with proper multilingual support
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
  }, [cityLabels, cityName, city, currentLanguage, exactLocation, getCityFromLocation]);

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
    if (!image) return null;
    return image.startsWith('http') 
      ? getOptimizedImageUrl(image, 'large') 
      : image;
  }, [image]);

  // Memoized category icons for when there's no image - support multiple categories
  const categoryIconsData = useMemo(() => {
    if (image) return []; // Only show icons when there's no image
    
    if (!categories || categories.length === 0) return [];
    
    return categories.map((cat, index) => {
      const IconComponent = getCategoryIcon(cat.code);
      const catStyle = categoryStyles[index];
      
      if (!IconComponent) return null;
      
      return {
        IconComponent,
        style: catStyle,
        code: cat.code
      };
    }).filter(Boolean); // Remove null entries
  }, [image, categories, categoryStyles]);

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
            <Box sx={{ 
              position: 'relative', 
              zIndex: 1,
              backgroundColor: image ? 'transparent' : (categoryStyles[0]?.background || (isDarkMode ? '#1a1a1a' : '#f5f5f5')),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {image && imageUrl ? (
                <LazyCardMedia
                  component="img"
                  sx={{
                    width: '100%',
                    height: { xs: 300, sm: 400, md: 500 },
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                  image={imageUrl}
                  alt={categoryDisplayName || 'Post Image'}
                  fallback={noImageSvg}
                />
              ) : categoryIconsData.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    padding: 2,
                    width: '100%',
                    height: { xs: 300, sm: 400, md: 500 },
                    zIndex: 1,
                  }}
                >
                  {categoryIconsData.length === 1 ? (() => {
                    const IconComponent = categoryIconsData[0].IconComponent;
                    return (
                      <IconComponent
                        sx={{
                          fontSize: { xs: '120px', sm: '150px', md: '180px' },
                          color: categoryIconsData[0].style?.main || theme.palette.text.secondary,
                          opacity: 0.85,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        }}
                      />
                    );
                  })(                  ) : (
                    // Multiple icons - simple flex layout
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: { xs: 3, sm: 3.5, md: 4 },
                        flexWrap: 'wrap',
                        paddingTop: { xs: 2, sm: 2.5, md: 3 },
                      }}
                    >
                      {categoryIconsData.slice(0, 4).map((iconData, idx) => {
                        const IconComponent = iconData.IconComponent;
                        return (
                          <IconComponent
                            key={iconData.code || idx}
                            sx={{
                              fontSize: { xs: '64px', sm: '80px', md: '96px' },
                              color: iconData.style?.main || theme.palette.text.secondary,
                              opacity: 0.85,
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>
              ) : null}
              

              {/* Category Badges Overlay - Multiple categories support */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 2,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  maxWidth: 'calc(100% - 32px)',
                }}
              >
                {categories.map((cat, index) => {
                  const catStyle = categoryStyles[index];
                  const catName = categoryNames[index];
                  return (
                    <Box
                      key={cat.code || index}
                      sx={{
                        backgroundColor: isDarkMode ? 'rgb(232, 245, 233)' : catStyle.background,
                        padding: '6px 12px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${isDarkMode ? alpha(catStyle.main, 0.3) : catStyle.main}`,
                        zIndex: 11
                      }}
                    >
                      <RenderIcon 
                        name={`${cat.code?.toLowerCase() || 'other'}cate`} 
                        sx={{ 
                          fontSize: '18px', 
                          color: isDarkMode ? catStyle.main : catStyle.text
                        }} 
                      />
                      <Typography
                        sx={{
                          color: isDarkMode ? catStyle.main : catStyle.text,
                          fontSize: '14px',
                          fontWeight: 700,
                          lineHeight: 1
                        }}
                      >
                        {catName}
                      </Typography>
                    </Box>
                  );
                })}
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

                    {/* Categories with multiple category badges */}
                    <Box display="flex" 
                         sx={{ 
                           flexDirection: { xs: 'row', sm: 'row' }, 
                           gap: { xs: 1, sm: 2 },
                           alignItems: { xs: 'flex-start', sm: 'flex-start' }
                         }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
                          minWidth: { xs: 'auto', sm: '120px' },
                          fontWeight: 500,
                          flexShrink: 0,
                          pt: 0.5
                        }}
                      >
                        {t('category')}:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5} sx={{ flex: 1 }}>
                        {categories.map((cat, index) => {
                          const catStyle = categoryStyles[index];
                          const catName = categoryNames[index];
                          return (
                            <Chip
                              key={cat.code || index}
                              label={catName}
                              size="small"
                              sx={{
                                fontSize: '0.75rem',
                                height: 28,
                                backgroundColor: isDarkMode ? alpha(catStyle.background, 0.3) : catStyle.background,
                                color: catStyle.text,
                                border: `1px solid ${catStyle.main}`,
                                fontWeight: 600,
                                '& .MuiChip-label': {
                                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                                  fontWeight: 600
                                }
                              }}
                            />
                          );
                        })}
                      </Box>
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
                        {(countryLabels && countryLabels[currentLanguage]) || (countryLabels && countryLabels.en) || countryname || t('noCountryProvided')}
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
                        {foundLostStatus.isFound ? t('exactDateFound') : t('exactDateLost')}:
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
        showSuccessMessage={false}
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
