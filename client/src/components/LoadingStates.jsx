import React from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Paper,
  Card,
  CardContent,
  Grid,
  useTheme,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  People,
  Help,
  EmojiEvents,
  Category,
  LocationOn,
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
  NoPosts: ({ country, onCreatePost }) => (
    <EmptyState
      icon={Search}
      title="No posts found"
      description={`There are no lost or found items in ${country || 'this country'} yet. Be the first to post!`}
      action={
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => onCreatePost && onCreatePost('lost')}
          >
            Report Lost Item
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => onCreatePost && onCreatePost('found')}
          >
            Report Found Item
          </Button>
        </Box>
      }
    />
  ),
  
  NoTrending: () => (
    <EmptyState
      icon={TrendingUp}
      title="No trending items"
      description="There are no trending items at the moment. Check back later!"
    />
  ),
  
  NoRecentFounds: () => (
    <EmptyState
      icon={WhatshotOutlined}
      title="No recent found items"
      description="No items have been found recently. Keep an eye out for new posts!"
    />
  ),
  
  NoRecentLosts: () => (
    <EmptyState
      icon={Search}
      title="No recent lost items"
      description="No items have been reported as lost recently."
    />
  ),
  
  NoSuccessStories: () => (
    <EmptyState
      icon={EmojiEvents}
      title="No success stories yet"
      description="Be the first to share a success story when you find or return an item!"
    />
  ),
  
  NoCommunity: () => (
    <EmptyState
      icon={People}
      title="Community is quiet"
      description="The community is just getting started. Be the first to engage!"
    />
  ),
  
  NoHelpContent: () => (
    <EmptyState
      icon={Help}
      title="Help content coming soon"
      description="We're working on helpful resources. Check back soon!"
    />
  ),
  
  NoCategories: () => (
    <EmptyState
      icon={Category}
      title="No categories available"
      description="Categories are being set up. Please check back later."
    />
  ),
};

// Search Specific Loading States
export const SearchLoadingStates = {
  Searching: () => (
    <LoadingState 
      message="Searching for items..." 
      size="small"
    />
  ),
  
  NoSearchResults: ({ query, onCreatePost }) => (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No items found matching "${query}". Try different keywords or create a new post.`}
      action={
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => onCreatePost('lost')}>
            Report Lost Item
          </Button>
          <Button variant="outlined" onClick={() => onCreatePost('found')}>
            Report Found Item
          </Button>
        </Box>
      }
    />
  ),
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