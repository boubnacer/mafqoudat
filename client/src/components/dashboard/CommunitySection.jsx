import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Grid,
} from "@mui/material";
import { 
  People, 
  EmojiEvents, 
  Notifications, 
  CheckCircle 
} from "@mui/icons-material";
import DashRecents from './DashRecents';

const CommunitySection = () => {
  const theme = useTheme();
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);

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
      icon: <CheckCircle />,
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

  return (
    <>
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
    </>
  );
};

export default CommunitySection; 