import React, { useState } from 'react';
import {
  Box,
  Button,
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
  Tune,
  Analytics,
  ShoppingCart,
  Security,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import { isConsentManagerConfigured, openConsentManager } from '../../utils/consent';
import { colorTokens } from '../../designTokens';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';

// This page explains cookies; it does not collect consent. That is the
// consent manager's job (Google Funding Choices, loaded from public/index.html)
// and it is deliberately the only consent UI on the site - a second banner here
// would give the same question two answers, and only the one recorded in the
// CMP's TC string is the one Google Analytics and AdSense actually read. What
// the page adds is the way back into it: withdrawing consent has to stay as
// easy as giving it, and the CMP is not otherwise reachable once answered.
const CookieNotice = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();
  const [consentPanelFailed, setConsentPanelFailed] = useState(false);
  const consentManagerAvailable = isConsentManagerConfigured();

  const handleOpenConsentPanel = () => {
    setConsentPanelFailed(!openConsentManager());
  };

  // Text on the brand fill, picked by measured ratio rather than by
  // getContrastText - palette.primary.main is still the pre-Phase-1 #FFFFFF, so
  // MUI's contained button answers this question about the wrong color. White
  // on the light-mode brand blue is 7.5:1; on the lightened dark-mode twin it
  // is 3.4:1, where the light-mode ink is 5.3:1 instead.
  const brandButtonLabel =
    theme.palette.mode === 'dark' ? colorTokens.ink.light : colorTokens.surfaceRaised.light;

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
    <>
      <SeoMeta pageKey="cookies" />
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
                    <ListItemIcon sx={{ minWidth: 'auto', marginInlineEnd: 2 }}>
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
                              <ListItemIcon sx={{ minWidth: 'auto', marginInlineEnd: 1 }}>
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
                                  sx={{ marginInlineStart: 1 }}
                                />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {type.description}
                            </Typography>
                            <List dense>
                              {type.examples.map((example, exampleIndex) => (
                                <ListItem key={exampleIndex} sx={{ paddingInlineStart: 0 }}>
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
                              <ListItemIcon sx={{ minWidth: 'auto', marginInlineEnd: 1 }}>
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

                {/* Consent manager entry point */}
                {consentManagerAvailable && (
                  <Box
                    sx={{
                      mb: 4,
                      p: 3,
                      borderRadius: `${theme.custom.radius.lg}px`,
                      backgroundColor: theme.custom.color.surfaceRaised,
                      boxShadow: theme.custom.elevation.e1,
                    }}
                  >
                    <Box display="flex" alignItems="center" mb={2}>
                      <ListItemIcon sx={{ minWidth: 'auto', marginInlineEnd: 1 }}>
                        <Tune sx={{ color: theme.custom.color.brandPrimary }} />
                      </ListItemIcon>
                      <Typography
                        variant="h5"
                        component="h2"
                        sx={{ fontWeight: '600', color: theme.custom.color.ink }}
                      >
                        {t('manageCookiePreferences')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t('manageCookiePreferencesDesc')}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleOpenConsentPanel}
                      sx={{
                        backgroundColor: theme.custom.color.brandPrimary,
                        color: brandButtonLabel,
                        borderRadius: `${theme.custom.radius.md}px`,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: theme.custom.color.brandPrimary,
                          boxShadow: theme.custom.elevation.e2,
                        },
                      }}
                    >
                      {t('openConsentPanel')}
                    </Button>
                    {consentPanelFailed && (
                      <Typography
                        variant="body2"
                        sx={{ mt: 2, color: theme.custom.status.lost.main }}
                      >
                        {t('consentPanelUnavailable')}
                      </Typography>
                    )}
                  </Box>
                )}

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
                    {t('email')}: team.mafqoudat@gmail.com
                  </Typography>
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

export default CookieNotice;
