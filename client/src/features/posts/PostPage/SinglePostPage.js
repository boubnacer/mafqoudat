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
  useMediaQuery
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import sear from "../../../img/sear.svg";
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
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";

import "./editpost.css";
import { useTranslation } from "../../../utils/translations";
import { isRTL, getLabel } from "../../../utils/languageUtils";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

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
  additionalContact
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const { usernameId } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = isRTL();

  const canEdit = user === usernameId;

  const handleEdit = () => navigate(`/dash/posts/edit/${_id}`);
  const handleReport = () => navigate(`/dash/posts/report/${_id}`);
  const handleBack = () => navigate(-1);

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
                             <Chip 
                 label={t(categoryname?.toLowerCase()) || categoryname}
                 variant="outlined"
                 icon={<CategoryIcon />}
                 sx={{
                   position: 'absolute',
                   top: 16,
                   right: 16,
                   backgroundColor: 'rgba(255,255,255,0.95)',
                   fontWeight: 600,
                   fontSize: '0.9rem'
                 }}
               />
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
                    {t(categoryname?.toLowerCase()) || categoryname}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: theme.palette.textColor.secondary,
                      fontWeight: 500,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    {exactLocation || region || t('unknownLocation')}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={1} sx={{ direction: isRTLMode ? 'rtl' : 'ltr', flexWrap: 'wrap' }}>
                  <Tooltip title={t('sharePost')}>
                    <IconButton
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:hover': { backgroundColor: theme.palette.primary.light + '20' }
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
                          '&:hover': { backgroundColor: theme.palette.info.light + '20' }
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
                        '&:hover': { backgroundColor: theme.palette.error.light + '20' }
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
                      <PersonIcon sx={{ color: theme.palette.textColor.secondary }} />
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
                      <LocationIcon sx={{ color: theme.palette.textColor.secondary }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('exactLocation')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                          {exactLocation || region || t('unknownLocation')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <LocationIcon sx={{ color: theme.palette.textColor.secondary }} />
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
                      <CalendarIcon sx={{ color: theme.palette.textColor.secondary }} />
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
                        <CalendarIcon sx={{ color: theme.palette.textColor.secondary }} />
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

            {/* Additional Insights */}
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
                  <VisibilityIcon sx={{ color: theme.palette.info.main }} />
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
                  <CategoryIcon sx={{ color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('category')}
                    </Typography>
                                         <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                       {t(categoryname?.toLowerCase()) || categoryname}
                     </Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <LocationIcon sx={{ color: theme.palette.success.main }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('exactLocation')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                      {exactLocation || region || t('unknownLocation')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SinglePostPage;
