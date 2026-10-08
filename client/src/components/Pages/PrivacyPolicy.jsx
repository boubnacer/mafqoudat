import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  useTheme,
  useMediaQuery,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Link,
  alpha,
} from '@mui/material';
import {
  PrivacyTip,
  Security,
  Gavel,
  Public,
  VerifiedUser,
  Update,
  DataUsage,
  Visibility,
  Cookie,
  Shield,
  GpsFixed,
  Campaign,
  OpenInNew,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';

const PrivacyPolicy = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();

  const sections = [
    {
      title: t('informationWeCollect'),
      icon: <DataUsage color="primary" />,
      content: t('informationWeCollectContent'),
      items: [
        t('personalInformation'),
        t('usageData'),
        t('deviceInformation'),
        t('locationData'),
        t('crashDiagnosticsData'),
      ]
    },
    {
      title: t('howWeUseInformation'),
      icon: <Visibility color="primary" />,
      content: t('howWeUseInformationContent'),
      items: [
        t('provideServices'),
        t('improvePlatform'),
        t('communicateWithYou'),
        t('ensureSecurity'),
      ]
    },
    {
      title: t('informationSharing'),
      icon: <Security color="primary" />,
      content: t('informationSharingContent'),
      items: [
        t('withYourConsent'),
        t('serviceProviders'),
        t('legalRequirements'),
        t('businessTransfers'),
      ]
    },
    {
      title: t('dataSecurity'),
      icon: <Shield color="primary" />,
      content: t('dataSecurityContent'),
      items: [
        t('encryption'),
        t('accessControls'),
        t('regularAudits'),
        t('incidentResponse'),
      ]
    },
    {
      title: t('yourRights'),
      icon: <GpsFixed color="primary" />,
      content: t('yourRightsContent'),
      items: [
        t('accessYourData'),
        t('correctYourData'),
        t('deleteYourData'),
        t('dataPortability'),
        t('law0908Rights'),
      ]
    },
    {
      title: t('cookiesAndTracking'),
      icon: <Cookie color="primary" />,
      content: t('cookiesAndTrackingContent'),
      items: [
        t('essentialCookies'),
        t('analyticsCookies'),
        t('preferenceCookies'),
        t('marketingCookies'),
        t('googleAdSenseCookies'),
      ]
    }
  ];

  return (
    <>
      <SeoMeta pageKey="privacy" />
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
                    {t('privacyPolicy')}
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
                    {t('privacyPolicyDescription')}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {/* Content Sections */}
                <Box>
                  {sections.map((section, index) => (
                    <Box key={index} mb={4}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <ListItemIcon sx={{ minWidth: 'auto', marginInlineEnd: 2 }}>
                          {section.icon}
                        </ListItemIcon>
                        <Typography
                          variant="h5"
                          component="h2"
                          sx={{
                            fontWeight: '600',
                            color: theme.palette.text.primary,
                          }}
                        >
                          {section.title}
                        </Typography>
                      </Box>
                      
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 2, lineHeight: 1.7 }}
                      >
                        {section.content}
                      </Typography>

                      <List dense>
                        {section.items.map((item, itemIndex) => (
                          <ListItem key={itemIndex} sx={{ paddingInlineStart: 0 }}>
                            <ListItemText
                              primary={item}
                              primaryTypographyProps={{
                                variant: 'body2',
                                color: 'text.secondary',
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>

                      {index < sections.length - 1 && (
                        <Divider sx={{ mt: 3 }} />
                      )}
                    </Box>
                  ))}
                </Box>

                {/* Advertising & Third-Party Cookies (Dedicated Google AdSense & Partner Disclosures) */}
                <Box
                  sx={{
                    mt: 4,
                    p: { xs: 2.5, md: 3.5 },
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(33, 150, 243, 0.1)'
                      : 'rgba(33, 150, 243, 0.05)',
                    border: `1px solid ${theme.palette.primary.main}20`,
                  }}
                >
                  <Box display="flex" alignItems="center" mb={2}>
                    <ListItemIcon sx={{ minWidth: 'auto', marginInlineEnd: 2 }}>
                      <Campaign color="primary" />
                    </ListItemIcon>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{
                        fontWeight: '600',
                        color: theme.palette.text.primary,
                      }}
                    >
                      {t('advertisingAndCookiesTitle')}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.8 }}
                  >
                    {t('thirdPartyVendorsContent')}
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.8 }}
                  >
                    {t('googleCookiesUsage')}
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.8 }}
                  >
                    {t('privacyLawComplianceContent')}
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    component="h3"
                    sx={{
                      mb: 1.5,
                      fontWeight: '600',
                      color: theme.palette.text.primary,
                    }}
                  >
                    {t('optOutAdvertisingTitle')}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.7 }}
                  >
                    {t('personalizedAdsOptOut')}
                  </Typography>

                  <List dense sx={{ py: 0 }}>
                    <ListItem sx={{ paddingInlineStart: 0, py: 0.75 }}>
                      <Link
                        href="https://www.google.com/settings/ads"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          fontWeight: 600,
                          color: 'primary.main',
                          textDecoration: 'none',
                          flexWrap: 'wrap',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        <span>{t('googleAdSettingsLinkText')}</span>
                        <Typography
                          component="span"
                          dir="ltr"
                          sx={{
                            fontSize: '0.85em',
                            color: 'text.secondary',
                            fontWeight: 400,
                          }}
                        >
                          (https://www.google.com/settings/ads)
                        </Typography>
                        <OpenInNew sx={{ fontSize: 16 }} />
                      </Link>
                    </ListItem>
                    <ListItem sx={{ paddingInlineStart: 0, py: 0.75 }}>
                      <Link
                        href="https://www.aboutads.info/choices/"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          fontWeight: 600,
                          color: 'primary.main',
                          textDecoration: 'none',
                          flexWrap: 'wrap',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        <span>{t('aboutAdsLinkText')}</span>
                        <Typography
                          component="span"
                          dir="ltr"
                          sx={{
                            fontSize: '0.85em',
                            color: 'text.secondary',
                            fontWeight: 400,
                          }}
                        >
                          (https://www.aboutads.info/choices/)
                        </Typography>
                        <OpenInNew sx={{ fontSize: 16 }} />
                      </Link>
                    </ListItem>
                  </List>
                </Box>

                {/* Account deletion. Called out separately from the "Your
                    rights" bullet above because Google Play checks this policy
                    against the deletion URL declared in the Play Console - the
                    policy has to say how deletion actually works, and link to
                    it, not just assert the right exists. */}
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
                  <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: '600' }}>
                    {t('deleteAccount')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('deleteAccountPageIntro')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('deleteAccountRetentionBody')}
                  </Typography>
                  <Link
                    href="/delete-account"
                    variant="body2"
                    sx={{ fontWeight: 600 }}
                  >
                    {t('deleteAccountPageTitle')}
                  </Link>
                </Box>

                {/* Contact Information */}
                <Box
                  sx={{
                    mt: 4,
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
                    {t('privacyQuestions')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('email')}:{' '}
                    <Box
                      component="a"
                      href="mailto:privacy@mafqoudat.com"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 600,
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      privacy@mafqoudat.com
                    </Box>
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

export default PrivacyPolicy;
