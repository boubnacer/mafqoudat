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
  Chip,
} from '@mui/material';
import {
  Cookie,
  Settings,
  Analytics,
  ShoppingCart,
  Security,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';

const CookieNotice = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();

  const cookieTypes = [
    {
      type: 'essential',
      title: t('essentialCookies'),
      description: t('essentialCookiesDesc'),
      icon: <Security color="primary" />,
      color: 'primary',
      examples: [
        t('sessionManagement'),
        t('securityFeatures'),
        t('basicFunctionality'),
      ],
      required: true,
    },
    {
      type: 'analytics',
      title: t('analyticsCookies'),
      description: t('analyticsCookiesDesc'),
      icon: <Analytics color="info" />,
      color: 'info',
      examples: [
        t('usageStatistics'),
        t('performanceMetrics'),
        t('userBehavior'),
      ],
      required: false,
    },
    {
      type: 'preferences',
      title: t('preferenceCookies'),
      description: t('preferenceCookiesDesc'),
      icon: <Settings color="success" />,
      color: 'success',
      examples: [
        t('languageSettings'),
        t('themePreferences'),
        t('customizationOptions'),
      ],
      required: true,
    },
    {
      type: 'marketing',
      title: t('marketingCookies'),
      description: t('marketingCookiesDesc'),
      icon: <ShoppingCart color="warning" />,
      color: 'warning',
      examples: [
        t('targetedAdvertising'),
        t('socialMediaIntegration'),
        t('trackingCampaigns'),
      ],
      required: false,
    }
  ];

  const cookieManagement = [
    {
      title: t('browserSettings'),
      description: t('browserSettingsDesc'),
      icon: <Settings />,
    },
    {
      title: t('cookieConsent'),
      description: t('cookieConsentDesc'),
      icon: <CheckCircle />,
    },
    {
      title: t('thirdPartyCookies'),
      description: t('thirdPartyCookiesDesc'),
      icon: <Warning />,
    }
  ];

  return (
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
                  {t('cookieNotice')}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {t('lastUpdated')}: {new Date().toLocaleDateString()}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: '800px', mx: 'auto' }}
                >
                  {t('cookieNoticeDescription')}
                </Typography>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* What are Cookies Section */}
              <Box mb={4}>
                <Box display="flex" alignItems="center" mb={2}>
                  <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>
                    <Cookie color="primary" />
                  </ListItemIcon>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: '600',
                      color: theme.palette.text.primary,
                    }}
                  >
                    {t('whatAreCookies')}
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7 }}
                >
                  {t('whatAreCookiesContent')}
                </Typography>
              </Box>

              {/* Types of Cookies */}
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
                  {t('typesOfCookies')}
                </Typography>
                
                <Grid container spacing={3}>
                  {cookieTypes.map((type, index) => (
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
                              {type.icon}
                            </ListItemIcon>
                            <Typography variant="h6" component="h3">
                              {type.title}
                            </Typography>
                            {type.required && (
                              <Chip 
                                label={t('required')} 
                                size="small" 
                                color="primary" 
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {type.description}
                          </Typography>
                          <List dense>
                            {type.examples.map((example, exampleIndex) => (
                              <ListItem key={exampleIndex} sx={{ pl: 0 }}>
                                <ListItemText
                                  primary={example}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    color: 'text.secondary',
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Cookie Management */}
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
                  {t('managingCookies')}
                </Typography>
                
                <Grid container spacing={3}>
                  {cookieManagement.map((item, index) => (
                    <Grid item xs={12} md={4} key={index}>
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
                              {item.icon}
                            </ListItemIcon>
                            <Typography variant="h6" component="h3">
                              {item.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
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
                  {t('contactUs')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('cookieQuestions')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('email')}: privacy@mafqoudat.com
                </Typography>
              </Box>
            </Paper>
          </Container>
        </Box>
        <DashFooter />
      </Box>
    </Box>
  );
};

export default CookieNotice;
