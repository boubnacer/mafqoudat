import React, { useEffect, useState, useCallback } from "react";
import { useGetDashboardQuery, useGetPostsQuery } from "../posts/postsApiSlice";
import TotalBox from "../../components/TotalBox";
import ma from "../../img/ma.jpg";
import debounce from 'lodash/debounce';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import "./dash.css";
import useAuth from "../../hooks/useAuth";
import {
  Box,
  Button,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  TextField,
  InputAdornment,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Tooltip,
  Badge,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import LeftSide from "../../components/dashboard/LeftSide";
import FlexCenter from "../../components/FlexCenter";
import TrendingItem from "../../components/dashboard/TrendingItem";
import Geography from "../geography";
import DashRecents from "../../components/dashboard/DashRecents";
import {
  selectCurrentCountry,
  setActiveLink,
  setFoundOrLost,
} from "../../app/state";
import { 
  Add, 
  Send, 
  WhatshotOutlined, 
  Search, 
  LocationOn, 
  Notifications, 
  Help, 
  People, 
  EmojiEvents,
  FilterList,
  ExpandMore,
  CheckCircle,
  Share,
  Favorite,
  Comment,
  Map,
  Timeline,
  School,
  Work,
  Home,
  DirectionsWalk,
  DirectionsCar,
  Phone,
  Email,
  Chat,
  VideoLibrary,
  Forum,
  Book,
  Lightbulb,
  Security,
  Speed,
  TrendingUp,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Categories from "../../components/dashboard/Categories";

import Recent from "../../components/dashboard/Recent";
import SeeAll from "../../components/dashboard/SeeAll";
import FlexBetween from "../../components/FlexBetween";
import PulseLoader from "react-spinners/PulseLoader";

import Skeleton from "@mui/material/Skeleton";
import RoadMap from "../../components/dashboard/RoadMap";
import Process from "../../components/dashboard/Process";

const lostsId = "63cc3484bc901245d3a1cb5a";
const foundsId = "66e60c25420ca2a42499b924";

const Dash = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [shareStoryOpen, setShareStoryOpen] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [helpTab, setHelpTab] = useState(0);

  const currentCountry = useSelector(selectCurrentCountry);
  

  

  // currentCountry && localStorage.setItem("country", currentCountry);
  // const storedCountry = localStorage.getItem("country");

  const isNonMediumScreens = useMediaQuery("(min-width:1200px)");

  const theme = useTheme();

  const { data, isError, error, isLoading } = useGetDashboardQuery({
    currentCountry,
  });

  const trend = data?.trendingPost;
  const createdtoday = data?.createdToday;

  const { data: searchData, isLoading: isSearchLoading } = useGetPostsQuery({
    page: 1,
    pageSize: 10,
    currentCountry,
    search: searchQuery
  }, {
    skip: !searchQuery
  });

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      if (query.trim()) {
        setIsSearching(true);
      } else {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Update search query and trigger debounced search
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleCreateNewPost = (type) => {
    navigate(`/dash/posts/new?type=${type}`);
  };

  const hanldeSeeAllPosts = ({ foundOrlostId }) => {
    navigate("/dash/posts");
    dispatch(
      setFoundOrLost({
        foundOrlost: foundOrlostId,
      })
    );
    dispatch(setActiveLink({ active: foundOrlostId }));
  };

  const hanldeAddNewPost = () => navigate("/dash/posts/new");

  if (isError) console.log(data?.error?.message);

  if (!data) return <PulseLoader color={"#FFF"} />;

  if (!currentCountry) return <PulseLoader color={"#FFF"}/>

  const successStories = [
    {
      name: "Sarah Johnson",
      location: "New York, USA",
      testimonial: "Thanks to Mafqoudat, I was able to find my lost wallet within 24 hours! The community was incredibly helpful.",
      timeToReunite: "24 hours",
      itemType: "Wallet",
      avatar: "https://i.pravatar.cc/150?img=1"
    },
    {
      name: "Mohammed Ali",
      location: "Dubai, UAE",
      testimonial: "My laptop was returned to me within 48 hours. The platform made it so easy to connect with the finder.",
      timeToReunite: "48 hours",
      itemType: "Laptop",
      avatar: "https://i.pravatar.cc/150?img=2"
    },
    {
      name: "Emma Wilson",
      location: "London, UK",
      testimonial: "Lost my phone at the train station, and thanks to Mafqoudat, I got it back the same day!",
      timeToReunite: "12 hours",
      itemType: "Phone",
      avatar: "https://i.pravatar.cc/150?img=3"
    },
    {
      name: "Carlos Rodriguez",
      location: "Madrid, Spain",
      testimonial: "My passport was found and returned to me within 36 hours. This platform is a lifesaver!",
      timeToReunite: "36 hours",
      itemType: "Passport",
      avatar: "https://i.pravatar.cc/150?img=4"
    }
  ];

  const topHelpers = [
    {
      name: "John D.",
      avatar: "https://i.pravatar.cc/150?img=1",
      helpCount: 15,
    },
    {
      name: "Sarah M.",
      avatar: "https://i.pravatar.cc/150?img=2",
      helpCount: 12,
    },
    {
      name: "Mike R.",
      avatar: "https://i.pravatar.cc/150?img=3",
      helpCount: 10,
    },
  ];

  const recentActivities = [
    {
      title: "New Item Reported",
      time: "2 hours ago",
      icon: <Add />,
      badge: "5",
      badgeColor: "error",
    },
    {
      title: "Match Found",
      time: "4 hours ago",
      icon: <CheckCircle />,
      badge: "3",
      badgeColor: "success",
    },
  ];

  const faqItems = [
    {
      question: "How to report a lost item?",
      answer: "To report a lost item, go to the 'Report Lost Item' section on the dashboard and follow the instructions. You'll need to provide details about the item, its location, and any relevant information."
    },
    {
      question: "How to claim a found item?",
      answer: "To claim a found item, go to the 'Report Found Item' section on the dashboard and follow the instructions. You'll need to provide details about the item and its location."
    },
    {
      question: "What information do I need?",
      answer: "When reporting a lost or found item, you'll need to provide details about the item, its location, and any relevant information. This helps us match you with the right finder or lost item."
    }
  ];

  const emergencyContacts = [
    {
      name: "Police",
      details: "911",
      icon: <Phone />,
      action: "Call",
      actionIcon: <Send />
    },
    {
      name: "Support",
      details: "24/7",
      icon: <Phone />,
      action: "Call",
      actionIcon: <Send />
    },
    {
      name: "Email",
      details: "support@mafqoudat.com",
      icon: <Email />,
      action: "Email",
      actionIcon: <Send />
    }
  ];

  const guidelines = [
    {
      title: "Be honest in your reports",
      description: "Always provide accurate and truthful information about your lost or found item."
    },
    {
      title: "Provide clear descriptions",
      description: "Use clear and detailed descriptions in your reports to help others identify the item."
    },
    {
      title: "Keep communication safe",
      description: "Use safe and appropriate communication methods when interacting with others on the platform."
    }
  ];

  const videoTutorials = [
    {
      title: "How to Report a Lost Item",
      description: "Learn how to effectively report a lost item on Mafqoudat.",
      thumbnail: "https://example.com/thumbnail1.jpg"
    },
    {
      title: "How to Claim a Found Item",
      description: "Discover the steps to successfully claim a found item on Mafqoudat.",
      thumbnail: "https://example.com/thumbnail2.jpg"
    },
    {
      title: "Using Mafqoudat Safely",
      description: "Get tips on how to use Mafqoudat safely and effectively.",
      thumbnail: "https://example.com/thumbnail3.jpg"
    }
  ];

  return (
    <Box 
      pt={{ xs: "6.5rem", sm: "7rem" }} 
      width="100%"
      sx={{
        transition: 'padding 0.3s ease',
      }}
    >
      {/* Search and Filter Section */}
      <Box m="0 1rem" mb="2rem">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            display: 'flex', 
            gap: 2, 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center'
          }}
        >
          <TextField
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by region, contact, or category..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            startIcon={<FilterList />}
            sx={{ minWidth: '120px' }}
          >
            Filters
          </Button>
        </Paper>
      </Box>

      {/* Search Results Section */}
      {isSearching && (
        <Box m="0 1rem" mb="2rem">
          {isSearchLoading ? (
            <PulseLoader color={"#FFF"} />
          ) : searchData?.postsWithUser?.length > 0 ? (
            <Box>
              <Typography variant="h6" mb={2}>Search Results</Typography>
              <Grid container spacing={2}>
                {searchData.postsWithUser.map((post) => (
                  <Grid item xs={12} sm={6} md={4} key={post._id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { transform: 'scale(1.02)' },
                        transition: 'transform 0.2s'
                      }}
                      onClick={() => navigate(`/dash/posts/${post._id}`)}
                    >
                      <CardMedia
                        sx={{ height: 150 }}
                        image={post.image ? `http://localhost:3500/${post.image}` : ma}
                        title={post.image}
                      />
                      <CardContent>
                        <Typography variant="h6">{post.categoryname}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {post.region}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {post.foundLost}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" mb={2}>No items found</Typography>
              <Typography variant="body1" mb={3}>
                Would you like to create a new post for this item?
              </Typography>
              <Box display="flex" gap={2} justifyContent="center">
                <Button 
                  variant="contained" 
                  onClick={() => handleCreateNewPost('lost')}
                >
                  Report Lost Item
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => handleCreateNewPost('found')}
                >
                  Report Found Item
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Quick Actions Section */}
      <Box m="0 1rem" mb="2rem">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'scale(1.02)' },
                transition: 'transform 0.2s'
              }}
              onClick={() => navigate('/dash/posts/new?type=lost')}
            >
              <CardContent>
                <Typography variant="h6">Report Lost Item</Typography>
                <Typography variant="body2" color="text.secondary">
                  Can't find something? Report it here
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'scale(1.02)' },
                transition: 'transform 0.2s'
              }}
              onClick={() => navigate('/dash/posts/new?type=found')}
            >
              <CardContent>
                <Typography variant="h6">Report Found Item</Typography>
                <Typography variant="body2" color="text.secondary">
                  Found something? Help return it
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'scale(1.02)' },
                transition: 'transform 0.2s'
              }}
              onClick={() => navigate('/dash/search')}
            >
              <CardContent>
                <Typography variant="h6">Search Items</Typography>
                <Typography variant="body2" color="text.secondary">
                  Look for lost or found items
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'scale(1.02)' },
                transition: 'transform 0.2s'
              }}
              onClick={() => navigate('/dash/help')}
            >
              <CardContent>
                <Typography variant="h6">Get Help</Typography>
                <Typography variant="body2" color="text.secondary">
                  Need assistance? We're here to help
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Existing Header Section */}
      <Box
        m="0 1rem"
        gap="20px"
        sx={{
          display: { xs: "grid", sm: "flex" },
          gridTemplateColumns: { xs: "repeat(1,1fr)", sm: "repeat(2,1fr)" },
        }}
      >
        <LeftSide
          totalFounds={data?.totalFounds}
          totalLosts={data?.totalLosts}
          totalPosts={data?.totalPosts}
          foundsToday={data?.createdToday.todaysFoundPosts}
          lostsToday={data?.createdToday.todaysLostPosts}
        />
        {isLoading ? (
          <Skeleton variant="rounded" width={210} height={60} />
        ) : (
          <TrendingItem trend={trend} isLoading={isLoading} />
        )}
      </Box>

      {/* Success Stories Section */}
      <DashRecents cate="success-stories" sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" pt="1rem" px={2}>
          <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SUCCESS STORIES
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShareStoryOpen(true)}
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
            }}
          >
            Share Your Story
          </Button>
        </Box>
        
        <Box p={2}>
          <Swiper
            modules={[Pagination, Navigation, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {successStories.map((story, index) => (
              <SwiperSlide key={index}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                        : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0,0,0,0.3)'
                        : '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar 
                          src={story.avatar} 
                          sx={{ 
                            width: 56, 
                            height: 56,
                            border: '2px solid #2196F3',
                          }} 
                        />
                        <Box ml={2}>
                          <Typography variant="h6" color={theme.palette.text.primary}>{story.name}</Typography>
                          <Typography variant="body2" color={theme.palette.text.secondary}>
                            {story.location}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body1" mb={2} color={theme.palette.text.primary}>
                        "{story.testimonial}"
                      </Typography>
                      
                      <Box display="flex" alignItems="center" mb={2}>
                        <CheckCircle color="success" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="success.main">
                          Reunited in {story.timeToReunite}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip 
                          icon={<LocationOn />} 
                          label={story.itemType}
                          color="primary"
                          variant="outlined"
                        />
                        <Box>
                          <IconButton size="small" color={theme.palette.mode === 'dark' ? 'default' : 'primary'}>
                            <Favorite />
                          </IconButton>
                          <IconButton size="small" color={theme.palette.mode === 'dark' ? 'default' : 'primary'}>
                            <Share />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      </DashRecents>

      {/* Success Story Dialog */}
      <Dialog 
        open={shareStoryOpen} 
        onClose={() => setShareStoryOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Share Your Success Story
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Your Name"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Location"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Item Type"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Your Story"
              multiline
              rows={4}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Time to Reunite"
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareStoryOpen(false)}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={() => setShareStoryOpen(false)}
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
            }}
          >
            Share Story
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Recent Founds Section */}
      <DashRecents 
        cate="recents" 
        sx={{ 
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
          borderRadius: { xs: '8px', sm: '12px' },
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          mb: 4,
          mx: { xs: 1, sm: 2 }
        }}
      >
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between" 
          p={{ xs: "1rem", sm: "1.5rem" }}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, #1a1a1a 30%, #2d2d2d 90%)'
              : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}
        >
          <Box display="flex" alignItems="center" gap={2} width={{ xs: '100%', sm: 'auto' }}>
            <Typography
              fontWeight="600"
              sx={{
                fontSize: { xs: "20px", sm: "24px" },
                color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <WhatshotOutlined sx={{ color: '#FFA500' }} />
              RECENT FOUNDS
            </Typography>
            <Chip 
              label={`${data?.totalFounds || 0} items`}
              color="primary"
              size="small"
              sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                color: '#fff'
              }}
            />
          </Box>
          <SeeAll 
            foundOrlostId={foundsId} 
            totalItems={data?.totalFounds}
            sx={{
              color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'
              },
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'center', sm: 'flex-end' }
            }}
          />
        </Box>
        <Box p={{ xs: 1, sm: 2 }}>
          <FlexCenter>
            <Recent 
              recent={data?.recentFounds} 
              sx={{
                '& .MuiCard-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#fff',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 24px rgba(0,0,0,0.4)'
                      : '0 8px 24px rgba(0,0,0,0.1)'
                  },
                  height: { xs: 'auto', sm: '100%' },
                  display: 'flex',
                  flexDirection: 'column'
                },
                '& .MuiCardMedia-root': {
                  height: { xs: '140px', sm: '200px' },
                  objectFit: 'cover'
                },
                '& .MuiCardContent-root': {
                  flexGrow: 1,
                  p: { xs: 1.5, sm: 2 }
                },
                '& .MuiTypography-h6': {
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  mb: { xs: 0.5, sm: 1 }
                },
                '& .MuiTypography-body2': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
          </FlexCenter>
        </Box>
      </DashRecents>

      {/* Enhanced Recent Losts Section */}
      <DashRecents
        cate="recents"
        sx={{ 
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
          borderRadius: { xs: '8px', sm: '12px' },
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          mb: 4,
          mx: { xs: 1, sm: 2 }
        }}
      >
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between" 
          p={{ xs: "1rem", sm: "1.5rem" }}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, #1a1a1a 30%, #2d2d2d 90%)'
              : 'linear-gradient(45deg, #FFA500 30%, #FFD700 90%)',
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}
        >
          <Box display="flex" alignItems="center" gap={2} width={{ xs: '100%', sm: 'auto' }}>
            <Typography
              fontWeight="600"
              sx={{
                fontSize: { xs: "20px", sm: "24px" },
                color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Search sx={{ color: '#fff' }} />
              RECENT LOSTS
            </Typography>
            <Chip 
              label={`${data?.totalLosts || 0} items`}
              color="warning"
              size="small"
              sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                color: '#fff'
              }}
            />
          </Box>
          <SeeAll 
            foundOrlostId={lostsId} 
            totalItems={data?.totalLosts}
            sx={{
              color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'
              },
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'center', sm: 'flex-end' }
            }}
          />
        </Box>
        <Box p={{ xs: 1, sm: 2 }}>
          <FlexCenter>
            <Recent 
              recent={data?.recentLosts}
              sx={{
                '& .MuiCard-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#fff',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 24px rgba(0,0,0,0.4)'
                      : '0 8px 24px rgba(0,0,0,0.1)'
                  },
                  height: { xs: 'auto', sm: '100%' },
                  display: 'flex',
                  flexDirection: 'column'
                },
                '& .MuiCardMedia-root': {
                  height: { xs: '140px', sm: '200px' },
                  objectFit: 'cover'
                },
                '& .MuiCardContent-root': {
                  flexGrow: 1,
                  p: { xs: 1.5, sm: 2 }
                },
                '& .MuiTypography-h6': {
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  mb: { xs: 0.5, sm: 1 }
                },
                '& .MuiTypography-body2': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
          </FlexCenter>
        </Box>
      </DashRecents>

      {/* Community Section */}
      <DashRecents cate="community" sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" pt="1rem" px={2}>
          <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            COMMUNITY
          </Typography>
          <Button
            variant="contained"
            startIcon={<People />}
            onClick={() => setShowCommunityDialog(true)}
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
            }}
          >
            Join Community
          </Button>
        </Box>

        <Box p={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.3)'
                    : '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <People sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color={theme.palette.text.primary}>Active Users</Typography>
                  </Box>
                  <Typography variant="h4" color="primary.main" gutterBottom>
                    1,234
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color={theme.palette.text.secondary}>
                      New users this week
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={70} 
                      sx={{ height: 8, borderRadius: 4, mt: 1 }}
                    />
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><People color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Active Now"
                        secondary="156 users"
                        primaryTypographyProps={{ color: theme.palette.text.primary }}
                        secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><People color="info" /></ListItemIcon>
                      <ListItemText 
                        primary="New This Week"
                        secondary="89 users"
                        primaryTypographyProps={{ color: theme.palette.text.primary }}
                        secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.3)'
                    : '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <EmojiEvents sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="h6" color={theme.palette.text.primary}>Top Helpers</Typography>
                  </Box>
                  <List>
                    {topHelpers.map((helper, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Avatar src={helper.avatar} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={helper.name}
                          secondary={`${helper.helpCount} items helped`}
                          primaryTypographyProps={{ color: theme.palette.text.primary }}
                          secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                        />
                        <Chip 
                          label={`#${index + 1}`}
                          color={index === 0 ? 'warning' : 'default'}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EmojiEvents />}
                    sx={{ mt: 2 }}
                  >
                    View Leaderboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.3)'
                    : '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Notifications sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="h6" color={theme.palette.text.primary}>Recent Activity</Typography>
                  </Box>
                  <List>
                    {recentActivities.map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {activity.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={activity.title}
                          secondary={activity.time}
                          primaryTypographyProps={{ color: theme.palette.text.primary }}
                          secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                        />
                        {activity.badge && (
                          <Chip 
                            label={activity.badge}
                            color={activity.badgeColor}
                            size="small"
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Notifications />}
                    sx={{ mt: 2 }}
                  >
                    View All Activity
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DashRecents>

      {/* Community Dialog */}
      <Dialog
        open={showCommunityDialog}
        onClose={() => setShowCommunityDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Join Our Community
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Be part of our growing community of helpers and make a difference in your area.
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Connect with local helpers"
                  secondary="Find and connect with people in your area"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Earn recognition"
                  secondary="Get recognized for your contributions"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Make a difference"
                  secondary="Help others and build a better community"
                />
              </ListItem>
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCommunityDialog(false)}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={() => setShowCommunityDialog(false)}
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
            }}
          >
            Join Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Existing Categories Section */}
      <DashRecents cate="cate" sx={{ borderColor: theme.palette.primary.main }}>
        <Typography
          fontWeight="600"
          sx={{
            fontSize: "26px",
            p: "2rem 0",
          }}
        >
          CAETGORIES
        </Typography>

        <Categories />
      </DashRecents>

      {/* Help & Support Section */}
      <DashRecents cate="help" sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" pt="1rem" px={2}>
          <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            HELP & SUPPORT
          </Typography>
          <Button
            variant="contained"
            startIcon={<Help />}
            onClick={() => setShowHelpDialog(true)}
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
            }}
          >
            Get Help
          </Button>
        </Box>

        <Box p={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.3)'
                    : '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Help sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color={theme.palette.text.primary}>FAQ</Typography>
                  </Box>
                  <List>
                    {faqItems.map((item, index) => (
                      <Accordion 
                        key={index} 
                        sx={{ 
                          mb: 1, 
                          boxShadow: 'none',
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          sx={{
                            borderRadius: '4px',
                          }}
                        >
                          <Typography variant="subtitle1" color={theme.palette.text.primary}>{item.question}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" color={theme.palette.text.secondary}>
                            {item.answer}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </List>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Help />}
                    sx={{ mt: 2 }}
                  >
                    View All FAQs
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.3)'
                    : '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Phone sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="h6" color={theme.palette.text.primary}>Emergency Contacts</Typography>
                  </Box>
                  <List>
                    {emergencyContacts.map((contact, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {contact.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={contact.name}
                          secondary={contact.details}
                          primaryTypographyProps={{ color: theme.palette.text.primary }}
                          secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={contact.actionIcon}
                        >
                          {contact.action}
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="error.contrastText">
                      For immediate assistance, please contact emergency services.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.3)'
                    : '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Security sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6" color={theme.palette.text.primary}>Guidelines</Typography>
                  </Box>
                  <List>
                    {guidelines.map((guideline, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={guideline.title}
                          secondary={guideline.description}
                          primaryTypographyProps={{ color: theme.palette.text.primary }}
                          secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color={theme.palette.text.primary}>
                      Community Guidelines
                    </Typography>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Book />}
                      sx={{ mb: 1 }}
                    >
                      Read Guidelines
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Security />}
                    >
                      Safety Tips
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DashRecents>

      {/* Help Dialog */}
      <Dialog
        open={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          How Can We Help You?
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs value={helpTab} onChange={(e, newValue) => setHelpTab(newValue)}>
              <Tab label="Contact Support" />
              <Tab label="Live Chat" />
              <Tab label="Video Tutorials" />
            </Tabs>
            
            <Box sx={{ mt: 2 }}>
              {helpTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Contact Our Support Team
                  </Typography>
                  <TextField
                    fullWidth
                    label="Subject"
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={4}
                    margin="normal"
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Send Message
                  </Button>
                </Box>
              )}
              
              {helpTab === 1 && (
                <Box textAlign="center" py={4}>
                  <Chat sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Live Chat Coming Soon
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Our live chat feature is currently under development.
                    Please use the contact form for now.
                  </Typography>
                </Box>
              )}
              
              {helpTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Video Tutorials
                  </Typography>
                  <Grid container spacing={2}>
                    {videoTutorials.map((tutorial, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="140"
                            image={tutorial.thumbnail}
                            alt={tutorial.title}
                          />
                          <CardContent>
                            <Typography variant="h6">{tutorial.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {tutorial.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelpDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Existing Process Section */}
      <DashRecents>
        <Process />
      </DashRecents>
    </Box>
  );
};

export default Dash;
