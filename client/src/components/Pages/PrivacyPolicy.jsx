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
} from '@mui/material';
import {
  Security,
  Visibility,
  DataUsage,
  Cookie,
  Shield,
  GpsFixed,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';

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
      ]
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
                      <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>
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
                        <ListItem key={itemIndex} sx={{ pl: 0 }}>
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
                  {t('privacyQuestions')}
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
  );
};

export default PrivacyPolicy;
