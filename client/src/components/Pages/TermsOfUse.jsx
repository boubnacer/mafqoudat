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
  Alert,
} from '@mui/material';
import {
  Description,
  CheckCircle,
  Warning,
  Gavel,
  Business,
  Handshake,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';

const TermsOfUse = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();

  const sections = [
    {
      title: t('acceptanceOfTerms'),
      icon: <CheckCircle color="primary" />,
      content: t('acceptanceOfTermsContent'),
      items: [
        t('byUsingPlatform'),
        t('readAndAccept'),
        t('updatesToTerms'),
        t('continuedUse'),
      ]
    },
    {
      title: t('userResponsibilities'),
      icon: <Handshake color="primary" />,
      content: t('userResponsibilitiesContent'),
      items: [
        t('provideAccurateInfo'),
        t('maintainAccountSecurity'),
        t('respectOtherUsers'),
        t('complyWithLaws'),
      ]
    },
    {
      title: t('prohibitedActivities'),
      icon: <Warning color="error" />,
      content: t('prohibitedActivitiesContent'),
      items: [
        t('falseInformation'),
        t('harassment'),
        t('illegalActivities'),
        t('spamOrScams'),
      ]
    },
    {
      title: t('intellectualProperty'),
      icon: <Business color="primary" />,
      content: t('intellectualPropertyContent'),
      items: [
        t('platformOwnership'),
        t('userContent'),
        t('trademarks'),
        t('copyright'),
      ]
    },
    {
      title: t('limitationOfLiability'),
      icon: <Warning color="warning" />,
      content: t('limitationOfLiabilityContent'),
      items: [
        t('noWarranties'),
        t('damageLimitation'),
        t('thirdPartyServices'),
        t('forceMajeure'),
      ]
    },
    {
      title: t('disputeResolution'),
      icon: <Gavel color="primary" />,
      content: t('disputeResolutionContent'),
      items: [
        t('negotiation'),
        t('mediation'),
        t('arbitration'),
        t('governingLaw'),
      ]
    }
  ];

  return (
    <>
      <SeoMeta pageKey="terms" />
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
                    {t('termsOfUse')}
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
                    {t('termsOfUseDescription')}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {/* Important Notice */}
                <Alert 
                  severity="info" 
                  sx={{ mb: 4 }}
                  icon={<Description />}
                >
                  <Typography variant="body2">
                    {t('termsImportantNotice')}
                  </Typography>
                </Alert>

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

                {/* Termination Section */}
                <Box
                  sx={{
                    mt: 6,
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(244, 67, 54, 0.1)' 
                      : 'rgba(244, 67, 54, 0.05)',
                    border: `1px solid ${theme.palette.error.main}20`,
                  }}
                >
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ mb: 2, fontWeight: '600' }}
                  >
                    {t('termination')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('terminationContent')}
                  </Typography>
                  <List dense>
                    <ListItem sx={{ paddingInlineStart: 0 }}>
                      <ListItemText
                        primary={t('violationOfTerms')}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItem>
                    <ListItem sx={{ paddingInlineStart: 0 }}>
                      <ListItemText
                        primary={t('fraudulentActivity')}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItem>
                    <ListItem sx={{ paddingInlineStart: 0 }}>
                      <ListItemText
                        primary={t('legalRequirements')}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItem>
                  </List>
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
                    {t('termsQuestions')}
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

export default TermsOfUse;
