import React, { useState, useEffect, useRef } from 'react';
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
  ExpandMore,
  CheckCircle,
  Send,
  Email as EmailIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useTranslation } from "../../utils/translations";
import { isRTL } from "../../utils/languageUtils";
import { useSubmitContactFormMutation } from "../../features/contact/contactApiSlice";

const HelpSupportSection = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = currentLanguage === 'ar' || isRTL(currentLanguage) || theme.direction === 'rtl';
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);
  const [contactSubmitError, setContactSubmitError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const [submitContactForm, { isLoading: isContactLoading }] = useSubmitContactFormMutation();

  const openContactDialog = () => {
    setShowHelpDialog(true);
  };

  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (contactSubmitError) {
      setContactSubmitError(null);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSubmitError(null);

    try {
      await submitContactForm(contactFormData).unwrap();
      setIsContactSubmitted(true);
      setContactFormData({ name: '', email: '', subject: '', message: '' });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsContactSubmitted(false);
      }, 5000);
    } catch (err) {
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
    { question: t('howToReportLostItem'), answer: t('howToReportLostItemAnswer') },
    { question: t('howToClaimFoundItem'), answer: t('howToClaimFoundItemAnswer') },
    { question: t('whatInformationNeeded'), answer: t('whatInformationNeededAnswer') }
  ];

  const guidelines = [
    { title: t('beHonestInReports'), description: t('beHonestInReportsDesc') },
    { title: t('provideClearDescriptions'), description: t('provideClearDescriptionsDesc') },
    { title: t('keepCommunicationSafe'), description: t('keepCommunicationSafeDesc') }
  ];

  const hairline = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const muted = isDark ? "#94A3B8" : "#64748B";
  const ink = theme.custom.color.ink;
  const brand = theme.custom.color.brandPrimary;

  const iconSquare = (active) => ({
    width: 32,
    height: 32,
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: active ? alpha(brand, isDark ? 0.14 : 0.09) : alpha(ink, isDark ? 0.06 : 0.04),
    border: `1px solid ${active ? alpha(brand, isDark ? 0.18 : 0.12) : hairline}`,
    color: active ? brand : muted,
  });

  const cardSx = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    p: { xs: 1.75, sm: 2 },
    borderRadius: "12px",
    backgroundColor: theme.custom.color.surfaceRaised,
    border: `1px solid ${hairline}`,
    boxShadow: 'none',
  };

  const contactCardSx = {
    ...cardSx,
    borderLeft: isRTLMode ? 'none' : `2px solid ${brand}`,
    borderRight: isRTLMode ? `2px solid ${brand}` : 'none',
  };

  const ghostButtonSx = {
    color: brand,
    borderColor: alpha(brand, 0.28),
    backgroundColor: "transparent",
    borderRadius: "10px",
    textTransform: "none",
    fontFamily: theme.custom.font.body,
    fontWeight: 600,
    fontSize: "12.5px",
    letterSpacing: "-0.01em",
    py: 0.75,
    "&:hover": {
      backgroundColor: alpha(brand, 0.08),
      borderColor: brand,
    },
    "&:focus-visible": {
      outline: `2px solid ${brand}`,
      outlineOffset: 1,
    },
  };

  return (
    <>
      <Box
        data-section="help"
        dir={isRTLMode ? 'rtl' : 'ltr'}
        sx={{
          position: 'relative',
          backgroundColor: theme.custom.color.surfaceRaised,
          border: `1px solid ${hairline}`,
          borderRadius: "16px",
          boxShadow: theme.custom.elevation.e1,
          overflow: 'hidden',
          direction: isRTLMode ? 'rtl' : 'ltr',
          mx: { xs: 1, sm: 2, md: 'auto' },
          maxWidth: { lg: '1400px', xl: '1600px' },
          px: { xs: 1.75, sm: 2.25, md: 2.5 },
          py: { xs: 2, sm: 2.25, md: 2.5 },
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto', mb: 2 }}>
          <Typography
            sx={{
              fontFamily: theme.custom.font.display,
              fontWeight: 650,
              fontSize: { xs: "15px", sm: "16px" },
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
              color: ink,
              textAlign: 'center',
            }}
          >
            {t('helpAndSupport')}
          </Typography>
          <Typography
            sx={{
              fontFamily: theme.custom.font.body,
              fontWeight: 450,
              fontSize: "12.5px",
              lineHeight: 1.4,
              color: muted,
              mt: 0.5,
              textAlign: 'center',
            }}
          >
            {t('getHelpDesc')}
          </Typography>
        </Box>

        <Grid container spacing={1.5} direction="row">
          {/* Contact — primary */}
          <Grid item xs={12} md={4}>
            <Box data-reveal-item="" sx={contactCardSx}>
              <Box display="flex" alignItems="center" gap={1.25} mb={1.75} sx={{ direction: isRTLMode ? 'rtl' : 'ltr' }}>
                <Box sx={iconSquare(true)}><ContactMail sx={{ fontSize: 16 }} /></Box>
                <Typography sx={{ fontFamily: theme.custom.font.body, fontWeight: 650, fontSize: "13.5px", letterSpacing: "-0.01em", color: ink, textAlign: isRTLMode ? 'right' : 'left' }}>
                  {t('contactUs')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5, flex: 1 }}>
                <Box
                  component="a"
                  href="tel:+212711621132"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    direction: isRTLMode ? 'rtl' : 'ltr',
                    gap: 1.1,
                    p: 1.1,
                    borderRadius: "10px",
                    textDecoration: 'none',
                    color: ink,
                    border: `1px solid ${hairline}`,
                    backgroundColor: "transparent",
                    transition: 'border-color 160ms ease, background-color 160ms ease',
                    "&:hover": {
                      backgroundColor: alpha(brand, isDark ? 0.07 : 0.04),
                      borderColor: alpha(brand, 0.18),
                    },
                    "&:focus-visible": {
                      outline: `2px solid ${brand}`,
                      outlineOffset: 1,
                    },
                  }}
                >
                  <Phone sx={{ fontSize: 16, color: brand, flexShrink: 0, transform: isRTLMode ? 'scaleX(-1)' : 'none' }} />
                  <Box sx={{ minWidth: 0, flex: 1, textAlign: isRTLMode ? 'right' : 'left' }}>
                    <Typography sx={{ fontFamily: theme.custom.font.body, fontSize: "11px", fontWeight: 500, color: muted, lineHeight: 1, textAlign: isRTLMode ? 'right' : 'left' }}>
                      {t('phoneNumber')}
                    </Typography>
                    <Typography className="phone-number" dir="ltr" sx={{ fontFamily: theme.custom.font.body, fontSize: "12.5px", fontWeight: 600, color: ink, lineHeight: 1.3, textAlign: isRTLMode ? 'right' : 'left', direction: 'ltr' }}>
                      +212 711 621 132
                    </Typography>
                  </Box>
                </Box>

                <Box
                  component="a"
                  href="mailto:support@mafqoudat.com"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    direction: isRTLMode ? 'rtl' : 'ltr',
                    gap: 1.1,
                    p: 1.1,
                    borderRadius: "10px",
                    textDecoration: 'none',
                    color: ink,
                    border: `1px solid ${hairline}`,
                    backgroundColor: "transparent",
                    transition: 'border-color 160ms ease, background-color 160ms ease',
                    "&:hover": {
                      backgroundColor: alpha(brand, isDark ? 0.07 : 0.04),
                      borderColor: alpha(brand, 0.18),
                    },
                    "&:focus-visible": {
                      outline: `2px solid ${brand}`,
                      outlineOffset: 1,
                    },
                  }}
                >
                  <EmailIcon sx={{ fontSize: 16, color: brand, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0, flex: 1, textAlign: isRTLMode ? 'right' : 'left' }}>
                    <Typography sx={{ fontFamily: theme.custom.font.body, fontSize: "11px", fontWeight: 500, color: muted, lineHeight: 1, textAlign: isRTLMode ? 'right' : 'left' }}>
                      {t('email')}
                    </Typography>
                    <Typography dir="ltr" sx={{ fontFamily: theme.custom.font.body, fontSize: "12.5px", fontWeight: 600, color: ink, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: isRTLMode ? 'right' : 'left', direction: isRTLMode ? 'ltr' : 'inherit' }}>
                      {t('supportEmail')}
                    </Typography>
                  </Box>
                </Box>

                <Typography sx={{ fontFamily: theme.custom.font.body, fontSize: "11px", color: muted, px: 0.5, textAlign: isRTLMode ? 'right' : 'left' }}>
                  {t('support')} · {t('support24_7')}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                startIcon={<Send sx={{ fontSize: 16, transform: isRTLMode ? 'scaleX(-1)' : 'none' }} />}
                onClick={openContactDialog}
                sx={{
                  backgroundColor: brand,
                  color: "#fff",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontFamily: theme.custom.font.body,
                  fontWeight: 600,
                  fontSize: "12.5px",
                  letterSpacing: "-0.01em",
                  py: 0.85,
                  boxShadow: "none",
                  "&:hover": { backgroundColor: brand, filter: "brightness(0.94)", boxShadow: "none" },
                  "&:focus-visible": { outline: `2px solid ${brand}`, outlineOffset: 1 },
                }}
              >
                {t('getHelp')}
              </Button>
            </Box>
          </Grid>

          {/* FAQ */}
          <Grid item xs={12} md={4}>
            <Box data-reveal-item="" sx={cardSx}>
              <Box display="flex" alignItems="center" gap={1.25} mb={1.5} sx={{ direction: isRTLMode ? 'rtl' : 'ltr' }}>
                <Box sx={iconSquare(false)}><Help sx={{ fontSize: 16 }} /></Box>
                <Typography sx={{ fontFamily: theme.custom.font.body, fontWeight: 650, fontSize: "13.5px", letterSpacing: "-0.01em", color: ink, textAlign: isRTLMode ? 'right' : 'left' }}>
                  {t('faq')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, direction: isRTLMode ? 'rtl' : 'ltr' }}>
                {faqItems.map((item, index) => (
                  <Accordion
                    key={index}
                    disableGutters
                    elevation={0}
                    sx={{
                      boxShadow: 'none',
                      backgroundColor: "transparent",
                      borderBottom: index < faqItems.length - 1 ? `1px solid ${hairline}` : "none",
                      borderRadius: "0 !important",
                      direction: isRTLMode ? 'rtl' : 'ltr',
                      "&:before": { display: 'none' },
                      "&.Mui-expanded": { margin: 0 },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore sx={{ fontSize: 18, color: muted }} />}
                      sx={{
                        px: 0,
                        py: 0.25,
                        minHeight: 44,
                        direction: isRTLMode ? 'rtl' : 'ltr',
                        "& .MuiAccordionSummary-content": {
                          my: 1,
                          gap: 1,
                          textAlign: isRTLMode ? 'right' : 'left',
                        },
                        "&:hover": { backgroundColor: alpha(ink, isDark ? 0.04 : 0.03) },
                        borderRadius: "8px",
                      }}
                    >
                      <Typography sx={{ fontFamily: theme.custom.font.body, fontWeight: 600, fontSize: "12.5px", color: ink, lineHeight: 1.35, textAlign: isRTLMode ? 'right' : 'left', width: '100%' }}>
                        {item.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pt: 0, pb: 1.25, direction: isRTLMode ? 'rtl' : 'ltr' }}>
                      <Typography sx={{ fontFamily: theme.custom.font.body, fontSize: "12.5px", fontWeight: 450, color: muted, lineHeight: 1.5, textAlign: isRTLMode ? 'right' : 'left' }}>
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
            <Box data-reveal-item="" sx={cardSx}>
              <Box display="flex" alignItems="center" gap={1.25} mb={1.5} sx={{ direction: isRTLMode ? 'rtl' : 'ltr' }}>
                <Box sx={iconSquare(false)}><Security sx={{ fontSize: 16 }} /></Box>
                <Typography sx={{ fontFamily: theme.custom.font.body, fontWeight: 650, fontSize: "13.5px", letterSpacing: "-0.01em", color: ink, textAlign: isRTLMode ? 'right' : 'left' }}>
                  {t('guidelines')}
                </Typography>
              </Box>
              <List disablePadding sx={{ flex: 1, direction: isRTLMode ? 'rtl' : 'ltr' }}>
                {guidelines.map((guideline, index) => (
                  <ListItem
                    key={index}
                    disableGutters
                    alignItems="flex-start"
                    sx={{
                      py: 0.85,
                      gap: 1.25,
                      direction: isRTLMode ? 'rtl' : 'ltr',
                      textAlign: isRTLMode ? 'right' : 'left',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mt: 0.25, color: brand }}>
                      <CheckCircle sx={{ fontSize: 16, color: brand }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={guideline.title}
                      secondary={guideline.description}
                      primaryTypographyProps={{
                        fontFamily: theme.custom.font.body,
                        fontWeight: 600,
                        color: ink,
                        fontSize: "12.5px",
                        lineHeight: 1.35,
                        textAlign: isRTLMode ? 'right' : 'left',
                      }}
                      secondaryTypographyProps={{
                        fontFamily: theme.custom.font.body,
                        color: muted,
                        fontSize: "12px",
                        lineHeight: 1.45,
                        textAlign: isRTLMode ? 'right' : 'left',
                      }}
                      sx={{
                        my: 0,
                        textAlign: isRTLMode ? 'right' : 'left',
                        "& .MuiTypography-root": {
                          textAlign: isRTLMode ? 'right' : 'left',
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button fullWidth variant="outlined" onClick={() => navigate('/guidelines')} sx={ghostButtonSx}>
                  {t('readGuidelines')}
                </Button>
                <Button fullWidth variant="outlined" onClick={() => navigate('/safety')} sx={ghostButtonSx}>
                  {t('safetyTips')}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
        maxWidth="sm"
        fullWidth
        dir={isRTLMode ? 'rtl' : 'ltr'}
        PaperProps={{
          sx: {
            backgroundColor: theme.custom.color.surfaceRaised,
            backgroundImage: 'none',
            border: `1px solid ${hairline}`,
            borderRadius: "16px",
            boxShadow: theme.custom.elevation.e2,
            overflow: 'hidden',
            direction: isRTLMode ? 'rtl' : 'ltr',
          }
        }}
      >
        <DialogTitle sx={{
          fontFamily: theme.custom.font.body,
          fontWeight: 650,
          fontSize: "14.5px",
          letterSpacing: "-0.01em",
          color: ink,
          borderBottom: `1px solid ${hairline}`,
          py: 1.75,
          textAlign: isRTLMode ? 'right' : 'left',
          direction: isRTLMode ? 'rtl' : 'ltr',
        }}>
          {t('howCanWeHelpYou')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, direction: isRTLMode ? 'rtl' : 'ltr' }}>
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontFamily: theme.custom.font.body, fontWeight: 600, fontSize: "13px", color: ink, mb: 1.5, textAlign: isRTLMode ? 'right' : 'left' }}>
              {t('contactOurSupportTeam')}
            </Typography>

            {isContactSubmitted && (
              <Alert
                severity="success"
                sx={{
                  mb: 2,
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  textAlign: isRTLMode ? 'right' : 'left',
                  direction: isRTLMode ? 'rtl' : 'ltr',
                  "& .MuiAlert-icon": {
                    marginRight: isRTLMode ? 0 : '12px',
                    marginLeft: isRTLMode ? '12px' : 0,
                  },
                }}
                icon={<CheckCircle sx={{ fontSize: 18 }} />}
              >
                {t('messageSentSuccessfully')}
              </Alert>
            )}

            {contactSubmitError && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  textAlign: isRTLMode ? 'right' : 'left',
                  direction: isRTLMode ? 'rtl' : 'ltr',
                  "& .MuiAlert-icon": {
                    marginRight: isRTLMode ? 0 : '12px',
                    marginLeft: isRTLMode ? '12px' : 0,
                  },
                }}
                icon={<ErrorIcon sx={{ fontSize: 18 }} />}
              >
                {contactSubmitError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleContactSubmit}>
              <Grid container spacing={1.5} direction={isRTLMode ? 'row-reverse' : 'row'}>
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
                    dir={isRTLMode ? 'rtl' : 'ltr'}
                    inputProps={{ dir: isRTLMode ? 'rtl' : 'ltr' }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px" },
                      "& .MuiInputBase-input": { textAlign: isRTLMode ? 'right' : 'left' },
                    }}
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
                    dir={isRTLMode ? 'rtl' : 'ltr'}
                    inputProps={{ dir: isRTLMode ? 'rtl' : 'ltr' }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px" },
                      "& .MuiInputBase-input": { textAlign: isRTLMode ? 'right' : 'left' },
                    }}
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
                    dir={isRTLMode ? 'rtl' : 'ltr'}
                    inputProps={{ dir: isRTLMode ? 'rtl' : 'ltr' }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px" },
                      "& .MuiInputBase-input": { textAlign: isRTLMode ? 'right' : 'left' },
                    }}
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
                    dir={isRTLMode ? 'rtl' : 'ltr'}
                    inputProps={{ dir: isRTLMode ? 'rtl' : 'ltr' }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px" },
                      "& .MuiInputBase-input": { textAlign: isRTLMode ? 'right' : 'left' },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isContactLoading}
                    startIcon={
                      isContactLoading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <Send sx={{ fontSize: 16, transform: isRTLMode ? 'scaleX(-1)' : 'none' }} />
                      )
                    }
                    sx={{
                      backgroundColor: brand,
                      color: "#fff",
                      borderRadius: "10px",
                      textTransform: "none",
                      fontFamily: theme.custom.font.body,
                      fontWeight: 600,
                      fontSize: "12.5px",
                      py: 1,
                      boxShadow: 'none',
                      "&:hover": { backgroundColor: brand, filter: "brightness(0.94)", boxShadow: 'none' },
                      "&:disabled": { backgroundColor: alpha(ink, 0.08), color: alpha(ink, 0.35) },
                    }}
                  >
                    {isContactLoading ? t('sending') : t('sendMessage')}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: `1px solid ${hairline}`,
            p: 1.75,
            backgroundColor: alpha(ink, isDark ? 0.03 : 0.015),
            direction: isRTLMode ? 'rtl' : 'ltr',
            justifyContent: isRTLMode ? 'flex-start' : 'flex-end',
          }}
        >
          <Button onClick={() => setShowHelpDialog(false)} variant="outlined" sx={ghostButtonSx}>
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HelpSupportSection;
