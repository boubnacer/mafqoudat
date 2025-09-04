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
} from '@mui/material';
import { useTranslation } from '../utils/translations';
import {
  Search,
  TrendingUp,
  People,
  Help,
  EmojiEvents,
  Category,
  WhatshotOutlined,
} from '@mui/icons-material';

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
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(30,30,30,0.15)'
            : 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(6px)',
        transition: 'background 0.3s',
      }}
    >
      <CircularProgress
        size={size === 'large' ? 48 : size === 'small' ? 24 : 32}
        sx={{ color: theme.palette.primary.main }}
      />
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
              onClick={() => onCreatePost && onCreatePost('lost')}
            >
              {t('reportLostItem')}
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => onCreatePost && onCreatePost('found')}
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
  
  NoRecentFounds: () => {
    const { t } = useTranslation();
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
          backgroundColor: 'transparent',
        }}
      >
        <WhatshotOutlined
          sx={{
            fontSize: 64,
            color: '#2196F3',
            mb: 2,
            opacity: 0.7,
          }}
        />
        <Typography variant="h6" gutterBottom>
          {t('noRecentFoundItems')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          {t('noRecentFoundItemsDescription')}
        </Typography>
      </Box>
    );
  },
  
  NoRecentLosts: () => {
    const { t } = useTranslation();
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
          backgroundColor: 'transparent',
        }}
      >
        <Search
          sx={{
            fontSize: 64,
            color: '#FFA500',
            mb: 2,
            opacity: 0.7,
          }}
        />
        <Typography variant="h6" gutterBottom>
          {t('noRecentLostItems')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          {t('noRecentLostItemsDescription')}
        </Typography>
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
    const { t } = useTranslation();
    
    return (
      <EmptyState
        icon={Search}
        title={t('noSearchResults')}
        description={t('noSearchResultsDescription', { query })}
        action={
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="contained" onClick={() => onCreatePost('lost')}>
              {t('reportLostItem')}
            </Button>
            <Button variant="outlined" onClick={() => onCreatePost('found')}>
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