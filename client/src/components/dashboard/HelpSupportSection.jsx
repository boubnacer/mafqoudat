import React, { useState } from 'react';
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

const HelpSupportSection = () => {
  const theme = useTheme();
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [helpTab, setHelpTab] = useState(0);

  const faqItems = [
    {
      question: "How to report a lost item?",
      answer: "To report a lost item, go to the 'Report Lost Item' section on the dashboard and follow the instructions. You'll need to provide details about the item, its location, and any relevant information."
    },
    {
      question: "How to claim a found item?",
      answer: "To claim a found item, go to the 'Report Found Item' section on the dashboard and follow the instructions. You'll need to provide details about the item and its location."
    },
    {
      question: "What information do I need?",
      answer: "When reporting a lost or found item, you'll need to provide details about the item, its location, and any relevant information. This helps us match you with the right finder or lost item."
    }
  ];

  const emergencyContacts = [
    {
      name: "Police",
      details: "911",
      icon: <Phone />,
      action: "Call",
      actionIcon: <Send />
    },
    {
      name: "Support",
      details: "24/7",
      icon: <Phone />,
      action: "Call",
      actionIcon: <Send />
    },
    {
      name: "Email",
      details: "support@mafqoudat.com",
      icon: <Phone />,
      action: "Email",
      actionIcon: <Send />
    }
  ];

  const guidelines = [
    {
      title: "Be honest in your reports",
      description: "Always provide accurate and truthful information about your lost or found item."
    },
    {
      title: "Provide clear descriptions",
      description: "Use clear and detailed descriptions in your reports to help others identify the item."
    },
    {
      title: "Keep communication safe",
      description: "Use safe and appropriate communication methods when interacting with others on the platform."
    }
  ];

  const videoTutorials = [
    {
      title: "How to Report a Lost Item",
      description: "Learn how to effectively report a lost item on Mafqoudat.",
      thumbnail: "https://example.com/thumbnail1.jpg"
    },
    {
      title: "How to Claim a Found Item",
      description: "Discover the steps to successfully claim a found item on Mafqoudat.",
      thumbnail: "https://example.com/thumbnail2.jpg"
    },
    {
      title: "Using Mafqoudat Safely",
      description: "Get tips on how to use Mafqoudat safely and effectively.",
      thumbnail: "https://example.com/thumbnail3.jpg"
    }
  ];

  return (
    <>
      <DashRecents cate="help" sx={{ mt: 4 }}>
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
            HELP & SUPPORT
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
            Get Help
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
                    <Typography variant="h6" color={theme.palette.text.primary}>FAQ</Typography>
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
                    sx={{ mt: 2 }}
                  >
                    View All FAQs
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
                    <Typography variant="h6" color={theme.palette.text.primary}>Emergency Contacts</Typography>
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
                        >
                          {contact.action}
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="error.contrastText">
                      For immediate assistance, please contact emergency services.
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
                    <Typography variant="h6" color={theme.palette.text.primary}>Guidelines</Typography>
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
                      Community Guidelines
                    </Typography>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Book />}
                      sx={{ mb: 1 }}
                    >
                      Read Guidelines
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Security />}
                    >
                      Safety Tips
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
          How Can We Help You?
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs value={helpTab} onChange={(e, newValue) => setHelpTab(newValue)}>
              <Tab label="Contact Support" />
              <Tab label="Live Chat" />
              <Tab label="Video Tutorials" />
            </Tabs>
            
            <Box sx={{ mt: 2 }}>
              {helpTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Contact Our Support Team
                  </Typography>
                  <TextField
                    fullWidth
                    label="Subject"
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={4}
                    margin="normal"
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Send Message
                  </Button>
                </Box>
              )}
              
              {helpTab === 1 && (
                <Box textAlign="center" py={4}>
                  <Chat sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Live Chat Coming Soon
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Our live chat feature is currently under development.
                    Please use the contact form for now.
                  </Typography>
                </Box>
              )}
              
              {helpTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Video Tutorials
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
          <Button onClick={() => setShowHelpDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HelpSupportSection; 