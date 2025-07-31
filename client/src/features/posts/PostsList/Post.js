import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { useGetPostsQuery } from "../postsApiSlice";
import { memo } from "react";
import "./postslist.css";
import ma from "../../../img/ma.jpg";
import useAuth from "../../../hooks/useAuth";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
  useTheme,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  useMediaQuery,
  Paper
} from "@mui/material";
import {
  LocationOnOutlined,
  KeyboardArrowRightOutlined,
  ReportProblemOutlined,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon,
  ContactPhone as ContactIcon
} from "@mui/icons-material";
import FlexBetween from "../../../components/FlexBetween";

const Post = ({ post, viewMode = "grid" }) => {
  const { usernameId, foundLost } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const navigate = useNavigate();

  if (post) {
    const created = new Date(post.createdAt).toLocaleString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const updated = new Date(post.updatedAt).toLocaleString("en-US", {
      day: "numeric",
      month: "long",
    });

    const handleEdit = () => navigate(`/dash/posts/${post._id}`);
    const handleReport = () => navigate(`/dash/posts/report/${post._id}`);

    // Enhanced Found/Lost detection with multilingual support
    let foundLostValue = "Found"; // Default to Found
    let foundLostLabel = "Found"; // Default label
    
    // Check multiple possible properties and structures
    if (post.foundLost) {
      if (typeof post.foundLost === 'string') {
        foundLostValue = post.foundLost;
        foundLostLabel = post.foundLost;
      } else if (post.foundLost.code) {
        foundLostValue = post.foundLost.code;
        // Use multilingual label if available
        foundLostLabel = post.foundLostLabel || post.foundLost.labels?.en || post.foundLost.code;
      } else if (post.foundLost._id) {
        // If it's an ObjectId, we need to check the actual value
        foundLostValue = "Found"; // Default for ObjectId
        foundLostLabel = "Found";
      }
    }
    
    // Also check Floptions array if it exists
    if (post.Floptions && post.Floptions.length > 0) {
      const flOption = post.Floptions[0];
      if (typeof flOption === 'string') {
        foundLostValue = flOption;
        foundLostLabel = flOption;
      } else if (flOption.code) {
        foundLostValue = flOption.code;
        foundLostLabel = flOption.labels?.en || flOption.code;
      }
    }

    // Normalize the value
    const isFound = foundLostValue.toLowerCase() === "found";
    const statusColor = isFound ? theme.palette.success.main : theme.palette.error.main;
    const statusText = foundLostLabel;

    // Get category name safely
    const categoryName = post.categoryname || post.category?.code || "Unknown Category";

    // List view layout
    if (viewMode === "list") {
      return (
        <Paper 
          elevation={2} 
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8]
            }
          }}
        >
          <Box display="flex" sx={{ height: 200 }}>
            {/* Image Section */}
            <Box sx={{ width: 200, flexShrink: 0 }}>
              <CardMedia
                component="img"
                sx={{ 
                  height: '100%',
                  objectFit: 'cover'
                }}
                image={post.image ? `http://localhost:3500/${post.image}` : ma}
                title={post.image}
              />
            </Box>

            {/* Content Section */}
            <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                    {post.region || "Unknown Region"}
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center" mb={1}>
                    <Chip 
                      label={statusText}
                      color={isFound ? "success" : "error"}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip 
                      label={categoryName}
                      variant="outlined"
                      size="small"
                      icon={<CategoryIcon />}
                    />
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  <Tooltip title="View Details">
                    <IconButton 
                      onClick={handleEdit}
                      size="small"
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:hover': { backgroundColor: theme.palette.primary.light + '20' }
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Report Post">
                    <IconButton 
                      onClick={handleReport}
                      size="small"
                      sx={{ 
                        color: theme.palette.error.main,
                        '&:hover': { backgroundColor: theme.palette.error.light + '20' }
                      }}
                    >
                      <ReportProblemOutlined />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box display="flex" gap={3} mb={2} flexWrap="wrap">
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {post.username || "Unknown User"}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {created}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationOnOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {post.countryname || "Unknown Country"}
                  </Typography>
                </Box>
                {post.contact && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <ContactIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {post.contact}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  endIcon={<KeyboardArrowRightOutlined />}
                  onClick={handleEdit}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  View Details
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      );
    }

    // Grid view layout (default)
    return (
      <Card 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8]
          }
        }}
      >
        {/* Image */}
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            sx={{ 
              height: 200,
              objectFit: 'cover'
            }}
            image={post.image ? `http://localhost:3500/${post.image}` : ma}
            title={post.image}
          />
          
          {/* Status Badge */}
          <Chip 
            label={statusText}
            color={isFound ? "success" : "error"}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontWeight: 600,
              backgroundColor: isFound ? theme.palette.success.main : theme.palette.error.main,
              color: 'white'
            }}
          />

          {/* Category Badge */}
          <Chip 
            label={categoryName}
            variant="outlined"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(255,255,255,0.9)',
              fontWeight: 600
            }}
          />
        </Box>

        {/* Content */}
        <CardContent sx={{ flex: 1, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography 
              variant="h6" 
              fontWeight={600}
              sx={{ 
                color: theme.palette.textColor.main,
                lineHeight: 1.2
              }}
            >
              {post.region || "Unknown Region"}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {post.username || "Unknown User"}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {created}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <LocationOnOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {post.countryname || "Unknown Country"}
              </Typography>
            </Box>

            {post.contact && (
              <Box display="flex" alignItems="center" gap={1}>
                <ContactIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {post.contact}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>

        {/* Actions */}
        <CardActions 
          sx={{
            p: 3,
            pt: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<ReportProblemOutlined />}
            onClick={handleReport}
            sx={{
              borderRadius: 2,
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
            Report
          </Button>
          
          <Button
            variant="contained"
            size="small"
            endIcon={<KeyboardArrowRightOutlined />}
            onClick={handleEdit}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 2
            }}
          >
            View
          </Button>
        </CardActions>
      </Card>
    );
  } else return null;
};

const memoizedPost = memo(Post);

export default memoizedPost;
