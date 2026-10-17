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
  const ink = theme.custom?.color?.ink || (isDark ? "#EDEFF5" : "#0B1220");
  const brand = theme.custom?.color?.brandPrimary || (isDark ? "#5B7FFF" : "#1B4DFF");
  const surfaceRaised = theme.custom?.color?.surfaceRaised || (isDark ? "#18181B" : "#FFFFFF");
  const surfaceNested = theme.custom?.color?.surfaceNested || (isDark ? "#27272A" : "#F1F5F9");
  const successColor = theme.custom?.status?.found?.main || (isDark ? "#3DDCA6" : "#1A8563");

  const iconBadge = (color, bg, border) => ({
    width: { xs: 44, md: 38 },
    height: { xs: 44, md: 38 },
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: bg,
    border: `1px solid ${border}`,
    color: color,
  });

  const cardSx = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    p: { xs: 2.5, md: 3 }, // generous p-5 on mobile (20px) and md:p-6 on desktop (24px)
    borderRadius: "16px",
    backgroundColor: surfaceRaised,
    border: `1px solid ${hairline}`,
    boxShadow: isDark
      ? "0 4px 20px rgba(0, 0, 0, 0.28)"
      : "0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.05)",
    transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
    "&:hover": {
      borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : alpha(brand, 0.26),
      boxShadow: isDark
        ? "0 8px 30px rgba(0, 0, 0, 0.38)"
        : "0 4px 12px rgba(15, 23, 42, 0.05), 0 14px 32px -4px rgba(15, 23, 42, 0.08)",
    },
  };

  const contactCardSx = {
    ...cardSx,
    borderInlineStart: `3px solid ${brand}`,
    position: 'relative',
    overflow: 'hidden',
  };

  const ghostButtonSx = {
    color: brand,
    borderColor: alpha(brand, isDark ? 0.35 : 0.26),
    backgroundColor: isDark ? alpha(brand, 0.04) : "transparent",
    borderRadius: "11px",
    textTransform: "none",
    fontFamily: theme.custom?.font?.body || "inherit",
    fontWeight: 600,
    fontSize: { xs: "15px", md: "13.5px" },
    minHeight: { xs: "46px", md: "42px" }, // >= 44px touch height on mobile
    letterSpacing: "-0.01em",
    py: { xs: 1.15, md: 0.85 },
    transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
    "&:hover": {
      backgroundColor: alpha(brand, isDark ? 0.12 : 0.08),
      borderColor: brand,
      transform: 'translateY(-1px)',
    },
    "&:active": {
      transform: 'translateY(1px)',
    },
    "&:focus-visible": {
      outline: `2px solid ${brand}`,
      outlineOffset: 1,
    },
  };

  const contactLinkSx = {
    display: 'flex',
    alignItems: 'center',
    direction: isRTLMode ? 'rtl' : 'ltr',
    gap: 1.5,
    p: { xs: 1.5, md: 1.25 },
    minHeight: { xs: "52px", md: "46px" }, // >= 44px mobile touch target
    borderRadius: "12px",
    textDecoration: 'none',
    color: ink,
    border: `1px solid ${hairline}`,
    backgroundColor: isDark ? alpha(surfaceNested, 0.45) : alpha(surfaceNested, 0.65),
    transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
    "&:hover": {
      backgroundColor: alpha(brand, isDark ? 0.10 : 0.06),
      borderColor: alpha(brand, 0.26),
      transform: 'translateY(-1px)',
    },
    "&:active": {
      transform: 'translateY(1px)',
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
          backgroundColor: isDark
            ? alpha(theme.custom?.color?.sectionCard || "#0B1220", 0.95)
            : alpha(theme.custom?.color?.sectionCard || "#FFFFFF", 0.85),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${hairline}`,
          borderRadius: { xs: "20px", md: "24px" },
          boxShadow: theme.custom?.elevation?.e1 || 'none',
          overflow: 'hidden',
          direction: isRTLMode ? 'rtl' : 'ltr',
          mx: { xs: 1, sm: 2, md: 'auto' },
          maxWidth: { lg: '1400px', xl: '1600px' },
          px: { xs: 2, sm: 2.5, md: 3.5 },
          py: { xs: 2.5, sm: 3, md: 3.5 },
        }}
      >
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: { xs: 2.5, md: 3 } }}>
          <Typography
            sx={{
              fontFamily: theme.custom?.font?.display || "inherit",
              fontWeight: 700,
              fontSize: { xs: "1.15rem", sm: "1.2rem", md: "1.25rem" }, // md:text-xl (20px)
              letterSpacing: "-0.015em",
              lineHeight: 1.3,
              color: ink,
              textAlign: 'center',
            }}
          >
            {t('helpAndSupport')}
          </Typography>
          <Typography
            sx={{
              fontFamily: theme.custom?.font?.body || "inherit",
              fontWeight: 450,
              fontSize: { xs: "16px", md: "14px" }, // 16px (text-base) on mobile, md:text-sm (14px) on desktop
              lineHeight: 1.5,
              color: muted,
              mt: 0.75,
              textAlign: 'center',
            }}
          >
            {t('getHelpDesc')}
          </Typography>
        </Box>

        {/* 3-Column Grid */}
        <Grid container spacing={{ xs: 2, md: 2.5 }} direction="row">
          {/* Card 1: Contact (Primary) */}
          <Grid item xs={12} md={4}>
            <Box data-reveal-item="" sx={contactCardSx}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2} sx={{ direction: isRTLMode ? 'rtl' : 'ltr' }}>
                <Box sx={iconBadge(brand, alpha(brand, isDark ? 0.16 : 0.08), alpha(brand, isDark ? 0.28 : 0.16))}>
                  <ContactMail sx={{ fontSize: { xs: 22, md: 19 } }} />
                </Box>
                <Typography
                  sx={{
                    fontFamily: theme.custom?.font?.display || "inherit",
                    fontWeight: 700,
                    fontSize: { xs: "17px", md: "16px" }, // md:text-base (16px)
                    letterSpacing: "-0.01em",
                    color: ink,
                    textAlign: isRTLMode ? 'right' : 'left'
                  }}
                >
                  {t('contactUs')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2, flex: 1 }}>
                {/* Phone */}
                <Box
                  component="a"
                  href="tel:+212711621132"
                  sx={contactLinkSx}
                >
                  <Box
                    sx={{
                      width: { xs: 36, md: 32 },
                      height: { xs: 36, md: 32 },
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      backgroundColor: alpha(brand, isDark ? 0.16 : 0.09),
                      color: brand,
                    }}
                  >
                    <Phone sx={{ fontSize: { xs: 18, md: 16 }, transform: isRTLMode ? 'scaleX(-1)' : 'none' }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1, textAlign: isRTLMode ? 'right' : 'left' }}>
                    <Typography
                      sx={{
                        fontFamily: theme.custom?.font?.body || "inherit",
                        fontSize: { xs: "14px", md: "12px" }, // 14px secondary label on mobile
                        fontWeight: 500,
                        color: muted,
                        lineHeight: 1.2,
                        textAlign: isRTLMode ? 'right' : 'left'
                      }}
                    >
                      {t('phoneNumber')}
                    </Typography>
                    <Typography
                      className="phone-number"
                      dir="ltr"
                      sx={{
                        fontFamily: theme.custom?.font?.body || "inherit",
                        fontSize: { xs: "16px", md: "14px" }, // 16px body on mobile, md:14px
                        fontWeight: 650,
                        color: ink,
                        lineHeight: 1.35,
                        mt: 0.25,
                        textAlign: isRTLMode ? 'right' : 'left',
                        direction: 'ltr'
                      }}
                    >
                      +212 711 621 132
                    </Typography>
                  </Box>
                </Box>

                {/* Email */}
                <Box
                  component="a"
                  href="mailto:support@mafqoudat.com"
                  sx={contactLinkSx}
                >
                  <Box
                    sx={{
                      width: { xs: 36, md: 32 },
                      height: { xs: 36, md: 32 },
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      backgroundColor: alpha(brand, isDark ? 0.16 : 0.09),
                      color: brand,
                    }}
                  >
                    <EmailIcon sx={{ fontSize: { xs: 18, md: 16 } }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1, textAlign: isRTLMode ? 'right' : 'left' }}>
                    <Typography
                      sx={{
                        fontFamily: theme.custom?.font?.body || "inherit",
                        fontSize: { xs: "14px", md: "12px" }, // 14px secondary label on mobile
                        fontWeight: 500,
                        color: muted,
                        lineHeight: 1.2,
                        textAlign: isRTLMode ? 'right' : 'left'
                      }}
                    >
                      {t('email')}
                    </Typography>
                    <Typography
                      dir="ltr"
                      sx={{
                        fontFamily: theme.custom?.font?.body || "inherit",
                        fontSize: { xs: "16px", md: "14px" }, // 16px body on mobile, md:14px
                        fontWeight: 650,
                        color: ink,
                        lineHeight: 1.35,
                        mt: 0.25,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: isRTLMode ? 'right' : 'left',
                        direction: isRTLMode ? 'ltr' : 'inherit'
                      }}
                    >
                      {t('supportEmail')}
                    </Typography>
                  </Box>
                </Box>

                {/* 24/7 Support Soft Tonal Badge */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.25,
                    py: 0.6,
                    borderRadius: "999px",
                    backgroundColor: alpha(successColor, isDark ? 0.12 : 0.08),
                    border: `1px solid ${alpha(successColor, isDark ? 0.25 : 0.15)}`,
                    width: 'fit-content',
                    mt: 0.25,
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: successColor,
                      boxShadow: `0 0 6px ${alpha(successColor, 0.6)}`,
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: theme.custom?.font?.body || "inherit",
                      fontSize: { xs: "14px", md: "12px" }, // 14px secondary label on mobile
                      fontWeight: 600,
                      color: isDark ? "#6EE7B7" : "#065F46",
                      lineHeight: 1,
                      textAlign: isRTLMode ? 'right' : 'left',
                    }}
                  >
                    {t('support')} · {t('support24_7')}
                  </Typography>
                </Box>
              </Box>

              {/* Primary Contact CTA Button */}
              <Button
                fullWidth
                variant="contained"
                startIcon={<Send sx={{ fontSize: { xs: 18, md: 16 }, transform: isRTLMode ? 'scaleX(-1)' : 'none' }} />}
                onClick={openContactDialog}
                sx={{
                  backgroundColor: brand,
                  color: "#fff",
                  borderRadius: "12px",
                  textTransform: "none",
                  fontFamily: theme.custom?.font?.body || "inherit",
                  fontWeight: 650,
                  fontSize: { xs: "16px", md: "14px" }, // 16px primary button on mobile, md:14px
                  minHeight: { xs: "48px", md: "44px" }, // >= 44px touch height
                  letterSpacing: "-0.01em",
                  py: { xs: 1.25, md: 1 },
                  boxShadow: "none",
                  transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
                  "&:hover": {
                    backgroundColor: brand,
                    filter: "brightness(0.92)",
                    boxShadow: `0 4px 14px ${alpha(brand, 0.32)}`,
                    transform: 'translateY(-1px)',
                  },
                  "&:active": {
                    transform: 'translateY(1px)',
                  },
                  "&:focus-visible": { outline: `2px solid ${brand}`, outlineOffset: 2 },
                }}
              >
                {t('getHelp')}
              </Button>
            </Box>
          </Grid>

          {/* Card 2: FAQ */}
          <Grid item xs={12} md={4}>
            <Box data-reveal-item="" sx={cardSx}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2} sx={{ direction: isRTLMode ? 'rtl' : 'ltr' }}>
                <Box
                  sx={iconBadge(
                    isDark ? "#60A5FA" : "#2563EB",
                    alpha(isDark ? "#60A5FA" : "#2563EB", isDark ? 0.15 : 0.08),
                    alpha(isDark ? "#60A5FA" : "#2563EB", isDark ? 0.28 : 0.16)
                  )}
                >
                  <Help sx={{ fontSize: { xs: 22, md: 19 } }} />
                </Box>
                <Typography
                  sx={{
                    fontFamily: theme.custom?.font?.display || "inherit",
                    fontWeight: 700,
                    fontSize: { xs: "17px", md: "16px" }, // md:text-base (16px)
                    letterSpacing: "-0.01em",
                    color: ink,
                    textAlign: isRTLMode ? 'right' : 'left'
                  }}
                >
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
                      expandIcon={<ExpandMore sx={{ fontSize: { xs: 22, md: 20 }, color: muted }} />}
                      sx={{
                        px: 1,
                        py: { xs: 0.75, md: 0.5 },
                        minHeight: { xs: "52px", md: "46px" }, // >= 44px touch height
                        direction: isRTLMode ? 'rtl' : 'ltr',
                        borderRadius: "10px",
                        transition: 'background-color 160ms ease',
                        "& .MuiAccordionSummary-content": {
                          my: 1,
                          gap: 1,
                          textAlign: isRTLMode ? 'right' : 'left',
                        },
                        "&:hover": { backgroundColor: alpha(brand, isDark ? 0.08 : 0.04) },
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: theme.custom?.font?.body || "inherit",
                          fontWeight: 650,
                          fontSize: { xs: "16px", md: "14px" }, // 16px body on mobile, md:14px
                          color: ink,
                          lineHeight: 1.4,
                          textAlign: isRTLMode ? 'right' : 'left',
                          width: '100%'
                        }}
                      >
                        {item.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 1, pt: 0.25, pb: 1.75, direction: isRTLMode ? 'rtl' : 'ltr' }}>
                      <Typography
                        sx={{
                          fontFamily: theme.custom?.font?.body || "inherit",
                          fontSize: { xs: "16px", md: "14px" }, // 16px body on mobile, md:14px
                          fontWeight: 450,
                          color: muted,
                          lineHeight: 1.6,
                          textAlign: isRTLMode ? 'right' : 'left'
                        }}
                      >
                        {item.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Card 3: Guidelines & Safety */}
          <Grid item xs={12} md={4}>
            <Box data-reveal-item="" sx={cardSx}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2} sx={{ direction: isRTLMode ? 'rtl' : 'ltr' }}>
                <Box
                  sx={iconBadge(
                    successColor,
                    alpha(successColor, isDark ? 0.15 : 0.08),
                    alpha(successColor, isDark ? 0.28 : 0.16)
                  )}
                >
                  <Security sx={{ fontSize: { xs: 22, md: 19 } }} />
                </Box>
                <Typography
                  sx={{
                    fontFamily: theme.custom?.font?.display || "inherit",
                    fontWeight: 700,
                    fontSize: { xs: "17px", md: "16px" }, // md:text-base (16px)
                    letterSpacing: "-0.01em",
                    color: ink,
                    textAlign: isRTLMode ? 'right' : 'left'
                  }}
                >
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
                      py: { xs: 1.25, md: 1 },
                      gap: 1.5,
                      direction: isRTLMode ? 'rtl' : 'ltr',
                      textAlign: isRTLMode ? 'right' : 'left',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mt: { xs: 0.35, md: 0.2 }, color: successColor }}>
                      <CheckCircle sx={{ fontSize: { xs: 20, md: 18 }, color: successColor }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={guideline.title}
                      secondary={guideline.description}
                      primaryTypographyProps={{
                        fontFamily: theme.custom?.font?.body || "inherit",
                        fontWeight: 650,
                        color: ink,
                        fontSize: { xs: "16px", md: "14px" }, // 16px body on mobile, md:14px
                        lineHeight: 1.35,
                        textAlign: isRTLMode ? 'right' : 'left',
                      }}
                      secondaryTypographyProps={{
                        fontFamily: theme.custom?.font?.body || "inherit",
                        color: muted,
                        fontSize: { xs: "14px", md: "12.5px" }, // 14px secondary label on mobile
                        lineHeight: 1.55,
                        mt: 0.35,
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

              {/* Action Buttons */}
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
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

      {/* Contact Support Dialog */}
      <Dialog
        open={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
        maxWidth="sm"
        fullWidth
        dir={isRTLMode ? 'rtl' : 'ltr'}
        PaperProps={{
          sx: {
            backgroundColor: surfaceRaised,
            backgroundImage: 'none',
            border: `1px solid ${hairline}`,
            borderRadius: { xs: "18px", md: "20px" },
            boxShadow: theme.custom?.elevation?.e3 || 'none',
            overflow: 'hidden',
            direction: isRTLMode ? 'rtl' : 'ltr',
          }
        }}
      >
        <DialogTitle sx={{
          fontFamily: theme.custom?.font?.display || "inherit",
          fontWeight: 700,
          fontSize: { xs: "18px", md: "16px" },
          letterSpacing: "-0.01em",
          color: ink,
          borderBottom: `1px solid ${hairline}`,
          py: { xs: 2, md: 1.75 },
          px: { xs: 2.5, md: 3 },
          textAlign: isRTLMode ? 'right' : 'left',
          direction: isRTLMode ? 'rtl' : 'ltr',
        }}>
          {t('howCanWeHelpYou')}
        </DialogTitle>

        <DialogContent sx={{ pt: { xs: 2.5, md: 3 }, px: { xs: 2.5, md: 3 }, direction: isRTLMode ? 'rtl' : 'ltr' }}>
          <Box sx={{ mt: 1 }}>
            <Typography
              sx={{
                fontFamily: theme.custom?.font?.body || "inherit",
                fontWeight: 650,
                fontSize: { xs: "16px", md: "14px" }, // 16px body on mobile, md:14px
                color: ink,
                mb: 2,
                textAlign: isRTLMode ? 'right' : 'left'
              }}
            >
              {t('contactOurSupportTeam')}
            </Typography>

            {isContactSubmitted && (
              <Alert
                severity="success"
                sx={{
                  mb: 2.5,
                  borderRadius: "12px",
                  fontSize: { xs: "14px", md: "13px" },
                  textAlign: isRTLMode ? 'right' : 'left',
                  direction: isRTLMode ? 'rtl' : 'ltr',
                  "& .MuiAlert-icon": {
                    marginRight: isRTLMode ? 0 : '12px',
                    marginLeft: isRTLMode ? '12px' : 0,
                  },
                }}
                icon={<CheckCircle sx={{ fontSize: { xs: 22, md: 20 } }} />}
              >
                {t('messageSentSuccessfully')}
              </Alert>
            )}

            {contactSubmitError && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5,
                  borderRadius: "12px",
                  fontSize: { xs: "14px", md: "13px" },
                  textAlign: isRTLMode ? 'right' : 'left',
                  direction: isRTLMode ? 'rtl' : 'ltr',
                  "& .MuiAlert-icon": {
                    marginRight: isRTLMode ? 0 : '12px',
                    marginLeft: isRTLMode ? '12px' : 0,
                  },
                }}
                icon={<ErrorIcon sx={{ fontSize: { xs: 22, md: 20 } }} />}
              >
                {contactSubmitError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleContactSubmit}>
              <Grid container spacing={2} direction={isRTLMode ? 'row-reverse' : 'row'}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('yourName')}
                    name="name"
                    value={contactFormData.name}
                    onChange={handleContactInputChange}
                    required
                    variant="outlined"
                    size="medium"
                    dir={isRTLMode ? 'rtl' : 'ltr'}
                    inputProps={{ dir: isRTLMode ? 'rtl' : 'ltr' }}
                    InputLabelProps={{
                      sx: { fontSize: { xs: "15px", md: "13.5px" } }
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        fontSize: { xs: "16px", md: "14px" }, // 16px input on mobile prevents auto-zoom
                        minHeight: { xs: "48px", md: "44px" }, // >= 44px touch target
                      },
                      "& .MuiInputBase-input": {
                        textAlign: isRTLMode ? 'right' : 'left',
                        py: { xs: 1.5, md: 1.25 }
                      },
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
                    size="medium"
                    dir={isRTLMode ? 'rtl' : 'ltr'}
                    inputProps={{ dir: isRTLMode ? 'rtl' : 'ltr' }}
                    InputLabelProps={{
                      sx: { fontSize: { xs: "15px", md: "13.5px" } }
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        fontSize: { xs: "16px", md: "14px" }, // 16px input on mobile
                        minHeight: { xs: "48px", md: "44px" },
                      },
                      "& .MuiInputBase-input": {
                        textAlign: isRTLMode ? 'right' : 'left',
                        py: { xs: 1.5, md: 1.25 }
                      },
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
                    size="medium"
                    dir={isRTLMode ? 'rtl' : 'ltr'}
                    inputProps={{ dir: isRTLMode ? 'rtl' : 'ltr' }}
                    InputLabelProps={{
                      sx: { fontSize: { xs: "15px", md: "13.5px" } }
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        fontSize: { xs: "16px", md: "14px" }, // 16px input on mobile
                        minHeight: { xs: "48px", md: "44px" },
                      },
                      "& .MuiInputBase-input": {
                        textAlign: isRTLMode ? 'right' : 'left',
                        py: { xs: 1.5, md: 1.25 }
                      },
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
                    size="medium"
                    placeholder={t('messagePlaceholder')}
                    dir={isRTLMode ? 'rtl' : 'ltr'}
                    inputProps={{ dir: isRTLMode ? 'rtl' : 'ltr' }}
                    InputLabelProps={{
                      sx: { fontSize: { xs: "15px", md: "13.5px" } }
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        fontSize: { xs: "16px", md: "14px" }, // 16px input on mobile
                        minHeight: { xs: "96px", md: "84px" },
                        p: { xs: 1.5, md: 1.25 },
                      },
                      "& .MuiInputBase-input": {
                        textAlign: isRTLMode ? 'right' : 'left'
                      },
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
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <Send sx={{ fontSize: { xs: 18, md: 16 }, transform: isRTLMode ? 'scaleX(-1)' : 'none' }} />
                      )
                    }
                    sx={{
                      backgroundColor: brand,
                      color: "#fff",
                      borderRadius: "12px",
                      textTransform: "none",
                      fontFamily: theme.custom?.font?.body || "inherit",
                      fontWeight: 650,
                      fontSize: { xs: "16px", md: "14px" }, // 16px button on mobile, md:14px
                      minHeight: { xs: "48px", md: "44px" }, // >= 44px touch height
                      py: { xs: 1.25, md: 1 },
                      boxShadow: 'none',
                      transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
                      "&:hover": {
                        backgroundColor: brand,
                        filter: "brightness(0.92)",
                        boxShadow: `0 4px 14px ${alpha(brand, 0.32)}`,
                        transform: 'translateY(-1px)',
                      },
                      "&:active": {
                        transform: 'translateY(1px)',
                      },
                      "&:disabled": {
                        backgroundColor: alpha(ink, 0.08),
                        color: alpha(ink, 0.35)
                      },
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
            py: { xs: 2, md: 1.75 },
            px: { xs: 2.5, md: 3 },
            backgroundColor: alpha(ink, isDark ? 0.03 : 0.015),
            direction: isRTLMode ? 'rtl' : 'ltr',
            justifyContent: isRTLMode ? 'flex-start' : 'flex-end',
          }}
        >
          <Button
            onClick={() => setShowHelpDialog(false)}
            variant="outlined"
            sx={{
              ...ghostButtonSx,
              minHeight: { xs: "44px", md: "40px" },
              px: 3,
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

