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

  const scrollToHelpSection = () => {
    console.log('🔍 scrollToHelpSection called, isMobile:', isMobile);
    
    const helpSection = document.querySelector('[data-section="help"]');
    console.log('🔍 helpSection found:', !!helpSection, helpSection);
    
    if (helpSection) {
      if (isMobile) {
        console.log('📱 Mobile scrolling triggered');
        // Mobile-specific scrolling with manual calculation
        const navbar = document.querySelector('.MuiAppBar-root');
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        console.log('📱 Navbar height:', navbarHeight);
        
        // Get the element's position relative to the document
        const elementRect = helpSection.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        console.log('📱 Element position:', { elementRect, absoluteElementTop });
        
        // Calculate scroll position accounting for navbar
        const scrollPosition = absoluteElementTop - navbarHeight - 20;
        console.log('📱 Scroll position:', scrollPosition);
        
        // Use multiple scrolling methods for mobile compatibility
        const finalScrollPosition = Math.max(0, scrollPosition);
        console.log('📱 Final scroll position:', finalScrollPosition);
        console.log('📱 Current scroll position:', window.pageYOffset);
        
        // Real mobile device detection
        const isRealMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('📱 Real mobile device detected:', isRealMobile);
        
        if (isRealMobile) {
          console.log('📱 Using real mobile scroll strategy');
          
          // Method 1: Try to focus the element first (sometimes helps with mobile scrolling)
          try {
            helpSection.focus();
            console.log('📱 Focused help section');
          } catch (e) {
            console.log('📱 Focus failed:', e);
          }
          
          // Method 2: Smart mobile scroll that finds the correct container
          const smartScrollToPosition = (targetPosition) => {
            console.log('📱 Smart scrolling to:', targetPosition);
            
            // Find the actual scrollable container by checking which one has scroll
            const findScrollableContainer = () => {
              const containers = [
                document.documentElement,
                document.body,
                document.querySelector('main'),
                document.querySelector('#root')
              ].filter(Boolean);
              
              for (let container of containers) {
                if (container.scrollHeight > container.clientHeight) {
                  console.log('📱 Found scrollable container:', container.tagName, 'scrollHeight:', container.scrollHeight, 'clientHeight:', container.clientHeight);
                  return container;
                }
              }
              return document.documentElement; // fallback
            };
            
            const scrollableContainer = findScrollableContainer();
            
            // Use smooth scrolling on the correct container
            if (scrollableContainer === document.documentElement || scrollableContainer === document.body) {
              console.log('📱 Using window.scrollTo with smooth behavior');
              window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
              });
            } else {
              console.log('📱 Using container scroll with smooth behavior');
              // For other containers, we need to animate manually
              const startPosition = scrollableContainer.scrollTop;
              const distance = targetPosition - startPosition;
              const duration = 600; // 600ms smooth animation
              let startTime = null;
              
              const animateScroll = (currentTime) => {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                
                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentPosition = startPosition + (distance * easeOut);
                
                scrollableContainer.scrollTop = currentPosition;
                
                if (progress < 1) {
                  requestAnimationFrame(animateScroll);
                } else {
                  console.log('📱 Container scroll animation completed');
                }
              };
              
              requestAnimationFrame(animateScroll);
            }
            
            console.log('📱 After smart scroll, position:', window.pageYOffset);
          };
          
          // Use smart scrolling
          smartScrollToPosition(finalScrollPosition);
          
          // Fallback with scrollIntoView if needed
          setTimeout(() => {
            if (Math.abs(window.pageYOffset - finalScrollPosition) > 100) {
              console.log('📱 Smart scroll failed, using scrollIntoView fallback');
              helpSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
              });
            }
          }, 800);
          
        } else {
          // Desktop/emulator approach
          console.log('📱 Using desktop/emulator scroll strategy');
          
          try {
            console.log('📱 Method 1: Direct scrollIntoView on help section');
            helpSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
            
            // Check if it worked after a delay
            setTimeout(() => {
              const currentScroll = window.pageYOffset;
              console.log('📱 After scrollIntoView, current position:', currentScroll);
              console.log('📱 Distance from target:', Math.abs(currentScroll - finalScrollPosition));
              
              if (Math.abs(currentScroll - finalScrollPosition) > 100) {
                console.log('📱 Method 2: scrollIntoView failed, trying manual scroll');
                
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
                    console.log('📱 Manual scroll animation completed');
                  }
                };
                
                requestAnimationFrame(animateScroll);
              }
            }, 300);
            
          } catch (error) {
            console.error('📱 Scroll error:', error);
            // Final fallback - force scroll
            console.log('📱 Method 3: Force scroll fallback');
            window.scrollTo(0, finalScrollPosition);
            document.documentElement.scrollTop = finalScrollPosition;
            document.body.scrollTop = finalScrollPosition;
          }
        }
      } else {
        console.log('🖥️ Desktop scrolling triggered');
        // Desktop scrolling
        helpSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    } else {
      console.log('⚠️ Help section not found, trying fallback');
      // Fallback: try to find the help section by text content
      const helpElements = document.querySelectorAll('*');
      let foundElement = null;
      
      for (let element of helpElements) {
        if (element.textContent && element.textContent.includes('Help & Support')) {
          foundElement = element;
          console.log('🔍 Found help section by text:', element);
          break;
        }
      }
      
      if (foundElement) {
        if (isMobile) {
          console.log('📱 Mobile fallback scrolling');
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
            console.error('📱 Fallback scroll error:', error);
            window.scrollTo(0, finalScrollPosition);
          }
        } else {
          console.log('🖥️ Desktop fallback scrolling');
          foundElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      } else {
        console.log('❌ No help section found at all');
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
          navigate('/login');
        } else {
          scrollToHelpSection();
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
      action: () => {
        console.log('🔘 Get Help button clicked!');
        scrollToHelpSection();
      }
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
              onTouchEnd={(e) => {
                e.preventDefault();
                console.log('📱 Touch end event on card:', action.title);
                action.action();
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