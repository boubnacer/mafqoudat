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
  Chip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Group,
  CheckCircle,
  Cancel,
  Warning,
  Report,
  Security,
  Handshake,
  Public,
  Flag,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';

const CommunityGuidelines = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();

  const guidelines = [
    {
      category: 'respect',
      title: t('respectOthers'),
      icon: <Handshake color="primary" />,
      description: t('respectOthersDesc'),
      rules: [
        t('beKindAndRespectful'),
        t('noHarassmentOrBullying'),
        t('respectPrivacy'),
        t('noDiscrimination'),
      ]
    },
    {
      category: 'honesty',
      title: t('beHonest'),
      icon: <CheckCircle color="success" />,
      description: t('beHonestDesc'),
      rules: [
        t('provideAccurateInformation'),
        t('noFalseClaims'),
        t('honestDescriptions'),
        t('truthfulContactInfo'),
      ]
    },
    {
      category: 'safety',
      title: t('staySafe'),
      icon: <Security color="warning" />,
      description: t('staySafeDesc'),
      rules: [
        t('meetInPublicPlaces'),
        t('verifyIdentity'),
        t('noPersonalInfo'),
        t('reportSuspiciousActivity'),
      ]
    },
    {
      category: 'communication',
      title: t('communicateRespectfully'),
      icon: <Public color="info" />,
      description: t('communicateRespectfullyDesc'),
      rules: [
        t('useAppropriateLanguage'),
        t('noSpamOrScams'),
        t('respondPromptly'),
        t('bePatient'),
      ]
    }
  ];

  const prohibitedActions = [
    {
      action: t('falseInformation'),
      description: t('falseInformationDesc'),
      icon: <Cancel color="error" />,
      severity: 'high'
    },
    {
      action: t('harassment'),
      description: t('harassmentDesc'),
      icon: <Report color="error" />,
      severity: 'high'
    },
    {
      action: t('spamOrScams'),
      description: t('spamOrScamsDesc'),
      icon: <Flag color="error" />,
      severity: 'medium'
    },
    {
      action: t('inappropriateContent'),
      description: t('inappropriateContentDesc'),
      icon: <Warning color="warning" />,
      severity: 'medium'
    }
  ];

  const reportingProcess = [
    {
      step: 1,
      title: t('identifyViolation'),
      description: t('identifyViolationDesc'),
    },
    {
      step: 2,
      title: t('gatherEvidence'),
      description: t('gatherEvidenceDesc'),
    },
    {
      step: 3,
      title: t('submitReport'),
      description: t('submitReportDesc'),
    },
    {
      step: 4,
      title: t('reviewProcess'),
      description: t('reviewProcessDesc'),
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
                  {t('communityGuidelines')}
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
                  {t('communityGuidelinesDescription')}
                </Typography>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Important Notice */}
              <Alert 
                severity="info" 
                sx={{ mb: 4 }}
                icon={<Group />}
              >
                <Typography variant="body2">
                  {t('guidelinesImportantNotice')}
                </Typography>
              </Alert>

              {/* Our Guidelines */}
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
                  {t('ourGuidelines')}
                </Typography>
                
                <Grid container spacing={3}>
                  {guidelines.map((guideline, index) => (
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
                              {guideline.icon}
                            </ListItemIcon>
                            <Typography variant="h6" component="h3">
                              {guideline.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {guideline.description}
                          </Typography>
                          <List dense>
                            {guideline.rules.map((rule, ruleIndex) => (
                              <ListItem key={ruleIndex} sx={{ pl: 0 }}>
                                <ListItemText
                                  primary={rule}
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

              {/* Prohibited Actions */}
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
                  {t('prohibitedActions')}
                </Typography>
                
                <Grid container spacing={3}>
                  {prohibitedActions.map((action, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card
                        sx={{
                          height: '100%',
                          background: theme.palette.mode === 'dark' 
                            ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                            : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 4px 20px rgba(0,0,0,0.3)'
                            : '0 4px 20px rgba(0,0,0,0.1)',
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>
                              {action.icon}
                            </ListItemIcon>
                            <Typography
                              variant="h6"
                              component="h3"
                              sx={{ fontWeight: '600' }}
                            >
                              {action.action}
                            </Typography>
                            <Chip
                              label={action.severity === 'high' ? t('high') : t('medium')}
                              color={action.severity === 'high' ? 'error' : 'warning'}
                              size="small"
                              sx={{ ml: 'auto' }}
                            />
                          </Box>
                          
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.6 }}
                          >
                            {action.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Reporting Process */}
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
                  {t('reportingProcess')}
                </Typography>
                
                <Grid container spacing={3}>
                  {reportingProcess.map((step, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card
                        sx={{
                          height: '100%',
                          background: theme.palette.mode === 'dark' 
                            ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                            : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 4px 20px rgba(0,0,0,0.3)'
                            : '0 4px 20px rgba(0,0,0,0.1)',
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Chip
                              label={step.step}
                              color="primary"
                              sx={{ mr: 2 }}
                            />
                            <Typography
                              variant="h6"
                              component="h3"
                              sx={{ fontWeight: '600' }}
                            >
                              {step.title}
                            </Typography>
                          </Box>
                          
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.6 }}
                          >
                            {step.description}
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
                  {t('guidelinesQuestions')}
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

export default CommunityGuidelines;
