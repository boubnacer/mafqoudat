import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
} from "@mui/material";
import { 
  Add, 
  EmojiEvents, 
  LocationOn, 
  CheckCircle, 
  Favorite, 
  Share 
} from "@mui/icons-material";
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import DashRecents from './DashRecents';

const SuccessStories = () => {
  const theme = useTheme();
  const [shareStoryOpen, setShareStoryOpen] = useState(false);

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

  return (
    <>
      <DashRecents 
        cate="success-stories" 
        className="success-stories" 
        sx={{ 
          mt: 4,
          mb: 4,
          mx: { xs: 1, sm: 2 },
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
          borderRadius: { xs: '8px', sm: '12px' },
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          p: { xs: 1, sm: 2 }
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
              <EmojiEvents sx={{ color: '#FFD700' }} />
              SUCCESS STORIES
            </Typography>
            <Chip 
              label={`${successStories.length} stories`}
              color="primary"
              size="small"
              sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                color: '#fff'
              }}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShareStoryOpen(true)}
            sx={{
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(255,255,255,0.2)',
              color: '#fff',
              '&:hover': {
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'rgba(255,255,255,0.3)',
              },
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'center', sm: 'flex-end' }
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
            style={{
              padding: '20px 0',
              margin: '0 -20px'
            }}
          >
            {successStories.map((story, index) => (
              <SwiperSlide key={index}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  style={{ padding: '10px' }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                        : '#ffffff',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0,0,0,0.3)'
                        : '0 4px 20px rgba(0,0,0,0.1)',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'rgba(0,0,0,0.1)',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar 
                          src={story.avatar} 
                          sx={{ 
                            width: 56, 
                            height: 56,
                            border: '2px solid',
                            borderColor: theme.palette.mode === 'dark' ? '#FFD700' : '#2196F3',
                          }} 
                        />
                        <Box ml={2}>
                          <Typography 
                            variant="h6" 
                            color={theme.palette.text.primary}
                            sx={{ fontWeight: 600 }}
                          >
                            {story.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color={theme.palette.text.secondary}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <LocationOn sx={{ fontSize: 16 }} />
                            {story.location}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography 
                        variant="body1" 
                        mb={2} 
                        color={theme.palette.text.primary}
                        sx={{ 
                          fontStyle: 'italic',
                          position: 'relative',
                          padding: '0 10px',
                          '&::before': {
                            content: '"\\201C"',
                            position: 'absolute',
                            left: -5,
                            top: -5,
                            fontSize: '2em',
                            color: theme.palette.mode === 'dark' ? '#FFD700' : '#2196F3',
                            opacity: 0.3,
                            fontFamily: 'serif'
                          },
                          '&::after': {
                            content: '"\\201D"',
                            position: 'absolute',
                            right: -5,
                            bottom: -5,
                            fontSize: '2em',
                            color: theme.palette.mode === 'dark' ? '#FFD700' : '#2196F3',
                            opacity: 0.3,
                            fontFamily: 'serif'
                          }
                        }}
                      >
                        {story.testimonial}
                      </Typography>
                      
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        mb={2}
                        sx={{
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,215,0,0.1)' 
                            : 'rgba(33,150,243,0.1)',
                          p: 1,
                          borderRadius: 1
                        }}
                      >
                        <CheckCircle 
                          sx={{ 
                            color: theme.palette.mode === 'dark' ? '#FFD700' : '#2196F3',
                            mr: 1 
                          }} 
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.mode === 'dark' ? '#FFD700' : '#2196F3',
                            fontWeight: 500
                          }}
                        >
                          Reunited in {story.timeToReunite}
                        </Typography>
                      </Box>
                      
                      <Box 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center"
                        sx={{
                          borderTop: '1px solid',
                          borderColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.1)' 
                            : 'rgba(0,0,0,0.1)',
                          pt: 2,
                          mt: 1
                        }}
                      >
                        <Chip 
                          icon={<LocationOn sx={{ 
                            color: 'inherit'
                          }} />} 
                          label={story.itemType}
                          color={theme.palette.mode === 'dark' ? 'default' : 'primary'}
                          variant="outlined"
                          sx={{
                            borderColor: theme.palette.mode === 'dark' ? '#FFD700' : '#2196F3',
                            color: theme.palette.mode === 'dark' ? '#FFD700' : '#2196F3',
                            '& .MuiChip-label': {
                              color: theme.palette.mode === 'dark' ? '#FFD700' : '#2196F3'
                            },
                            '& .MuiChip-icon': {
                              color: 'inherit'
                            },
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255,215,0,0.1)' 
                                : 'rgba(33,150,243,0.1)'
                            }
                          }}
                        />
                        <Box>
                          <IconButton 
                            size="small" 
                            sx={{ 
                              color: theme.palette.mode === 'dark' ? '#FFD700' : '#2196F3',
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,215,0,0.1)' 
                                  : 'rgba(33,150,243,0.1)'
                              }
                            }}
                          >
                            <Favorite />
                          </IconButton>
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: theme.palette.mode === 'dark' ? '#FFD700' : '#2196F3',
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,215,0,0.1)' 
                                  : 'rgba(33,150,243,0.1)'
                              }
                            }}
                          >
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
    </>
  );
};

export default SuccessStories; 