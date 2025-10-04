import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../utils/translations";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../features/auth/authSlice";
import { isRTL } from "../../utils/languageUtils";
import { authStorage } from "../../utils/authStorage";
import {
  AddCircleOutline,
  Search,
  HelpOutline,
  FindInPage
} from "@mui/icons-material";

const QuickActions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useSelector(selectCurrentToken);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTLMode = isRTL();

  // Touch handling state
  const [touchStart, setTouchStart] = React.useState(null);
  const [touchMoved, setTouchMoved] = React.useState(false);

  // Touch event handlers
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    });
    setTouchMoved(false);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // If touch moved more than 10px, consider it a scroll
    if (deltaX > 10 || deltaY > 10) {
      setTouchMoved(true);
    }
  };

  const handleTouchEnd = (e, action) => {
    if (!touchStart) return;
    
    const touchDuration = Date.now() - touchStart.time;
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStart.x);
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStart.y);
    
    // Only trigger action if:
    // 1. Touch didn't move much (less than 10px)
    // 2. Touch duration is reasonable (less than 500ms)
    // 3. Not a scroll gesture
    if (!touchMoved && deltaX < 10 && deltaY < 10 && touchDuration < 500) {
      action();
    }
    
    // Reset touch state
    setTouchStart(null);
    setTouchMoved(false);
  };

  const scrollToHelpSection = () => {
    
    const helpSection = document.querySelector('[data-section="help"]');
    
    if (helpSection) {
      if (isMobile) {
        // Mobile-specific scrolling with manual calculation
        const navbar = document.querySelector('.MuiAppBar-root');
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        
        // Get the element's position relative to the document
        const elementRect = helpSection.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        
        // Calculate scroll position accounting for navbar
        const scrollPosition = absoluteElementTop - navbarHeight - 20;
        
        // Use multiple scrolling methods for mobile compatibility
        const finalScrollPosition = Math.max(0, scrollPosition);
        
        // Real mobile device detection
        const isRealMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isRealMobile) {
          
          // Method 1: Try to focus the element first (sometimes helps with mobile scrolling)
          try {
            helpSection.focus();
          } catch (e) {
          }
          
          // Method 2: Simple instant scroll for real mobile devices
          const instantScrollToPosition = (targetPosition) => {
            
            // Try multiple scroll methods for maximum compatibility
            try {
              // Method 1: Direct window scroll
              window.scrollTo(0, targetPosition);
              
              // Method 2: Direct DOM manipulation
              document.documentElement.scrollTop = targetPosition;
              document.body.scrollTop = targetPosition;
              
              // Method 3: Force scroll on main container
              const mainContainer = document.querySelector('main');
              if (mainContainer) {
                mainContainer.scrollTop = targetPosition;
              }
              
              // Method 4: Use scrollIntoView with instant behavior
              helpSection.scrollIntoView({ 
                behavior: 'instant', 
                block: 'start',
                inline: 'nearest'
              });
              
            } catch (error) {
            }
            
          };
          
          // Use instant scrolling
          instantScrollToPosition(finalScrollPosition);
          
        } else {
          // Desktop/emulator approach
          
          try {
            helpSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
            
            // Check if it worked after a delay
            setTimeout(() => {
              const currentScroll = window.pageYOffset;
              
              if (Math.abs(currentScroll - finalScrollPosition) > 100) {
                
                // Method 2: Manual scroll with animation
                const startPosition = window.pageYOffset;
                const distance = finalScrollPosition - startPosition;
                const duration = 500; // 500ms animation
                let startTime = null;
                
                const animateScroll = (currentTime) => {
                  if (startTime === null) startTime = currentTime;
                  const timeElapsed = currentTime - startTime;
                  const progress = Math.min(timeElapsed / duration, 1);
                  
                  // Easing function (ease-out)
                  const easeOut = 1 - Math.pow(1 - progress, 3);
                  const currentPosition = startPosition + (distance * easeOut);
                  
                  // Try multiple scroll methods
                  window.scrollTo(0, currentPosition);
                  document.documentElement.scrollTop = currentPosition;
                  document.body.scrollTop = currentPosition;
                  
                  if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                  } else {
                  }
                };
                
                requestAnimationFrame(animateScroll);
              }
            }, 300);
            
          } catch (error) {
            // Final fallback - force scroll
            window.scrollTo(0, finalScrollPosition);
            document.documentElement.scrollTop = finalScrollPosition;
            document.body.scrollTop = finalScrollPosition;
          }
        }
      } else {
        // Desktop scrolling
        helpSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    } else {
      // Fallback: try to find the help section by text content
      const helpElements = document.querySelectorAll('*');
      let foundElement = null;
      
      for (let element of helpElements) {
        if (element.textContent && element.textContent.includes('Help & Support')) {
          foundElement = element;
          break;
        }
      }
      
      if (foundElement) {
        if (isMobile) {
          const navbar = document.querySelector('.MuiAppBar-root');
          const navbarHeight = navbar ? navbar.offsetHeight : 0;
          const elementRect = foundElement.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const scrollPosition = absoluteElementTop - navbarHeight - 20;
          const finalScrollPosition = Math.max(0, scrollPosition);
          
          // Use the same multiple-method approach for fallback
          try {
            window.scrollTo({
              top: finalScrollPosition,
              behavior: 'smooth'
            });
            
            setTimeout(() => {
              if (Math.abs(window.pageYOffset - finalScrollPosition) > 50) {
                window.scrollTo(0, finalScrollPosition);
              }
            }, 100);
            
            setTimeout(() => {
              if (Math.abs(window.pageYOffset - finalScrollPosition) > 50) {
                document.documentElement.scrollTop = finalScrollPosition;
              }
            }, 200);
            
          } catch (error) {
            window.scrollTo(0, finalScrollPosition);
          }
        } else {
          foundElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      } else {
      }
    }
  };

  const quickActions = [
    {
      title: t('reportLostItem'),
      description: t('reportLostItemDesc'),
      icon: <FindInPage sx={{ fontSize: '2rem' }} />,
      color: '#ff6b6b',
      action: () => {
        if (!token) {
          // Store the intended destination for redirect after login
          const intendedDestination = '/dash/posts/new?type=lost';
          authStorage.setRedirectAfterLogin(intendedDestination);
          
          navigate('/login');
        } else {
          navigate('/dash/posts/new?type=lost');
        }
      }
    },
    {
      title: t('reportFoundItem'),
      description: t('reportFoundItemDesc'),
      icon: <AddCircleOutline sx={{ fontSize: '2rem' }} />,
      color: '#4ecdc4',
      action: () => {
        if (!token) {
          // Store the intended destination for redirect after login
          const intendedDestination = '/dash/posts/new?type=found';
          authStorage.setRedirectAfterLogin(intendedDestination);
          
          navigate('/login');
        } else {
          navigate('/dash/posts/new?type=found');
        }
      }
    },
    {
      title: t('searchItems'),
      description: t('searchItemsDesc'),
      icon: <Search sx={{ fontSize: '2rem' }} />,
      color: '#45b7d1',
      action: () => navigate('/dash/posts')
    },
    {
      title: t('getHelp'),
      description: t('getHelpDesc'),
      icon: <HelpOutline sx={{ fontSize: '2rem' }} />,
      color: '#96ceb4',
      action: () => scrollToHelpSection()
    }
  ];

  return (
    <Box sx={{ 
      mb: 4,
      mx: { xs: 1, sm: 2 },
      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
      borderRadius: { xs: '12px', sm: '16px' },
      boxShadow: theme.palette.mode === 'dark' 
        ? '0 8px 32px rgba(0,0,0,0.3)'
        : '0 8px 32px rgba(0,0,0,0.1)',
      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
      p: { xs: 2, sm: 3 }
    }}>
      {/* Section Title */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          component="h2"
          sx={{
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#2c3e50',
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            textAlign: { xs: 'center', sm: 'left' },
            mb: 1
          }}
        >
          {t('quickActions')}
        </Typography>
        <Typography 
          variant="body1" 
          sx={{
            color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#7f8c8d',
            fontSize: { xs: '0.9rem', sm: '1rem' },
            textAlign: { xs: 'center', sm: 'left' },
            maxWidth: '600px'
          }}
        >
          {t('quickActionsDesc')}
        </Typography>
      </Box>

      {/* Quick Actions Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                borderRadius: { xs: '12px', sm: '16px' },
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)'
                  : '#ffffff',
                border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e0e0e0'}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)'
                  : '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { 
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
                    : '0 16px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.1)',
                },
                '&:active': {
                  transform: 'translateY(-4px) scale(0.98)',
                }
              }}
              onClick={action.action}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchEnd(e, action.action);
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Icon */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: { xs: '60px', sm: '70px' },
                    height: { xs: '60px', sm: '70px' },
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${action.color}20, ${action.color}10)`,
                    border: `2px solid ${action.color}30`,
                    mb: 2,
                    mx: 'auto'
                  }}
                >
                  <Box sx={{ 
                    color: action.color,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                  }}>
                    {action.icon}
                  </Box>
                </Box>

                {/* Content */}
                <Box sx={{ 
                  textAlign: 'center', 
                  flex: 1
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#2c3e50',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      mb: 1,
                      lineHeight: 1.3
                    }}
                  >
                    {action.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#7f8c8d',
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {action.description}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuickActions; 