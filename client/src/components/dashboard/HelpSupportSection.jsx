import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  TextField,
  Grid,
  useTheme,
  Alert,
  CircularProgress,
  alpha,
} from "@mui/material";
import {
  Help,
  Phone,
  Security,
  ContactMail,
  ChatBubbleOutline,
  ExpandMore,
  CheckCircle,
  Send,
  Email as EmailIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { useSubmitContactFormMutation } from "../../features/contact/contactApiSlice";

// Calm, single-accent treatment (brandPrimary throughout, no stoplight
// red/green/orange) — this section's job is being findable and trustworthy
// when someone's stressed about a lost item, not driving excitement like
// QuickActions/Categories above it. Contact is surfaced first since a direct
// human channel matters more here than self-serve FAQ/guidelines.
const HelpSupportSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [helpTab, setHelpTab] = useState(0);

  // Contact form state
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);
  const [contactSubmitError, setContactSubmitError] = useState(null);

  // RTK Query mutation hook
  const [submitContactForm, { isLoading: isContactLoading }] = useSubmitContactFormMutation();

  const openContactDialog = () => {
    setHelpTab(0);
    setShowHelpDialog(true);
  };

  // Contact form handlers
  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (contactSubmitError) {
      setContactSubmitError(null);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSubmitError(null);

    try {
      await submitContactForm(contactFormData).unwrap();

      // Success
      setIsContactSubmitted(true);
      setContactFormData({ name: '', email: '', subject: '', message: '' });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsContactSubmitted(false);
      }, 5000);

    } catch (err) {
      // Handle different error types
      if (err.status === 429) {
        setContactSubmitError('Too many requests. Please wait a few minutes before submitting again.');
      } else if (err.status === 400) {
        setContactSubmitError(err.data?.message || 'Please check your input and try again.');
      } else if (err.status === 500) {
        setContactSubmitError('Server error. Please try again later.');
      } else {
        setContactSubmitError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const faqItems = [
    {
      question: t('howToReportLostItem'),
      answer: t('howToReportLostItemAnswer')
    },
    {
      question: t('howToClaimFoundItem'),
      answer: t('howToClaimFoundItemAnswer')
    },
    {
      question: t('whatInformationNeeded'),
      answer: t('whatInformationNeededAnswer')
    }
  ];

  const guidelines = [
    {
      title: t('beHonestInReports'),
      description: t('beHonestInReportsDesc')
    },
    {
      title: t('provideClearDescriptions'),
      description: t('provideClearDescriptionsDesc')
    },
    {
      title: t('keepCommunicationSafe'),
      description: t('keepCommunicationSafeDesc')
    }
  ];

  // Shared "generic surface card" treatment (SurfaceCard pattern) for the
  // FAQ/Guidelines panels; Contact gets a slightly stronger border+elevation
  // below to read as the primary option without borrowing the status
  // accent-bar idiom, which is reserved for lost/found semantics elsewhere.
  const surfaceCardSx = {
    height: '100%',
    p: { xs: 2.5, sm: 3 },
    borderRadius: `${theme.custom.radius.lg}px`,
    backgroundColor: theme.custom.color.surfaceRaised,
    border: `1px solid ${alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.08 : 0.1)}`,
    boxShadow: theme.custom.elevation.e1,
  };

  return (
    <>
      <Box
        data-section="help"
        sx={{
          mx: { xs: 1, sm: 2 },
          background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
          backdropFilter: 'blur(10px)',
          borderRadius: { xs: `${theme.custom.radius.lg}px`, sm: `${theme.custom.radius.xl}px` },
          border: `1px solid ${alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.08 : 0.15)}`,
          boxShadow: theme.custom.elevation.e1,
          padding: { xs: '1.5rem', sm: '2.5rem', md: '3rem' },
        }}
      >
        {/* Heading — calm and reassuring, not a CTA-driving banner */}
        <Box sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto', mb: { xs: 3, md: 4 } }}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              fontFamily: theme.custom.font.display,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              color: theme.custom.color.ink,
            }}
          >
            {t('helpAndSupport')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: theme.custom.font.body,
              color: alpha(theme.custom.color.ink, 0.65),
              fontSize: { xs: '0.9rem', sm: '1rem' },
              mt: 0.5,
            }}
          >
            {t('getHelpDesc')}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Contact — primary option, real tel:/mailto: links, direct path to a human */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                ...surfaceCardSx,
                border: `1.5px solid ${alpha(theme.custom.color.brandPrimary, 0.35)}`,
                boxShadow: theme.custom.elevation.e2,
              }}
            >
              <Box display="flex" alignItems="center" mb={2}>
                <ContactMail sx={{ marginInlineEnd: 1, color: theme.custom.color.brandPrimary }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: theme.custom.color.ink }}>
                  {t('contactUs')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
                <Box
                  component="a"
                  href="tel:+212711621132"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.25,
                    borderRadius: `${theme.custom.radius.md}px`,
                    textDecoration: 'none',
                    color: theme.custom.color.ink,
                    backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.18 : 0.09),
                    },
                  }}
                >
                  <Phone sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', color: alpha(theme.custom.color.ink, 0.6) }}>
                      {t('phoneNumber')}
                    </Typography>
                    <Typography
                      className="phone-number"
                      variant="body2"
                      fontWeight={600}
                    >
                      +212 711 621 132
                    </Typography>
                  </Box>
                </Box>

                <Box
                  component="a"
                  href="mailto:team.mafqoudat@gmail.com"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.25,
                    borderRadius: `${theme.custom.radius.md}px`,
                    textDecoration: 'none',
                    color: theme.custom.color.ink,
                    backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.18 : 0.09),
                    },
                  }}
                >
                  <EmailIcon sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ display: 'block', color: alpha(theme.custom.color.ink, 0.6) }}>
                      {t('email')}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {t('supportEmail')}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="caption" sx={{ color: alpha(theme.custom.color.ink, 0.55), px: 1.25 }}>
                  {t('support')} · {t('support24_7')}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                startIcon={<Send />}
                onClick={openContactDialog}
                sx={{
                  backgroundColor: theme.custom.color.brandPrimary,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: alpha(theme.custom.color.brandPrimary, 0.85),
                    boxShadow: 'none',
                  },
                }}
              >
                {t('getHelp')}
              </Button>
            </Box>
          </Grid>

          {/* FAQ — self-serve answers */}
          <Grid item xs={12} md={4}>
            <Box sx={surfaceCardSx}>
              <Box display="flex" alignItems="center" mb={2}>
                <Help sx={{ marginInlineEnd: 1, color: theme.custom.color.brandPrimary }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: theme.custom.color.ink }}>
                  {t('faq')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {faqItems.map((item, index) => (
                  <Accordion
                    key={index}
                    disableGutters
                    sx={{
                      boxShadow: 'none',
                      backgroundColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.05 : 0.03),
                      borderRadius: `${theme.custom.radius.sm}px !important`,
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ color: theme.custom.color.ink }}>
                        {item.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.7) }}>
                        {item.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Guidelines & safety */}
          <Grid item xs={12} md={4}>
            <Box sx={surfaceCardSx}>
              <Box display="flex" alignItems="center" mb={2}>
                <Security sx={{ marginInlineEnd: 1, color: theme.custom.color.brandPrimary }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: theme.custom.color.ink }}>
                  {t('guidelines')}
                </Typography>
              </Box>
              <List disablePadding>
                {guidelines.map((guideline, index) => (
                  <ListItem key={index} disableGutters alignItems="flex-start">
                    <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                      <CheckCircle sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={guideline.title}
                      secondary={guideline.description}
                      primaryTypographyProps={{ fontWeight: 600, color: theme.custom.color.ink, variant: 'body2' }}
                      secondaryTypographyProps={{ color: alpha(theme.custom.color.ink, 0.65), variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/guidelines')}
                  sx={{
                    color: theme.custom.color.brandPrimary,
                    borderColor: alpha(theme.custom.color.brandPrimary, 0.5),
                    '&:hover': {
                      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.08),
                      borderColor: theme.custom.color.brandPrimary,
                    },
                  }}
                >
                  {t('readGuidelines')}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/safety')}
                  sx={{
                    color: theme.custom.color.brandPrimary,
                    borderColor: alpha(theme.custom.color.brandPrimary, 0.5),
                    '&:hover': {
                      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.08),
                      borderColor: theme.custom.color.brandPrimary,
                    },
                  }}
                >
                  {t('safetyTips')}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Help Dialog */}
      <Dialog
        open={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.custom.color.surfaceRaised,
            backgroundImage: 'none',
            border: `1px solid ${alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.1 : 0.1)}`,
          }
        }}
      >
        <DialogTitle sx={{
          color: theme.custom.color.ink,
          backgroundColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.06 : 0.03),
          borderBottom: `1px solid ${alpha(theme.custom.color.ink, 0.1)}`,
        }}>
          {t('howCanWeHelpYou')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs
              value={helpTab}
              onChange={(e, newValue) => setHelpTab(newValue)}
              sx={{
                borderBottom: `1px solid ${alpha(theme.custom.color.ink, 0.1)}`,
                mb: 2,
                '& .MuiTab-root': {
                  color: alpha(theme.custom.color.ink, 0.6),
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: theme.custom.color.brandPrimary,
                    fontWeight: 600,
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.custom.color.brandPrimary,
                  height: 3,
                  borderRadius: '2px 2px 0 0'
                }
              }}
            >
              <Tab label={t('contactSupport')} />
              <Tab label={t('liveChat')} />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {helpTab === 0 && (
                <Box sx={{
                  backgroundColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.03 : 0.02),
                  borderRadius: `${theme.custom.radius.md}px`,
                  p: 3,
                  border: `1px solid ${alpha(theme.custom.color.ink, 0.06)}`,
                }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: theme.custom.color.ink }}>
                    {t('contactOurSupportTeam')}
                  </Typography>

                  {isContactSubmitted && (
                    <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
                      {t('messageSentSuccessfully')}
                    </Alert>
                  )}

                  {contactSubmitError && (
                    <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
                      {contactSubmitError}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleContactSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('yourName')}
                          name="name"
                          value={contactFormData.name}
                          onChange={handleContactInputChange}
                          required
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('yourEmail')}
                          name="email"
                          type="email"
                          value={contactFormData.email}
                          onChange={handleContactInputChange}
                          required
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label={t('subject')}
                          name="subject"
                          value={contactFormData.subject}
                          onChange={handleContactInputChange}
                          required
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label={t('yourMessage')}
                          name="message"
                          multiline
                          rows={3}
                          value={contactFormData.message}
                          onChange={handleContactInputChange}
                          required
                          variant="outlined"
                          size="small"
                          placeholder={t('messagePlaceholder')}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          disabled={isContactLoading}
                          startIcon={isContactLoading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                          sx={{
                            backgroundColor: theme.custom.color.brandPrimary,
                            boxShadow: 'none',
                            '&:hover': {
                              backgroundColor: alpha(theme.custom.color.brandPrimary, 0.85),
                              boxShadow: 'none',
                            },
                            '&:disabled': {
                              backgroundColor: alpha(theme.custom.color.ink, 0.12),
                              color: alpha(theme.custom.color.ink, 0.35),
                            },
                          }}
                        >
                          {isContactLoading ? t('sending') : t('sendMessage')}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              )}

              {helpTab === 1 && (
                <Box textAlign="center" py={4}>
                  <ChatBubbleOutline sx={{ fontSize: 60, color: theme.custom.color.brandPrimary, mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: theme.custom.color.ink }}>
                    {t('liveChatComingSoon')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.65) }}>
                    {t('liveChatComingSoonDesc')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{
          backgroundColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.06 : 0.03),
          borderTop: `1px solid ${alpha(theme.custom.color.ink, 0.1)}`,
          p: 2
        }}>
          <Button
            onClick={() => setShowHelpDialog(false)}
            variant="outlined"
            sx={{
              color: theme.custom.color.brandPrimary,
              borderColor: alpha(theme.custom.color.brandPrimary, 0.5),
              '&:hover': {
                backgroundColor: alpha(theme.custom.color.brandPrimary, 0.08),
                borderColor: theme.custom.color.brandPrimary,
              }
            }}
          >
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HelpSupportSection;
