import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  useTheme,
  useMediaQuery,
  Divider,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Info,
  People,
  LocationOn,
  Email,
  Phone,
  Public,
  Security,
  Speed,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';

const AboutUs = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();

  const features = [
    {
      title: t('communityDriven'),
      description: t('communityDrivenDesc'),
      icon: <People color="primary" />,
    },
    {
      title: t('securePlatform'),
      description: t('securePlatformDesc'),
      icon: <Security color="primary" />,
    },
    {
      title: t('fastMatching'),
      description: t('fastMatchingDesc'),
      icon: <Speed color="primary" />,
    },
    {
      title: t('multiLanguage'),
      description: t('multiLanguageDesc'),
      icon: <Public color="primary" />,
    },
  ];

  const team = [
    {
      name: t('developmentTeam'),
      role: t('technicalDevelopment'),
      description: t('developmentTeamDesc'),
    },
    {
      name: t('supportTeam'),
      role: t('customerSupport'),
      description: t('supportTeamDesc'),
    },
  ];

  return (
    <>
      <SeoMeta pageKey="about" />
      <Box width="100%" height="100%">
        <Box sx={{ backgroundColor: theme.palette.background }}>
          <Navbar />
          <Box
            sx={{
              minHeight: '100vh',
              pt: { xs: '6rem', sm: '7rem' },
              pb: 4,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Container maxWidth="lg">
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 2, md: 4 },
                  borderRadius: 2,
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                }}
              >
                {/* Header */}
                <Box textAlign="center" mb={4}>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      fontWeight: 'bold',
                      mb: 2,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '2rem', md: '3rem' },
                    }}
                  >
                    {t('aboutUs')}
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {t('reunitingCommunities')}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ maxWidth: '800px', mx: 'auto', lineHeight: 1.7 }}
                  >
                    {t('aboutUsDescription')}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {/* Mission Section */}
                <Box mb={4}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>
                      <Info color="primary" />
                    </ListItemIcon>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{
                        fontWeight: '600',
                        color: theme.palette.text.primary,
                      }}
                    >
                      {t('ourMission')}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                  >
                    {t('missionDescription')}
                  </Typography>
                </Box>

                {/* Features */}
                <Box mb={4}>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: '600',
                      mb: 3,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {t('whatMakesUsDifferent')}
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {features.map((feature, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card
                          sx={{
                            height: '100%',
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.02)',
                          }}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                              <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                                {feature.icon}
                              </ListItemIcon>
                              <Typography variant="h6" component="h3">
                                {feature.title}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {feature.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Team Section */}
                <Box mb={4}>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: '600',
                      mb: 3,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {t('ourTeam')}
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {team.map((member, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card
                          sx={{
                            height: '100%',
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.02)',
                          }}
                        >
                          <CardContent>
                            <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                              {member.name}
                            </Typography>
                            <Typography variant="subtitle1" color="primary" sx={{ mb: 2 }}>
                              {member.role}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {member.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Contact Information */}
                <Box
                  sx={{
                    mt: 6,
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(33, 150, 243, 0.1)' 
                      : 'rgba(33, 150, 243, 0.05)',
                    border: `1px solid ${theme.palette.primary.main}20`,
                  }}
                >
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ mb: 2, fontWeight: '600' }}
                  >
                    {t('getInTouch')}
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Email color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="team.mafqoudat@gmail.com"
                        secondary={t('emailUsForSupport')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Phone color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="+212 711 621 132"
                        secondary={t('callUsForAssistance')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationOn color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={t('servingMorocco')}
                        secondary={t('andArabWorld')}
                      />
                    </ListItem>
                  </List>
                </Box>
              </Paper>
            </Container>
          </Box>
          <DashFooter />
        </Box>
      </Box>
    </>
  );
};

export default AboutUs;
