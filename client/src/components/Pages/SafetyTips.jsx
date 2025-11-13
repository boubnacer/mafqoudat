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
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Security,
  LocationOn,
  Phone,
  Warning,
  CheckCircle,
  ExpandMore,
  Public,
  Person,
  Info,
  Report,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';

const SafetyTips = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();

  const safetyCategories = [
    {
      category: 'meeting',
      title: t('meetingSafely'),
      icon: <LocationOn color="primary" />,
      description: t('meetingSafelyDesc'),
      tips: [
        t('meetInPublicPlaces'),
        t('bringAFriend'),
        t('informSomeone'),
        t('trustYourInstincts'),
      ]
    },
    {
      category: 'communication',
      title: t('safeCommunication'),
      icon: <Phone color="info" />,
      description: t('safeCommunicationDesc'),
      tips: [
        t('usePlatformMessaging'),
        t('avoidPersonalInfo'),
        t('beCautiousWithPhotos'),
        t('reportSuspiciousBehavior'),
      ]
    },
    {
      category: 'verification',
      title: t('verifyIdentity'),
      icon: <Public color="success" />,
      description: t('verifyIdentityDesc'),
      tips: [
        t('askForIdentification'),
        t('verifyItemDetails'),
        t('checkUserHistory'),
        t('useVideoCall'),
      ]
    },
    {
      category: 'redFlags',
      title: t('redFlags'),
      icon: <Warning color="error" />,
      description: t('redFlagsDesc'),
      tips: [
        t('pressureToMeetQuickly'),
        t('requestsForMoney'),
        t('vagueDescriptions'),
        t('refusalToVerify'),
      ]
    }
  ];

  const emergencyContacts = [
    {
      service: t('police'),
      number: '911',
      description: t('policeDescription'),
      icon: <Security />,
    },
    {
      service: t('localPolice'),
      number: t('localPoliceNumber'),
      description: t('localPoliceDescription'),
      icon: <Security />,
    },
    {
      service: t('support'),
      number: t('supportNumber'),
      description: t('supportDescription'),
      icon: <Phone />,
    }
  ];

  const safetyChecklist = [
    {
      title: t('beforeMeeting'),
      items: [
        t('verifyUserProfile'),
        t('checkItemDescription'),
        t('agreeOnLocation'),
        t('informAFriend'),
      ]
    },
    {
      title: t('duringMeeting'),
      items: [
        t('stayInPublic'),
        t('bringIdentification'),
        t('inspectItemCarefully'),
        t('trustYourGut'),
      ]
    },
    {
      title: t('afterMeeting'),
      items: [
        t('reportSuccess'),
        t('leaveReview'),
        t('updateStatus'),
        t('stayInTouch'),
      ]
    }
  ];

  const faqItems = [
    {
      question: t('whatIfItemIsDamaged'),
      answer: t('whatIfItemIsDamagedAnswer'),
    },
    {
      question: t('howToReportScam'),
      answer: t('howToReportScamAnswer'),
    },
    {
      question: t('whatIfNoShow'),
      answer: t('whatIfNoShowAnswer'),
    },
    {
      question: t('howToVerifyItem'),
      answer: t('howToVerifyItemAnswer'),
    }
  ];

  return (
    <>
      <SeoMeta pageKey="safety" />
      <Box width="100%" minHeight="100vh" sx={{ backgroundColor: theme.palette.background.default }}>
        <Navbar />
        <Box sx={{ pt: { xs: '6rem', md: '7rem' }, pb: 6 }}>
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
                  {t('staySafeWhileUsing')} Mafqoudat
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
                  {t('safetyTipsDescription')}
                </Typography>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Safety Alert */}
              <Alert 
                severity="warning" 
                sx={{ mb: 4 }}
                icon={<Security />}
              >
                <Typography variant="body2">
                  {t('safetyAlertMessage')}
                </Typography>
              </Alert>

              {/* Safety Guidelines */}
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
                  {t('safetyGuidelines')}
                </Typography>
                
                <Grid container spacing={3}>
                  {safetyCategories.map((category, index) => (
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
                              {category.icon}
                            </ListItemIcon>
                            <Typography variant="h6" component="h3">
                              {category.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {category.description}
                          </Typography>
                          <List dense>
                            {category.tips.map((tip, tipIndex) => (
                              <ListItem key={tipIndex} sx={{ pl: 0 }}>
                                <ListItemText
                                  primary={tip}
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

              {/* Emergency Contacts */}
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
                  {t('emergencyContacts')}
                </Typography>
                
                <Grid container spacing={3}>
                  {emergencyContacts.map((contact, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card
                        sx={{
                          height: '100%',
                          background: theme.palette.mode === 'dark' 
                            ? 'rgba(244, 67, 54, 0.1)' 
                            : 'rgba(244, 67, 54, 0.05)',
                          border: `1px solid ${theme.palette.error.main}20`,
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                              {contact.icon}
                            </ListItemIcon>
                            <Typography variant="h6" component="h3">
                              {contact.service}
                            </Typography>
                          </Box>
                          <Typography variant="h4" color="error" sx={{ mb: 1, fontWeight: 'bold' }}>
                            {contact.number}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {contact.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Safety Checklist */}
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
                  {t('safetyChecklist')}
                </Typography>
                
                <Grid container spacing={3}>
                  {safetyChecklist.map((checklist, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card
                        sx={{
                          height: '100%',
                          background: theme.palette.mode === 'dark' 
                            ? 'rgba(76, 175, 80, 0.1)' 
                            : 'rgba(76, 175, 80, 0.05)',
                          border: `1px solid ${theme.palette.success.main}20`,
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <CheckCircle color="success" sx={{ mr: 1 }} />
                            <Typography variant="h6" component="h3">
                              {checklist.title}
                            </Typography>
                          </Box>
                          <List dense>
                            {checklist.items.map((item, itemIndex) => (
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
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* FAQ Section */}
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
                  {t('frequentlyAskedQuestions')}
                </Typography>
                
                {faqItems.map((faq, index) => (
                  <Accordion 
                    key={index}
                    sx={{ 
                      mb: 1,
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1" color={theme.palette.text.primary}>
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color={theme.palette.text.secondary}>
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
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
                  {t('safetyQuestions')}
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
    </>
  );
};

export default SafetyTips;
