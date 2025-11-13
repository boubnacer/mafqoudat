import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
} from '@mui/material';
import {
  ExpandMore,
  Search,
  Help,
  QuestionAnswer,
  Book,
  VideoLibrary,
  Phone,
  Email,
  Chat,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';

const HelpCenter = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAccordion, setExpandedAccordion] = useState(false);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const faqCategories = [
    {
      category: t('gettingStarted'),
      icon: <Help color="primary" />,
      questions: [
        {
          question: t('faq1Question'),
          answer: t('faq1Answer'),
        },
        {
          question: t('faq2Question'),
          answer: t('faq2Answer'),
        },
        {
          question: t('faq3Question'),
          answer: t('faq3Answer'),
        },
      ],
    },
    {
      category: t('reportingItems'),
      icon: <QuestionAnswer color="primary" />,
      questions: [
        {
          question: t('faq4Question'),
          answer: t('faq4Answer'),
        },
        {
          question: t('faq5Question'),
          answer: t('faq5Answer'),
        },
        {
          question: t('faq6Question'),
          answer: t('faq6Answer'),
        },
      ],
    },
    {
      category: t('safetySecurity'),
      icon: <Book color="primary" />,
      questions: [
        {
          question: t('faq7Question'),
          answer: t('faq7Answer'),
        },
        {
          question: t('faq8Question'),
          answer: t('faq8Answer'),
        },
        {
          question: t('faq9Question'),
          answer: t('faq9Answer'),
        },
      ],
    },
    {
      category: t('accountSettings'),
      icon: <VideoLibrary color="primary" />,
      questions: [
        {
          question: t('faq10Question'),
          answer: t('faq10Answer'),
        },
        {
          question: t('faq11Question'),
          answer: t('faq11Answer'),
        },
        {
          question: t('faq12Question'),
          answer: t('faq12Answer'),
        },
      ],
    },
  ];

  const helpTopics = [
    {
      title: t('howToReportLost'),
      description: t('howToReportLostDesc'),
      icon: <Help />,
      category: t('tutorials'),
    },
    {
      title: t('howToReportFound'),
      description: t('howToReportFoundDesc'),
      icon: <QuestionAnswer />,
      category: t('tutorials'),
    },
    {
      title: t('safetyGuidelines'),
      description: t('safetyGuidelinesDesc'),
      icon: <Book />,
      category: t('safety'),
    },
    {
      title: t('photoTips'),
      description: t('photoTipsDesc'),
      icon: <VideoLibrary />,
      category: t('tips'),
    },
  ];

  const contactOptions = [
    {
      title: t('liveChat'),
      description: t('liveChatDesc'),
      icon: <Chat color="primary" />,
      action: t('startChat'),
    },
    {
      title: t('emailSupport'),
      description: t('emailSupportDesc'),
      icon: <Email color="primary" />,
      action: t('sendEmail'),
    },
    {
      title: t('phoneSupport'),
      description: t('phoneSupportDesc'),
      icon: <Phone color="primary" />,
      action: t('callNow'),
    },
  ];

  return (
    <>
      <SeoMeta pageKey="help" />
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
                  {t('helpCenter')}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {t('helpCenterSubtitle')}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: '800px', mx: 'auto', lineHeight: 1.7 }}
                >
                  {t('helpCenterDescription')}
                </Typography>
              </Box>

              {/* Search Bar */}
              <Box mb={4}>
                <TextField
                  fullWidth
                  placeholder={t('searchHelp')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>

              {/* Help Topics */}
              <Box mb={6}>
                <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: '600' }}>
                  {t('popularTopics')}
                </Typography>
                <Grid container spacing={3}>
                  {helpTopics.map((topic, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card
                        sx={{
                          height: '100%',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[8],
                          },
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Box sx={{ mr: 2, color: theme.palette.primary.main }}>
                              {topic.icon}
                            </Box>
                            <Chip label={topic.category} size="small" color="primary" />
                          </Box>
                          <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: '600' }}>
                            {topic.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {topic.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* FAQ Section */}
              <Box mb={6}>
                <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: '600' }}>
                  {t('frequentlyAskedQuestions')}
                </Typography>
                
                {faqCategories.map((category, categoryIndex) => (
                  <Box key={categoryIndex} mb={3}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box sx={{ mr: 2 }}>
                        {category.icon}
                      </Box>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: '600' }}>
                        {category.category}
                      </Typography>
                    </Box>
                    
                    {category.questions.map((faq, faqIndex) => (
                      <Accordion
                        key={faqIndex}
                        expanded={expandedAccordion === `${categoryIndex}-${faqIndex}`}
                        onChange={handleAccordionChange(`${categoryIndex}-${faqIndex}`)}
                        sx={{
                          mb: 1,
                          '&:before': {
                            display: 'none',
                          },
                          boxShadow: theme.shadows[1],
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          sx={{
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.02)',
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: '500' }}>
                            {faq.question}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {faq.answer}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                ))}
              </Box>

              {/* Contact Support */}
              <Box>
                <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: '600' }}>
                  {t('stillNeedHelp')}
                </Typography>
                <Grid container spacing={3}>
                  {contactOptions.map((option, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card
                        sx={{
                          height: '100%',
                          textAlign: 'center',
                          background: theme.palette.mode === 'dark' 
                            ? 'rgba(33, 150, 243, 0.1)' 
                            : 'rgba(33, 150, 243, 0.05)',
                          border: `1px solid ${theme.palette.primary.main}20`,
                        }}
                      >
                        <CardContent>
                          <Box sx={{ mb: 2 }}>
                            {option.icon}
                          </Box>
                          <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: '600' }}>
                            {option.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {option.description}
                          </Typography>
                          <Button variant="outlined" fullWidth>
                            {option.action}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Container>
          </Box>
          <DashFooter />
        </Box>
      </Box>
    </>
  );
};

export default HelpCenter;
