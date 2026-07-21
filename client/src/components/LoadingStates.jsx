import React from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Card,
  CardContent,
  Grid,
  useTheme,
  CircularProgress,
  Alert,
  Button,
  alpha,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  People,
  Help,
  EmojiEvents,
  Category,
  TaskAltOutlined,
  SearchOffOutlined,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTranslation } from '../utils/translations';

// Add CSS keyframes for loading animations (mirrorReflection from navbar)
const loadingStyles = `
@keyframes mirrorReflection {
  0% {
    left: 0px;
    opacity: 0;
    transform: translateY(-50%) skew(-15deg) scaleX(0.5);
  }
  15% {
    opacity: 1;
    transform: translateY(-50%) skew(-15deg) scaleX(1);
  }
  85% {
    left: 100%;
    opacity: 1;
    transform: translateY(-50%) skew(-15deg) scaleX(1);
  }
  100% {
    left: 100%;
    opacity: 0;
    transform: translateY(-50%) skew(-15deg) scaleX(0.5);
  }
}
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = loadingStyles;
  document.head.appendChild(styleSheet);
}

// Loading Skeleton for Dashboard Stats
export const DashboardStatsSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        </Grid>
      </Grid>
    </Box>
  );
};

// Loading Skeleton for Trending Item
export const TrendingItemSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: '100%' }}>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 1, mb: 2 }} />
        <Box sx={{ flex: 1, ml: { xs: 0, sm: 2 } }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="80%" height={16} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="70%" height={16} sx={{ mt: 1 }} />
        </Box>
      </Box>
    </Card>
  );
};

// Loading Skeleton for Recent Items
export const RecentItemsSkeleton = () => {
  return (
    <Grid container spacing={2}>
      {[1, 2, 3, 4].map((item) => (
        <Grid item xs={12} sm={6} md={3} key={item}>
          <Card>
            <Skeleton variant="rectangular" height={140} />
            <CardContent>
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="60%" height={16} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Empty State Component
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  variant = 'info' 
}) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        textAlign: 'center',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.02)' 
          : 'rgba(0,0,0,0.02)',
        borderRadius: 2,
        border: `1px dashed ${theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.1)' 
          : 'rgba(0,0,0,0.1)'}`,
      }}
    >
      <Icon
        sx={{
          fontSize: 64,
          color: theme.palette[variant].main,
          mb: 2,
          opacity: 0.7,
        }}
      />
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
        {description}
      </Typography>
      {action && action}
    </Box>
  );
};

// Loading State with Message
export const LoadingState = ({ message = "Loading...", size = "medium" }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        transition: 'background 0.3s',
      }}
    >
      <Box
        sx={{
          width: 150,
          height: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          <img
            src="/maflogoSVG.svg"
            alt="Loading..."
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 2
            }}
          />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '0px',
            width: '30px',
            height: '80%',
            background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4), transparent)',
            transform: 'translateY(-50%) skew(-15deg)',
            borderRadius: '2px',
            zIndex: 3,
            animation: 'mirrorReflection 1s ease-in-out infinite',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
            pointerEvents: 'none',
          }} />
        </div>
      </Box>
    </Box>
  );
};

// Error State
export const ErrorState = ({ 
  title = "Something went wrong", 
  message = "Please try again later",
  onRetry 
}) => {
  const theme = useTheme();
  
  return (
    <Alert 
      severity="error" 
      sx={{ 
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {message}
      </Typography>
      {        onRetry && (
          <Box sx={{ mt: 1 }}>
            <Button onClick={onRetry}>Try Again</Button>
          </Box>
        )}
    </Alert>
  );
};

// Dashboard Specific Empty States
export const DashboardEmptyStates = {
  NoPosts: ({ country, countriesData, onCreatePost }) => {
    const { t, currentLanguage } = useTranslation();
    
    // Get country name from countries data
    const getCountryName = () => {
      if (!country || !countriesData?.entities) {
        return t('noPostsInArea');
      }
      
      const countryEntity = countriesData.entities[country];
      if (!countryEntity) {
        return t('noPostsInArea');
      }
      
      // Get the appropriate name based on current language
      const countryName = countryEntity.names?.[currentLanguage] || 
                         countryEntity.labels?.[currentLanguage] || 
                         countryEntity.name || 
                         countryEntity.label || 
                         countryEntity.code;
      
      return countryName;
    };
    
    const countryName = getCountryName();
    const title = countryName ? t('noPostsInCountry', { countryName }) : t('noPostsFound');
    const description = countryName ? t('noPostsInCountryDescription', { countryName }) : t('noPostsInArea');
    
    return (
      <EmptyState
        icon={Search}
        title={title}
        description={description}
        action={
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button 
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onCreatePost && onCreatePost('lost')}
              sx={{
                borderRadius: '4px',
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
                boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
                color: '#fff !important',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                  boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
                  color: '#fff !important',
                },
                '& .MuiButton-startIcon': {
                  marginRight: currentLanguage === 'ar' ? 0 : '8px',
                  marginLeft: currentLanguage === 'ar' ? '8px' : 0,
                }
              }}
            >
              {t('reportLostItem')}
            </Button>
            <Button 
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => onCreatePost && onCreatePost('found')}
              sx={{
                borderRadius: '4px',
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#4A8BFF',
                color: '#4A8BFF',
                borderWidth: '2px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#3A7BEF',
                  backgroundColor: alpha('#4A8BFF', 0.05),
                  color: '#3A7BEF',
                  borderWidth: '2px',
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha('#4A8BFF', 0.2)}`,
                },
                '& .MuiButton-startIcon': {
                  marginRight: currentLanguage === 'ar' ? 0 : '8px',
                  marginLeft: currentLanguage === 'ar' ? '8px' : 0,
                }
              }}
            >
              {t('reportFoundItem')}
            </Button>
          </Box>
        }
      />
    );
  },
  
  NoTrending: () => {
    const { t } = useTranslation();
    return (
      <EmptyState
        icon={TrendingUp}
        title={t('noTrendingItems')}
        description={t('noTrendingItemsDescription')}
      />
    );
  },
  
  NoRecentFounds: ({ onCreatePost }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const tone = theme.custom.status.found;
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          px: 2,
          textAlign: 'center',
          borderRadius: `${theme.custom.radius.lg}px`,
          border: `1px dashed ${alpha(theme.custom.color.ink, 0.15)}`,
        }}
      >
        <TaskAltOutlined
          sx={{
            fontSize: 56,
            color: tone.main,
            mb: 2,
            opacity: 0.6,
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.custom.color.ink, mb: 1 }}>
          {t('noRecentFoundItems')}
        </Typography>
        <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.65), mb: 3, maxWidth: 360 }}>
          {t('noRecentFoundItemsDescription')}
        </Typography>
        {onCreatePost && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onCreatePost('found')}
            sx={{
              borderRadius: `${theme.custom.radius.md}px`,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              backgroundColor: tone.main,
              color: theme.palette.getContrastText(tone.main),
              '&:hover': { backgroundColor: tone.main, opacity: 0.9 },
            }}
          >
            {t('reportFoundItem')}
          </Button>
        )}
      </Box>
    );
  },

  NoRecentLosts: ({ onCreatePost }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const tone = theme.custom.status.lost;
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          px: 2,
          textAlign: 'center',
          borderRadius: `${theme.custom.radius.lg}px`,
          border: `1px dashed ${alpha(theme.custom.color.ink, 0.15)}`,
        }}
      >
        <SearchOffOutlined
          sx={{
            fontSize: 56,
            color: tone.main,
            mb: 2,
            opacity: 0.6,
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.custom.color.ink, mb: 1 }}>
          {t('noRecentLostItems')}
        </Typography>
        <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.65), mb: 3, maxWidth: 360 }}>
          {t('noRecentLostItemsDescription')}
        </Typography>
        {onCreatePost && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onCreatePost('lost')}
            sx={{
              borderRadius: `${theme.custom.radius.md}px`,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              backgroundColor: tone.main,
              color: theme.palette.getContrastText(tone.main),
              '&:hover': { backgroundColor: tone.main, opacity: 0.9 },
            }}
          >
            {t('reportLostItem')}
          </Button>
        )}
      </Box>
    );
  },
  
  NoSuccessStories: () => {
    const { t } = useTranslation();
    return (
      <EmptyState
        icon={EmojiEvents}
        title={t('noSuccessStories')}
        description={t('noSuccessStoriesDescription')}
      />
    );
  },
  
  NoCommunity: () => {
    const { t } = useTranslation();
    return (
      <EmptyState
        icon={People}
        title={t('communityIsQuiet')}
        description={t('communityIsQuietDescription')}
      />
    );
  },
  
  NoHelpContent: () => {
    const { t } = useTranslation();
    return (
      <EmptyState
        icon={Help}
        title={t('helpContentComingSoon')}
        description={t('helpContentComingSoonDescription')}
      />
    );
  },
  
  NoCategories: () => {
    const { t } = useTranslation();
    return (
      <EmptyState
        icon={Category}
        title={t('noCategoriesAvailable')}
        description={t('noCategoriesAvailableDescription')}
      />
    );
  },
};

// Search Specific Loading States
export const SearchLoadingStates = {
  Searching: () => {
    const { t } = useTranslation();
    return (
      <LoadingState 
        message={t('searchingForItems')} 
        size="small"
      />
    );
  },
  
  NoSearchResults: ({ query, onCreatePost }) => {
    const { t, currentLanguage } = useTranslation();
    
    return (
      <EmptyState
        icon={Search}
        title={t('noSearchResults')}
        description={t('noSearchResultsDescription', { query })}
        action={
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button 
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onCreatePost('lost')}
              sx={{
                borderRadius: '4px',
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
                boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
                color: '#fff !important',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                  boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
                  color: '#fff !important',
                },
                '& .MuiButton-startIcon': {
                  marginRight: currentLanguage === 'ar' ? 0 : '8px',
                  marginLeft: currentLanguage === 'ar' ? '8px' : 0,
                }
              }}
            >
              {t('reportLostItem')}
            </Button>
            <Button 
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => onCreatePost('found')}
              sx={{
                borderRadius: '4px',
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#4A8BFF',
                color: '#4A8BFF',
                borderWidth: '2px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#3A7BEF',
                  backgroundColor: alpha('#4A8BFF', 0.05),
                  color: '#3A7BEF',
                  borderWidth: '2px',
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha('#4A8BFF', 0.2)}`,
                },
                '& .MuiButton-startIcon': {
                  marginRight: currentLanguage === 'ar' ? 0 : '8px',
                  marginLeft: currentLanguage === 'ar' ? '8px' : 0,
                }
              }}
            >
              {t('reportFoundItem')}
            </Button>
          </Box>
        }
      />
    );
  },
};

export default {
  DashboardStatsSkeleton,
  TrendingItemSkeleton,
  RecentItemsSkeleton,
  EmptyState,
  LoadingState,
  ErrorState,
  DashboardEmptyStates,
  SearchLoadingStates,
}; 