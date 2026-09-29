import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  useTheme,
  Divider,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  GavelOutlined,
  FactCheckOutlined,
  MonetizationOnOutlined,
  ShieldOutlined,
  SearchOffOutlined,
  WarningAmberOutlined,
  EmailOutlined,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';

const Disclaimer = () => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === 'ar';

  const sections = [
    {
      title: t('disclaimerPlatformRoleTitle'),
      content: t('disclaimerPlatformRoleText'),
      icon: <GavelOutlined color="primary" sx={{ fontSize: 28 }} />,
    },
    {
      title: t('disclaimerContentAccuracyTitle'),
      content: t('disclaimerContentAccuracyText'),
      icon: <FactCheckOutlined color="primary" sx={{ fontSize: 28 }} />,
    },
    {
      title: t('disclaimerRewardsTitle'),
      content: t('disclaimerRewardsText'),
      icon: <MonetizationOnOutlined color="primary" sx={{ fontSize: 28 }} />,
    },
    {
      title: t('disclaimerSafetyTitle'),
      content: t('disclaimerSafetyText'),
      icon: <ShieldOutlined color="primary" sx={{ fontSize: 28 }} />,
    },
    {
      title: t('disclaimerNoGuaranteeTitle'),
      content: t('disclaimerNoGuaranteeText'),
      icon: <SearchOffOutlined color="primary" sx={{ fontSize: 28 }} />,
    },
    {
      title: t('disclaimerLiabilityTitle'),
      content: t('disclaimerLiabilityText'),
      icon: <WarningAmberOutlined color="warning" sx={{ fontSize: 28 }} />,
    },
    {
      title: t('disclaimerLegalContactTitle'),
      content: t('disclaimerLegalContactText'),
      icon: <EmailOutlined color="primary" sx={{ fontSize: 28 }} />,
    },
  ];

  return (
    <>
      <SeoMeta pageKey="disclaimer" />
      <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
        <Navbar />
        <Box
          sx={{
            pt: { xs: '6rem', sm: '7.5rem' },
            pb: 6,
            minHeight: '80vh',
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Container maxWidth="lg">
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 4, md: 5 },
                borderRadius: `${theme.custom.radius.lg}px`,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.custom.color.surfaceRaised,
                boxShadow: theme.custom.elevation.e2,
              }}
            >
              {/* Page Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 1.5,
                    fontSize: { xs: '1.85rem', md: '2.5rem' },
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {t('disclaimer')}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    maxWidth: 720,
                    mx: 'auto',
                    fontSize: { xs: '0.95rem', md: '1.1rem' },
                    lineHeight: 1.6,
                    mb: 2,
                  }}
                >
                  {t('disclaimerSubtitle')}
                </Typography>
                <Alert
                  severity="info"
                  sx={{
                    maxWidth: 820,
                    mx: 'auto',
                    textAlign: isRTL ? 'right' : 'left',
                    borderRadius: `${theme.custom.radius.md}px`,
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                  }}
                >
                  {t('disclaimerIntro')}
                </Alert>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Disclaimer Structured Cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 4 }}>
                {sections.map((section, idx) => (
                  <Card
                    key={idx}
                    elevation={0}
                    sx={{
                      borderRadius: `${theme.custom.radius.md}px`,
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'rgba(0, 0, 0, 0.01)',
                      transition: 'border-color 0.2s ease, transform 0.2s ease',
                      '&:hover': {
                        borderColor: theme.custom.color.brandPrimary,
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ flexShrink: 0, mt: 0.5 }}>{section.icon}</Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                              fontWeight: 700,
                              mb: 1,
                              fontSize: { xs: '1.05rem', sm: '1.2rem' },
                              color: theme.palette.text.primary,
                            }}
                          >
                            {section.title}
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{
                              lineHeight: 1.75,
                              fontSize: { xs: '0.92rem', sm: '0.98rem' },
                            }}
                          >
                            {section.content}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Navigation Back Link */}
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                <Button
                  component={Link}
                  to="/"
                  variant="outlined"
                  startIcon={isRTL ? <ArrowForward /> : <ArrowBack />}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                  }}
                >
                  {t('backToHome')}
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>
        <DashFooter />
      </Box>
    </>
  );
};

export default Disclaimer;
