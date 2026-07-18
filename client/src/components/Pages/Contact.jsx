import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Schedule,
  Send,
  CheckCircle,
  Facebook,
  Instagram,
  WhatsApp,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import { useSubmitContactFormMutation } from '../../features/contact/contactApiSlice';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';

const Contact = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // RTK Query mutation hook
  const [submitContactForm, { isLoading, error }] = useSubmitContactFormMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    try {
      const result = await submitContactForm(formData).unwrap();
      
      // Success
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
      
    } catch (err) {
      // Handle different error types
      if (err.status === 429) {
        setSubmitError('Too many requests. Please wait a few minutes before submitting again.');
      } else if (err.status === 400) {
        setSubmitError(err.data?.message || 'Please check your input and try again.');
      } else if (err.status === 500) {
        setSubmitError('Server error. Please try again later.');
      } else {
        setSubmitError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const contactInfo = [
    {
      icon: <Email color="primary" />,
      title: t('emailUs'),
      details: 'team.mafqoudat@gmail.com',
      description: t('emailDescription'),
    },
    {
      icon: <Phone color="primary" />,
      title: t('callUs'),
      details: '+212 711 621 132',
      description: t('phoneDescription'),
    },
    {
      icon: <LocationOn color="primary" />,
      title: t('ourLocation'),
      details: t('servingMorocco'),
      description: t('locationDescription'),
    },
    {
      icon: <Schedule color="primary" />,
      title: t('businessHours'),
      details: t('available247'),
      description: t('hoursDescription'),
    },
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      icon: <Facebook />,
      url: 'https://www.facebook.com/profile.php?id=100075968495897',
      color: '#1877F2',
    },
    {
      name: 'Instagram',
      icon: <Instagram />,
      url: 'https://www.instagram.com/mafkoudat?igsh=d29saTdtajZ5dWpu',
      color: '#E4405F',
    },
    {
      name: 'WhatsApp',
      icon: <WhatsApp />,
      url: 'https://wa.me/212711621132',
      color: '#25D366',
    },
  ];

  return (
    <>
      <SeoMeta pageKey="contact" />
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
                  {t('contactUs')}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {t('getInTouch')}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: '800px', mx: 'auto', lineHeight: 1.7 }}
                >
                  {t('contactDescription')}
                </Typography>
              </Box>

              <Grid container spacing={4}>
                {/* Contact Form */}
                <Grid item xs={12} lg={8}>
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
                    <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: '600' }}>
                      {t('sendUsMessage')}
                    </Typography>

                    {isSubmitted && (
                      <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
                        {t('messageSentSuccessfully')}
                      </Alert>
                    )}

                    {submitError && (
                      <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
                        {submitError}
                      </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('yourName')}
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('yourEmail')}
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label={t('subject')}
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            required
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label={t('yourMessage')}
                            name="message"
                            multiline
                            rows={6}
                            value={formData.message}
                            onChange={handleInputChange}
                            required
                            variant="outlined"
                            placeholder={t('messagePlaceholder')}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                            sx={{
                              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                              },
                              '&:disabled': {
                                background: 'rgba(0, 0, 0, 0.12)',
                                color: 'rgba(0, 0, 0, 0.26)',
                              },
                            }}
                          >
                            {isLoading ? t('sending') : t('sendMessage')}
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                </Grid>

                {/* Contact Information */}
                <Grid item xs={12} lg={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Contact Info Cards */}
                    {contactInfo.map((info, index) => (
                      <Card
                        key={index}
                        sx={{
                          background: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.02)',
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Box sx={{ mr: 2 }}>
                              {info.icon}
                            </Box>
                            <Typography variant="h6" component="h3">
                              {info.title}
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: '600', mb: 1 }}>
                            {info.details}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {info.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Social Media */}
                    <Card
                      sx={{
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                          {t('followUs')}
                        </Typography>
                        <List dense>
                          {socialLinks.map((social, index) => (
                            <ListItem
                              key={index}
                              button
                              component="a"
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                borderRadius: 1,
                                mb: 1,
                                '&:hover': {
                                  backgroundColor: theme.palette.action.hover,
                                },
                              }}
                            >
                              <ListItemIcon sx={{ color: social.color }}>
                                {social.icon}
                              </ListItemIcon>
                              <ListItemText primary={social.name} />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>

                    {/* FAQ Link */}
                    <Card
                      sx={{
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(33, 150, 243, 0.1)' 
                          : 'rgba(33, 150, 243, 0.05)',
                        border: `1px solid ${theme.palette.primary.main}20`,
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                          {t('needHelp')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {t('faqDescription')}
                        </Typography>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => {
                            // Navigate to FAQ page
                            console.log('Navigate to FAQ');
                          }}
                        >
                          {t('viewFAQ')}
                        </Button>
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>
          <DashFooter />
        </Box>
      </Box>
    </>
  );
};

export default Contact;
