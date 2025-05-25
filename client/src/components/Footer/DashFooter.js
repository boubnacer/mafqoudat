import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
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

  const onGoHomeClicked = () => navigate("/dash");

  let goHomeButton = null;
  if (pathname !== "/dash") {
    goHomeButton = (
      <IconButton 
        title="Home" 
        onClick={onGoHomeClicked}
        sx={{ 
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        }}
      >
        <FontAwesomeIcon icon={faHouse} />
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
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Mafqoudat
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Helping people find their lost items and return found items to their owners.
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
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Quick Links
          </Typography>
          <List dense>
            <ListItem button onClick={() => navigate('/dash/posts/new?type=lost')}>
              <ListItemText primary="Report Lost Item" />
            </ListItem>
            <ListItem button onClick={() => navigate('/dash/posts/new?type=found')}>
              <ListItemText primary="Report Found Item" />
            </ListItem>
            <ListItem button onClick={() => navigate('/dash/search')}>
              <ListItemText primary="Search Items" />
            </ListItem>
            <ListItem button onClick={() => navigate('/dash/help')}>
              <ListItemText primary="Get Help" />
            </ListItem>
          </List>
        </Grid>

        {/* Contact Info */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Contact Us
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Email color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="support@mafqoudat.com"
                secondary="Email us for support"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Phone color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="+1 234 567 890"
                secondary="Call us for assistance"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <LocationOn color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={country || "Your Location"}
                secondary="Current Region"
              />
            </ListItem>
          </List>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Bottom Section */}
      <Grid container spacing={2} sx={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Mafqoudat. All rights reserved.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2 }}>
            <Link href="/privacy" color="text.secondary" underline="hover">
              Privacy Policy
            </Link>
            <Link href="/terms" color="text.secondary" underline="hover">
              Terms of Use
            </Link>
            <Link href="/cookies" color="text.secondary" underline="hover">
              Cookie Notice
            </Link>
          </Box>
        </Grid>
      </Grid>

      {goHomeButton}
    </Box>
  );
  return content;
};

export default DashFooter;
