import React, { useEffect, useState, useCallback } from "react";
import { useGetDashboardQuery, useGetPostsQuery } from "../posts/postsApiSlice";
import TotalBox from "../../components/TotalBox";
import ma from "../../img/ma.jpg";
import debounce from 'lodash/debounce';

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
      <DashRecents cate="success-stories">
        <Box display="flex" alignItems="center" pt="1rem">
          <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              paddingLeft: "2rem",
            }}
          >
            SUCCESS STORIES
          </Typography>
        </Box>
        <Grid container spacing={2} p={2}>
          {[1, 2, 3].map((story) => (
            <Grid item xs={12} md={4} key={story}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h6">Item Found!</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lost item was returned to its owner
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2">
                    "Thanks to Mafqoudat, I was able to find my lost wallet within 24 hours!"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DashRecents>

      {/* Existing Road Map Section */}
      <DashRecents cate="roadmap">
        <Box display="flex" alignItems="center" pt="1rem">
          <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              paddingLeft: "2rem",
            }}
          >
            WEBSITE MAP
          </Typography>
          <Typography
            variant="welcome"
            sx={{
              fontSize: "18px",
              paddingLeft: "2rem",
              fontStyle: "italic",
              color: theme.palette.text.description,
            }}
          >
            Weclome to mafoudat
          </Typography>
        </Box>
        <RoadMap />
      </DashRecents>

      {/* Location-Based Section */}
      <DashRecents cate="location">
        <Box display="flex" alignItems="center" pt="1rem">
          <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              paddingLeft: "2rem",
            }}
          >
            LOCATION-BASED ITEMS
          </Typography>
        </Box>
        <Box p={2}>
          <Paper elevation={3} sx={{ p: 2, height: '300px' }}>
            <Typography variant="h6" gutterBottom>
              Active Areas
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip icon={<LocationOn />} label="Downtown" />
              <Chip icon={<LocationOn />} label="University Area" />
              <Chip icon={<LocationOn />} label="Shopping District" />
            </Box>
          </Paper>
        </Box>
      </DashRecents>

      {/* Existing Recent Founds Section */}
      <DashRecents cate="recents" sx={{ backgroundColor: "#1B1C1D" }}>
        <Box display="flex" alignItems="center" padding="0 0 1rem">
          <Typography
            fontWeight="500"
            sx={{
              backgroundColor: theme.palette.primary.main,
              clipPath: "polygon(0 0, 100% 0%, 95% 100%, 0% 100%)",
              padding: "0.5rem",
              width: "26%",
              borderLeft: "1px solid",
              borderColor: "#00FF00",
              fontSize: "22px",
              paddingLeft: "2rem",
            }}
          >
            RECENT FOUNDS
          </Typography>
          <SeeAll foundOrlostId={foundsId} totalItems={data?.totalFounds} />
        </Box>
        <FlexCenter>
          <Recent recent={data?.recentFounds} />
        </FlexCenter>
      </DashRecents>

      {/* Existing Recent Losts Section */}
      <DashRecents
        cate="recents"
        sx={{ borderColor: theme.palette.primary.main }}
      >
        <Box display="flex" alignItems="center" gap="1rem" padding="1rem 0">
          <Typography
            fontWeight="500"
            sx={{
              backgroundColor: theme.palette.primary.main,
              clipPath: "polygon(0 0, 100% 0%, 95% 100%, 0% 100%)",
              padding: "0.5rem",
              width: "26%",
              borderLeft: "1px solid",
              borderColor: "#FFA500",
              fontSize: "22px",
              paddingLeft: "2rem",
            }}
          >
            RECENT LOSTS
          </Typography>
          <SeeAll foundOrlostId={foundsId} totalItems={data?.totalLosts} />
        </Box>
        <FlexCenter>
          <Recent recent={data?.recentLosts} />
        </FlexCenter>
      </DashRecents>

      {/* Community Section */}
      <DashRecents cate="community">
        <Box display="flex" alignItems="center" pt="1rem">
          <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              paddingLeft: "2rem",
            }}
          >
            COMMUNITY
          </Typography>
        </Box>
        <Grid container spacing={2} p={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <People sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Users</Typography>
                </Box>
                <Typography variant="h4">1,234</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <EmojiEvents sx={{ mr: 1 }} />
                  <Typography variant="h6">Top Helpers</Typography>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip label="John D." />
                  <Chip label="Sarah M." />
                  <Chip label="Mike R." />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Notifications sx={{ mr: 1 }} />
                  <Typography variant="h6">Recent Activity</Typography>
                </Box>
                <Typography variant="body2">
                  • 5 new items reported
                  <br />
                  • 3 successful matches
                  <br />
                  • 2 new users joined
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DashRecents>

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
      <DashRecents cate="help">
        <Box display="flex" alignItems="center" pt="1rem">
          <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              paddingLeft: "2rem",
            }}
          >
            HELP & SUPPORT
          </Typography>
        </Box>
        <Grid container spacing={2} p={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Help sx={{ mr: 1 }} />
                  <Typography variant="h6">FAQ</Typography>
                </Box>
                <Typography variant="body2">
                  • How to report a lost item?
                  <br />
                  • How to claim a found item?
                  <br />
                  • What information do I need?
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Typography variant="h6">Emergency Contacts</Typography>
                </Box>
                <Typography variant="body2">
                  • Police: 911
                  <br />
                  • Support: 24/7
                  <br />
                  • Email: support@mafqoudat.com
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Typography variant="h6">Guidelines</Typography>
                </Box>
                <Typography variant="body2">
                  • Be honest in your reports
                  <br />
                  • Provide clear descriptions
                  <br />
                  • Keep communication safe
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DashRecents>

      {/* Existing Process Section */}
      <DashRecents>
        <Process />
      </DashRecents>
    </Box>
  );
};

export default Dash;
