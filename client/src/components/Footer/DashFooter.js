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
import "./footer.css";
import { useTranslation } from "../../utils/translations";
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
} from "@mui/material";


const DashFooter = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { username, country } = useAuth();
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();

  const onCreatePostClicked = () => {
    if (!username) {
      navigate('/signup');
    } else {
      navigate("/dash/posts/new");
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
              color="primary" 
              component={Link} 
              href="https://facebook.com" 
              target="_blank"
            >
              <Facebook />
            </IconButton>
            <IconButton 
              color="primary" 
              component={Link} 
              href="https://instagram.com" 
              target="_blank"
            >
              <Instagram />
            </IconButton>
            <IconButton 
              color="primary" 
              component={Link} 
              href="https://wa.me" 
              target="_blank"
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
            <ListItem button onClick={() => navigate('/dash/posts/new?type=lost')}>
              <ListItemText primary={t('reportLostItem')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
            <ListItem button onClick={() => navigate('/dash/posts/new?type=found')}>
              <ListItemText primary={t('reportFoundItem')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
            <ListItem button onClick={() => navigate('/dash/search')}>
              <ListItemText primary={t('searchItems')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
            </ListItem>
            <ListItem button onClick={() => navigate('/dash/help')}>
              <ListItemText primary={t('getHelp')} sx={{ '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } } }} />
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
                <Email color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="support@mafqoudat.com"
                secondary={t('emailUsForSupport')}
                sx={{ 
                  '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } },
                  '& .MuiListItemText-secondary': { fontSize: { xs: '14px', sm: '12px' } }
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Phone color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="+1 234 567 890"
                secondary={t('callUsForAssistance')}
                sx={{ 
                  '& .MuiListItemText-primary': { fontSize: { xs: '16px', sm: '14px' } },
                  '& .MuiListItemText-secondary': { fontSize: { xs: '14px', sm: '12px' } }
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <LocationOn color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={country || t('yourLocation')}
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
