import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  HomeOutlined,
  SearchOutlined,
  SentimentDissatisfiedOutlined,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';

const NotFoundPage = () => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === 'ar';

  const surfaceBase = theme.custom?.color?.surfaceBase || theme.palette.background.default;
  const surfaceRaised = theme.custom?.color?.surfaceRaised || theme.palette.background.paper;
  const radius = theme.custom?.radius?.lg ? `${theme.custom.radius.lg}px` : '16px';
  const elevation = theme.custom?.elevation?.e1 || '0 2px 8px rgba(0,0,0,0.08)';

  return (
    <>
      <SeoMeta
        title={t('seoPageNotFoundTitle')}
        description={t('seoPageNotFoundDescription')}
        path="/404"
        noindex
      />

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: surfaceBase,
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <Navbar />

        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pt: { xs: '6rem', sm: '7rem' },
            pb: { xs: 6, md: 8 },
            px: 2,
          }}
        >
          <Container maxWidth="sm">
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                borderRadius: radius,
                backgroundColor: surfaceRaised,
                boxShadow: elevation,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  mb: 3,
                }}
              >
                <SentimentDissatisfiedOutlined sx={{ fontSize: 56 }} />
              </Box>

              <Typography
                variant="h1"
                component="div"
                sx={{
                  fontSize: { xs: '3.5rem', sm: '4.5rem' },
                  fontWeight: 900,
                  letterSpacing: -1,
                  lineHeight: 1,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              >
                404
              </Typography>

              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  color: theme.palette.text.primary,
                }}
              >
                {t('pageNotFoundTitle')}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.secondary,
                  maxWidth: 420,
                  mx: 'auto',
                  mb: 4,
                  lineHeight: 1.6,
                }}
              >
                {t('pageNotFoundSubtitle')}
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  component={Link}
                  to="/"
                  variant="contained"
                  size="large"
                  startIcon={<HomeOutlined />}
                  sx={{
                    px: 3,
                    py: 1.25,
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  {t('pageNotFoundBackHome')}
                </Button>

                <Button
                  component={Link}
                  to="/dash/posts"
                  variant="outlined"
                  size="large"
                  startIcon={<SearchOutlined />}
                  sx={{
                    px: 3,
                    py: 1.25,
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  {t('pageNotFoundSearchListings')}
                </Button>
              </Stack>
            </Paper>
          </Container>
        </Box>

        <DashFooter />
      </Box>
    </>
  );
};

export default NotFoundPage;
