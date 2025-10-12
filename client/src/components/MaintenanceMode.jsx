import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
  alpha,
  CircularProgress,
  Fade,
  styled,
  keyframes
} from '@mui/material';
import {
  Build as BuildIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useTranslation } from '../utils/translations';

// Pulsing animation for the icon
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Floating animation for decorative elements
const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
`;

// Rotating animation for the circular progress
const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Main container with full viewport and gradient background
const MaintenanceContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  width: '100vw',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #1a1a2e 75%, #0a0a0a 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #764ba2 75%, #667eea 100%)',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 9999,
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: theme.palette.mode === 'dark'
      ? 'radial-gradient(circle, rgba(74, 139, 255, 0.1) 0%, transparent 50%)'
      : 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
    animation: `${rotate} 30s linear infinite`,
  }
}));

// Content card with glassmorphism effect
const MaintenanceCard = styled(Paper)(({ theme }) => ({
  maxWidth: '600px',
  width: '90%',
  padding: theme.spacing(6, 4),
  borderRadius: theme.spacing(3),
  textAlign: 'center',
  position: 'relative',
  zIndex: 1,
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.8)
    : alpha('#ffffff', 0.9),
  backdropFilter: 'blur(20px)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
    : '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 3),
  }
}));

// Logo container with animation
const LogoContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  animation: `${float} 3s ease-in-out infinite`,
  '& img': {
    maxWidth: '200px',
    height: 'auto',
    filter: theme.palette.mode === 'dark' ? 'brightness(1.2)' : 'none',
  },
  [theme.breakpoints.down('sm')]: {
    '& img': {
      maxWidth: '150px',
    }
  }
}));

// Icon wrapper with pulsing animation
const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.primary.main, 0.2)
    : alpha(theme.palette.primary.main, 0.1),
  marginBottom: theme.spacing(3),
  animation: `${pulse} 2s ease-in-out infinite`,
  '& .MuiSvgIcon-root': {
    fontSize: '40px',
    color: theme.palette.mode === 'dark'
      ? theme.palette.primary.light
      : theme.palette.primary.main,
  }
}));

// Progress indicator wrapper
const ProgressWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(2),
}));

// Decorative dots
const DecorativeDot = styled(Box)(({ theme, delay = 0 }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: theme.palette.mode === 'dark'
    ? theme.palette.primary.light
    : theme.palette.primary.main,
  animation: `${pulse} 1.5s ease-in-out infinite`,
  animationDelay: `${delay}s`,
}));

const MaintenanceMode = () => {
  const theme = useTheme();
  const { currentLanguage } = useTranslation();

  // Multilingual maintenance messages
  const messages = {
    en: {
      title: "We're currently performing scheduled maintenance",
      subtitle: "We'll be back soon! Thank you for your patience.",
      estimatedReturn: "Estimated return: Soon",
      updating: "Updating and improving..."
    },
    fr: {
      title: "Nous effectuons actuellement une maintenance planifiée",
      subtitle: "Nous serons de retour bientôt ! Merci pour votre patience.",
      estimatedReturn: "Retour estimé : Bientôt",
      updating: "Mise à jour et amélioration..."
    },
    ar: {
      title: "نحن نقوم حاليًا بصيانة مجدولة",
      subtitle: "سنعود قريباً! شكراً لصبركم.",
      estimatedReturn: "العودة المقدرة: قريباً",
      updating: "جارٍ التحديث والتحسين..."
    }
  };

  const content = messages[currentLanguage] || messages.en;
  const isRTL = currentLanguage === 'ar';

  return (
    <MaintenanceContainer>
      <Fade in timeout={800}>
        <Container maxWidth="md">
          <MaintenanceCard elevation={24}>
            {/* Logo */}
            <LogoContainer>
              <img 
                src="/maflogo.png" 
                alt="Mafqoudat Logo" 
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </LogoContainer>

            {/* Maintenance Icon */}
            <IconWrapper>
              <BuildIcon />
            </IconWrapper>

            {/* Main Title */}
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === 'dark'
                  ? theme.palette.text.primary
                  : theme.palette.grey[800],
                mb: 2,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                direction: isRTL ? 'rtl' : 'ltr',
                textAlign: 'center',
              }}
            >
              {content.title}
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === 'dark'
                  ? theme.palette.text.secondary
                  : theme.palette.grey[600],
                mb: 4,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                fontWeight: 400,
                direction: isRTL ? 'rtl' : 'ltr',
                textAlign: 'center',
              }}
            >
              {content.subtitle}
            </Typography>

            {/* Progress Indicator */}
            <ProgressWrapper>
              <CircularProgress
                size={24}
                thickness={4}
                sx={{
                  color: theme.palette.mode === 'dark'
                    ? theme.palette.primary.light
                    : theme.palette.primary.main,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === 'dark'
                    ? theme.palette.text.secondary
                    : theme.palette.grey[600],
                  fontWeight: 500,
                  direction: isRTL ? 'rtl' : 'ltr',
                }}
              >
                {content.updating}
              </Typography>
            </ProgressWrapper>

            {/* Decorative animated dots */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
                mb: 3,
              }}
            >
              <DecorativeDot delay={0} />
              <DecorativeDot delay={0.2} />
              <DecorativeDot delay={0.4} />
            </Box>

            {/* Estimated Return */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mt: 3,
                p: 2,
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.primary.main, 0.05),
              }}
            >
              <ScheduleIcon
                sx={{
                  fontSize: '20px',
                  color: theme.palette.mode === 'dark'
                    ? theme.palette.primary.light
                    : theme.palette.primary.main,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === 'dark'
                    ? theme.palette.text.primary
                    : theme.palette.grey[700],
                  fontWeight: 600,
                  direction: isRTL ? 'rtl' : 'ltr',
                }}
              >
                {content.estimatedReturn}
              </Typography>
            </Box>

            {/* Decorative bottom line */}
            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop: `1px solid ${alpha(
                  theme.palette.divider,
                  theme.palette.mode === 'dark' ? 0.2 : 0.1
                )}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.text.secondary, 0.7)
                    : alpha(theme.palette.grey[600], 0.8),
                  fontSize: '0.75rem',
                }}
              >
                Mafqoudat © {new Date().getFullYear()}
              </Typography>
            </Box>
          </MaintenanceCard>
        </Container>
      </Fade>
    </MaintenanceContainer>
  );
};

export default MaintenanceMode;

