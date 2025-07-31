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

const SinglePostPage = ({
  _id,
  categoryname,
  region,
  contact,
  user,
  image,
  username,
  createdAt,
  updatedAt,
  countryname,
  foundLost,
  Floptions
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const { usernameId } = useAuth();

  const canEdit = user === usernameId;

  const handleEdit = () => navigate(`/dash/posts/edit/${_id}`);
  const handleReport = () => navigate(`/dash/posts/report/${_id}`);
  const handleBack = () => navigate(-1);

  // Format dates
  const createdDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const updatedDate = new Date(updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

    // Determine Found/Lost status with multilingual support
  let foundLostValue = "Found";
  let foundLostLabel = "Found";
  
  if (foundLost) {
    if (typeof foundLost === 'string') {
      foundLostValue = foundLost;
      foundLostLabel = foundLost;
    } else if (foundLost.code) {
      foundLostValue = foundLost.code;
      foundLostLabel = foundLost.labels?.en || foundLost.code;
    }
  }

  if (Floptions && Floptions.length > 0) {
    const flOption = Floptions[0];
    if (typeof flOption === 'string') {
      foundLostValue = flOption;
      foundLostLabel = flOption;
    } else if (flOption.code) {
      foundLostValue = flOption.code;
      foundLostLabel = flOption.labels?.en || flOption.code;
    }
  }

  const isFound = foundLostValue.toLowerCase() === "found";
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
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            color: theme.palette.textColor.secondary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          Back to Posts
        </Button>
      </Box>

      <Grid container spacing={4}>
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
                  height: { xs: 300, md: 400 },
                  width: '100%',
                  objectFit: 'cover'
                }}
                image={image ? `http://localhost:3500/${image}` : sear}
                title={categoryname}
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
                label={categoryname}
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
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              {/* Header */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      color: theme.palette.textColor.main,
                      fontWeight: 700,
                      mb: 1
                    }}
                  >
                    {categoryname}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: theme.palette.textColor.secondary,
                      fontWeight: 500
                    }}
                  >
                    {region}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={1}>
                  <Tooltip title="Share Post">
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
                    <Tooltip title="Edit Post">
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
                  
                  <Tooltip title="Report Post">
                    <IconButton
                      onClick={handleReport}
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
                    Contact Information
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
                  Post Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <PersonIcon sx={{ color: theme.palette.textColor.secondary }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Posted by
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
                          Location
                        </Typography>
                        <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                          {countryname || "Unknown Country"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <CalendarIcon sx={{ color: theme.palette.textColor.secondary }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Created
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
                            Last Updated
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
          <Box sx={{ position: 'sticky', top: '2rem' }}>
            {/* Quick Actions */}
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
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
                Quick Actions
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
                    Edit Post
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
                  Share Post
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
                  Report Post
                </Button>
              </Box>
            </Paper>

            {/* Additional Insights */}
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
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
                Additional Insights
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <VisibilityIcon sx={{ color: theme.palette.info.main }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Post Status
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
                      Category
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                      {categoryname}
                    </Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <LocationIcon sx={{ color: theme.palette.success.main }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Region
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.textColor.main }}>
                      {region}
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
