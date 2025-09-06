import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
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
  CardMedia,
  useTheme,
} from "@mui/material";
import { 
  Help, 
  Phone, 
  Security, 
  Book, 
  Chat, 
  VideoLibrary,
  ExpandMore,
  CheckCircle,
  Send
} from "@mui/icons-material";
import DashRecents from './DashRecents';
import { useTranslation } from "../../utils/translations";

const HelpSupportSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [helpTab, setHelpTab] = useState(0);

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

  const emergencyContacts = [
    {
      name: t('police'),
      details: "911",
      icon: <Phone />,
      action: t('call'),
      actionIcon: <Send />
    },
    {
      name: t('support'),
      details: t('support24_7'),
      icon: <Phone />,
      action: t('call'),
      actionIcon: <Send />
    },
    {
      name: t('email'),
      details: t('supportEmail'),
      icon: <Phone />,
      action: t('emailAction'),
      actionIcon: <Send />
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

  const videoTutorials = [
    {
      title: t('howToReportLostItemVideo'),
      description: t('howToReportLostItemVideoDesc'),
      thumbnail: "https://example.com/thumbnail1.jpg"
    },
    {
      title: t('howToClaimFoundItemVideo'),
      description: t('howToClaimFoundItemVideoDesc'),
      thumbnail: "https://example.com/thumbnail2.jpg"
    },
    {
      title: t('usingMafqoudatSafely'),
      description: t('usingMafqoudatSafelyDesc'),
      thumbnail: "https://example.com/thumbnail3.jpg"
    }
  ];

  return (
    <>
      <DashRecents cate="help" sx={{ mt: 4 }} data-section="help">
        <Box display="flex" alignItems="center" justifyContent="space-between" pt="1rem" px={2}>
          <Typography
            fontWeight="600"
            sx={{
              fontSize: "26px",
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t('helpAndSupport')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Help />}
            onClick={() => setShowHelpDialog(true)}
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
            }}
          >
            {t('getHelp')}
          </Button>
        </Box>

        <Box p={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
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
                    <Help sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color={theme.palette.text.primary}>{t('faq')}</Typography>
                  </Box>
                  <List>
                    {faqItems.map((item, index) => (
                      <Accordion 
                        key={index} 
                        sx={{ 
                          mb: 1, 
                          boxShadow: 'none',
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          sx={{
                            borderRadius: '4px',
                          }}
                        >
                          <Typography variant="subtitle1" color={theme.palette.text.primary}>{item.question}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" color={theme.palette.text.secondary}>
                            {item.answer}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </List>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Help />}
                    sx={{ 
                      mt: 2,
                      color: theme.palette.primary.main,
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.main,
                        color: '#fff',
                        borderColor: theme.palette.primary.main,
                      }
                    }}
                  >
                    {t('viewAllFaqs')}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
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
                    <Phone sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="h6" color={theme.palette.text.primary}>{t('emergencyContacts')}</Typography>
                  </Box>
                  <List>
                    {emergencyContacts.map((contact, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {contact.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={contact.name}
                          secondary={contact.details}
                          primaryTypographyProps={{ color: theme.palette.text.primary }}
                          secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={contact.actionIcon}
                          sx={{
                            color: theme.palette.error.main,
                            borderColor: theme.palette.error.main,
                            '&:hover': {
                              backgroundColor: theme.palette.error.main,
                              color: '#fff',
                              borderColor: theme.palette.error.main,
                            }
                          }}
                        >
                          {contact.action}
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="error.contrastText">
                      {t('immediateAssistance')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
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
                    <Security sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6" color={theme.palette.text.primary}>{t('guidelines')}</Typography>
                  </Box>
                  <List>
                    {guidelines.map((guideline, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={guideline.title}
                          secondary={guideline.description}
                          primaryTypographyProps={{ color: theme.palette.text.primary }}
                          secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color={theme.palette.text.primary}>
                      {t('communityGuidelines')}
                    </Typography>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Book />}
                      onClick={() => navigate('/guidelines')}
                      sx={{ 
                        mb: 1,
                        color: theme.palette.success.main,
                        borderColor: theme.palette.success.main,
                        '&:hover': {
                          backgroundColor: theme.palette.success.main,
                          color: '#fff',
                          borderColor: theme.palette.success.main,
                        }
                      }}
                    >
                      {t('readGuidelines')}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Security />}
                      onClick={() => navigate('/safety')}
                      sx={{
                        color: theme.palette.warning.main,
                        borderColor: theme.palette.warning.main,
                        '&:hover': {
                          backgroundColor: theme.palette.warning.main,
                          color: '#fff',
                          borderColor: theme.palette.warning.main,
                        }
                      }}
                    >
                      {t('safetyTips')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DashRecents>

      {/* Help Dialog */}
      <Dialog
        open={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('howCanWeHelpYou')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs value={helpTab} onChange={(e, newValue) => setHelpTab(newValue)}>
              <Tab label={t('contactSupport')} />
              <Tab label={t('liveChat')} />
              <Tab label={t('videoTutorials')} />
            </Tabs>
            
            <Box sx={{ mt: 2 }}>
              {helpTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('contactOurSupportTeam')}
                  </Typography>
                  <TextField
                    fullWidth
                    label={t('subject')}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label={t('message')}
                    multiline
                    rows={4}
                    margin="normal"
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {t('sendMessage')}
                  </Button>
                </Box>
              )}
              
              {helpTab === 1 && (
                <Box textAlign="center" py={4}>
                  <Chat sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('liveChatComingSoon')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('liveChatComingSoonDesc')}
                  </Typography>
                </Box>
              )}
              
              {helpTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('videoTutorials')}
                  </Typography>
                  <Grid container spacing={2}>
                    {videoTutorials.map((tutorial, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="140"
                            image={tutorial.thumbnail}
                            alt={tutorial.title}
                          />
                          <CardContent>
                            <Typography variant="h6">{tutorial.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {tutorial.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelpDialog(false)}>{t('close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HelpSupportSection; 