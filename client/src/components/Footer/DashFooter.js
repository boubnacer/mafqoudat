import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Facebook,
  Instagram,
  WhatsApp,
  Email,
  Phone,
  LocationOn,
} from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";
import useCountryName from "../../hooks/useCountryName";
import "./footer.css";
import { authStorage } from "../../utils/authStorage";
import { useTranslation } from "../../utils/translations";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../features/auth/authSlice";
import { isRTL } from "../../utils/languageUtils";
import {
  Typography,
  useTheme,
  Box,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
} from "@mui/material";


const DashFooter = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { username, country } = useAuth();
  const token = useSelector(selectCurrentToken);
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTLMode = isRTL();
  
  // Resolve country ID to country name
  const { countryName, isLoading: isCountryLoading } = useCountryName(country);

  const onCreatePostClicked = () => {
    if (!username) {
      // Store the intended destination for redirect after login
      const intendedDestination = "/dash/posts/new";
      authStorage.setRedirectAfterLogin(intendedDestination);
      
      navigate('/login');
    } else {
      navigate("/dash/posts/new");
    }
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
            // Ignore focus errors
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
              // Ignore scroll errors
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
      }
    }
  };

  let createPostButton = null;
  // Only show the plus icon on posts list page and mobile view
  // Make sure it only shows on the exact posts list page, not on dashboard or other pages
  
  // Completely disable the floating button for now
  if (false) {
    createPostButton = (
      <IconButton 
        title={t('addNewPost')} 
        onClick={onCreatePostClicked}
        sx={{ 
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
          zIndex: 9999, // Ensure it's on top of all elements
          display: { xs: 'flex', sm: 'none' }, // Only show on mobile (xs), hide on small screens and up
          '&:hover': {
            backgroundColor: '#1976D2',
            boxShadow: '0 6px 16px rgba(33, 150, 243, 0.6)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <FontAwesomeIcon icon={faPlus} size="lg" />
      </IconButton>
    );
  }

  const content = (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(0, 0, 0, 0.2)' 
          : 'rgba(0, 0, 0, 0.05)',
        padding: "4rem 2rem 1rem",
        position: "relative",
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Grid container spacing={4} sx={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Company Info */}
        <Grid item xs={12} md={4}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2,
              fontWeight: 'bold',
              fontSize: { xs: '20px', sm: '18px' },
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Mafqoudat
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '16px', sm: '14px' } }}>
            {t('footerDescription')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              component={Link} 
              href="https://www.facebook.com/profile.php?id=100075968495897" 
              target="_blank"
              sx={{ 
                color: '#1877F2',
                '&:hover': { 
                  backgroundColor: 'rgba(24, 119, 242, 0.1)',
                  color: '#1877F2' 
                }
              }}
            >
              <Facebook />
            </IconButton>
            <IconButton 
              component={Link} 
              href="https://www.instagram.com/mafkoudat?igsh=d29saTdtajZ5dWpu" 
              target="_blank"
              sx={{ 
                color: '#E4405F',
                '&:hover': { 
                  backgroundColor: 'rgba(228, 64, 95, 0.1)',
                  color: '#E4405F' 
                }
              }}
            >
              <Instagram />
            </IconButton>
            <IconButton 
              component={Link} 
              href="https://wa.me/212711621132" 
              target="_blank"
              sx={{ 
                color: '#25D366',
                '&:hover': { 
                  backgroundColor: 'rgba(37, 211, 102, 0.1)',
                  color: '#25D366' 
                }
              }}
            >
              <WhatsApp />
            </IconButton>
          </Box>
        </Grid>

        {/* Quick Links */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: { xs: '18px', sm: '16px' } }}>
            {t('quickLinks')}
          </Typography>
          <List dense>
            <ListItem 
              button 
              onClick={() => {
                if (!token) {
                  // Store the intended destination for redirect after login
                  const intendedDestination = '/dash/posts/new?type=lost';
                  authStorage.setRedirectAfterLogin(intendedDestination);
                  navigate('/login');
                } else {
                  navigate('/dash/posts/new?type=lost');
                }
              }}
            >
              <ListItemText primary={t('reportLostItem')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
            <ListItem 
              button 
              onClick={() => {
                if (!token) {
                  // Store the intended destination for redirect after login
                  const intendedDestination = '/dash/posts/new?type=found';
                  authStorage.setRedirectAfterLogin(intendedDestination);
                  navigate('/login');
                } else {
                  navigate('/dash/posts/new?type=found');
                }
              }}
            >
              <ListItemText primary={t('reportFoundItem')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
            <ListItem button onClick={() => navigate('/dash/posts')}>
              <ListItemText primary={t('searchItems')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
            <ListItem button onClick={scrollToHelpSection}>
              <ListItemText primary={t('getHelp')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
            <ListItem button onClick={() => navigate('/about')}>
              <ListItemText primary={t('aboutUs')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
            <ListItem button onClick={() => navigate('/blog')}>
              <ListItemText primary={t('blog')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
            <ListItem button onClick={() => navigate('/help')}>
              <ListItemText primary={t('helpCenter')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
            <ListItem button onClick={() => navigate('/contact')}>
              <ListItemText primary={t('contactUs')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
          </List>
        </Grid>

        {/* Contact Info */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: { xs: '18px', sm: '16px' } }}>
            {t('contactUs')}
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Email sx={{ color: '#EA4335' }} />
              </ListItemIcon>
              <ListItemText 
                primary="team.mafqoudat@gmail.com"
                secondary={t('emailUsForSupport')}
                sx={{ 
                  '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } },
                  '& .MuiListItemText-secondary': { fontSize: { xs: '14px', sm: '12px' } }
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Phone sx={{ color: '#34A853' }} />
              </ListItemIcon>
              <ListItemText 
                primary={<span className="phone-number">+212 711 621 132</span>}
                secondary={t('callUsForAssistance')}
                sx={{ 
                  '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } },
                  '& .MuiListItemText-secondary': { fontSize: { xs: '14px', sm: '12px' } }
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <LocationOn sx={{ color: '#4285F4' }} />
              </ListItemIcon>
              <ListItemText 
                primary={isCountryLoading ? t('loadingCountries') : (countryName || t('yourLocation'))}
                secondary={t('currentRegion')}
                sx={{ 
                  '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } },
                  '& .MuiListItemText-secondary': { fontSize: { xs: '14px', sm: '12px' } }
                }}
              />
            </ListItem>
          </List>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Bottom Section */}
      <Grid container spacing={2} sx={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '16px', sm: '14px' } }}>
            © {new Date().getFullYear()} Mafqoudat. {t('allRightsReserved')}.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'flex-start', md: 'flex-end' }, 
            gap: 2,
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
          }}>
            <Link 
              component="button" 
              onClick={() => navigate('/privacy')} 
              color="text.secondary" 
              underline="hover"
              sx={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: { xs: '16px', sm: '14px' } }}
            >
              {t('privacyPolicy')}
            </Link>
            <Link 
              component="button" 
              onClick={() => navigate('/terms')} 
              color="text.secondary" 
              underline="hover"
              sx={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: { xs: '16px', sm: '14px' } }}
            >
              {t('termsOfUse')}
            </Link>
            <Link 
              component="button" 
              onClick={() => navigate('/cookies')} 
              color="text.secondary" 
              underline="hover"
              sx={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: { xs: '16px', sm: '14px' } }}
            >
              {t('cookieNotice')}
            </Link>
          </Box>
        </Grid>
      </Grid>

      {createPostButton}
    </Box>
  );
  return content;
};

export default DashFooter;
