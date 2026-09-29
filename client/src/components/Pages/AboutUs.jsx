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
  Avatar,
  Chip,
  Button,
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
  Verified,
  GitHub,
  LinkedIn,
  Send,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
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
        <Box sx={{ backgroundColor: theme.palette.background.default }}>
          <Navbar />
          <Box
            sx={{
              minHeight: '100vh',
              pt: { xs: '6rem', sm: '7rem' },
              pb: 4,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Container maxWidth="xl">
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
                    <ListItemIcon sx={{ minWidth: 'auto', marginInlineEnd: 2 }}>
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
                              <ListItemIcon sx={{ minWidth: 'auto', marginInlineEnd: 1 }}>
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

                {/* Founder & Leadership Section - AdSense Human Author Signal */}
                <Box mb={5}>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: '700',
                      mb: 2.5,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {t('founderAndLeadership')}
                  </Typography>

                  <Card
                    sx={{
                      p: { xs: 2.5, sm: 4 },
                      borderRadius: `${theme.custom.radius.lg}px`,
                      border: `1px solid ${theme.custom.color.brandPrimary}33`,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.09) 0%, rgba(255, 255, 255, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(33, 150, 243, 0.06) 0%, #ffffff 100%)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 8px 32px rgba(0, 0, 0, 0.35)'
                        : '0 8px 28px rgba(33, 150, 243, 0.1)',
                      mb: 4,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'center', md: 'flex-start' },
                        gap: 3.5,
                        textAlign: { xs: 'center', md: 'left' },
                      }}
                    >
                      <Box sx={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar
                          src="/author-avatar.jpg"
                          alt={t('founderName')}
                          sx={{
                            width: { xs: 110, sm: 130 },
                            height: { xs: 110, sm: 130 },
                            border: `3.5px solid ${theme.custom.color.brandPrimary}`,
                            bgcolor: theme.custom.color.brandPrimary,
                            color: '#ffffff',
                            fontSize: '2.5rem',
                            fontWeight: 700,
                            boxShadow: '0 10px 28px rgba(33, 150, 243, 0.3)',
                          }}
                        >
                          N
                        </Avatar>
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: { xs: 'center', md: 'flex-start' },
                            flexWrap: 'wrap',
                            gap: 1.5,
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="h4"
                            component="h3"
                            sx={{
                              fontWeight: 800,
                              fontSize: { xs: '1.45rem', sm: '1.75rem' },
                              color: theme.palette.text.primary,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {t('founderName')}
                          </Typography>
                          <Chip
                            icon={<Verified sx={{ fontSize: '16px !important', color: `${theme.custom.color.brandPrimary} !important` }} />}
                            label={t('authorVerifiedBadge')}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(33,150,243,0.18)' : 'rgba(33,150,243,0.1)',
                              color: theme.custom.color.brandPrimary,
                              border: `1px solid ${theme.custom.color.brandPrimary}44`,
                            }}
                          />
                        </Box>

                        <Typography
                          variant="subtitle1"
                          color="primary"
                          sx={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            mb: 1.5,
                            letterSpacing: '0.01em',
                          }}
                        >
                          {t('founderRole')}
                        </Typography>

                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{
                            lineHeight: 1.8,
                            fontSize: { xs: '0.94rem', sm: '1rem' },
                            mb: 2.5,
                          }}
                        >
                          {t('founderBio')}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1, mb: 3 }}>
                          <Chip label="Full-Stack Web Engineering" size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                          <Chip label="Geolocation & Mapping" size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                          <Chip label="Civic Trust & Anti-Fraud" size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                          <Chip label="Data Security & Privacy" size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1.5 }}>
                          <Button
                            component="a"
                            href="https://www.linkedin.com/in/nacer-boubkraoui"
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            size="small"
                            startIcon={<LinkedIn sx={{ fontSize: 18 }} />}
                            sx={{
                              borderRadius: `${theme.custom.radius.sm}px`,
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 2,
                              color: '#0A66C2',
                              borderColor: 'rgba(10, 102, 194, 0.4)',
                              '&:hover': {
                                borderColor: '#0A66C2',
                                bgcolor: 'rgba(10, 102, 194, 0.08)',
                              },
                            }}
                          >
                            LinkedIn
                          </Button>
                          <Button
                            component="a"
                            href="https://github.com/boubnacer"
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            size="small"
                            startIcon={<GitHub sx={{ fontSize: 18 }} />}
                            sx={{
                              borderRadius: `${theme.custom.radius.sm}px`,
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 2,
                            }}
                          >
                            GitHub Profile
                          </Button>
                          <Button
                            component="a"
                            href="mailto:team.mafqoudat@gmail.com"
                            variant="contained"
                            size="small"
                            startIcon={<Email sx={{ fontSize: 18 }} />}
                            sx={{
                              borderRadius: `${theme.custom.radius.sm}px`,
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 2,
                              bgcolor: theme.custom.color.brandPrimary,
                            }}
                          >
                            Email Founder
                          </Button>
                          <Button
                            component={Link}
                            to="/contact"
                            variant="text"
                            size="small"
                            startIcon={<Send sx={{ fontSize: 16 }} />}
                            sx={{
                              borderRadius: `${theme.custom.radius.sm}px`,
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            Support Team
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Card>

                  {/* Supporting Teams */}
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: '600',
                      mb: 2,
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
                            borderRadius: `${theme.custom.radius.md}px`,
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.02)',
                          }}
                        >
                          <CardContent>
                            <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 700 }}>
                              {member.name}
                            </Typography>
                            <Typography variant="subtitle1" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
                              {member.role}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
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
