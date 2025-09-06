import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../utils/translations";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../features/auth/authSlice";
import {
  AddCircleOutline,
  Search,
  HelpOutline,
  FindInPage
} from "@mui/icons-material";

const QuickActions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useSelector(selectCurrentToken);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const quickActions = [
    {
      title: t('reportLostItem'),
      description: t('reportLostItemDesc'),
      icon: <FindInPage sx={{ fontSize: '2rem' }} />,
      color: '#ff6b6b',
      action: () => {
        if (!token) {
          navigate('/login');
        } else {
          navigate('/dash/posts/new?type=lost');
        }
      }
    },
    {
      title: t('reportFoundItem'),
      description: t('reportFoundItemDesc'),
      icon: <AddCircleOutline sx={{ fontSize: '2rem' }} />,
      color: '#4ecdc4',
      action: () => {
        if (!token) {
          navigate('/login');
        } else {
          navigate('/dash/posts/new?type=found');
        }
      }
    },
    {
      title: t('searchItems'),
      description: t('searchItemsDesc'),
      icon: <Search sx={{ fontSize: '2rem' }} />,
      color: '#45b7d1',
      action: () => navigate('/dash/search')
    },
    {
      title: t('getHelp'),
      description: t('getHelpDesc'),
      icon: <HelpOutline sx={{ fontSize: '2rem' }} />,
      color: '#96ceb4',
      action: () => navigate('/dash/help')
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Section Title */}
      <Box sx={{ mb: 3, px: { xs: 1, sm: 0 } }}>
        <Typography 
          variant="h4" 
          component="h2"
          sx={{
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#2c3e50',
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            textAlign: { xs: 'center', sm: 'left' },
            mb: 1
          }}
        >
          {t('quickActions')}
        </Typography>
        <Typography 
          variant="body1" 
          sx={{
            color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#7f8c8d',
            fontSize: { xs: '0.9rem', sm: '1rem' },
            textAlign: { xs: 'center', sm: 'left' },
            maxWidth: '600px'
          }}
        >
          {t('quickActionsDesc')}
        </Typography>
      </Box>

      {/* Quick Actions Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                borderRadius: { xs: '12px', sm: '16px' },
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e0e0e0'}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)'
                  : '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { 
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
                    : '0 16px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.1)',
                },
                '&:active': {
                  transform: 'translateY(-4px) scale(0.98)',
                }
              }}
              onClick={action.action}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Icon */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: { xs: '60px', sm: '70px' },
                    height: { xs: '60px', sm: '70px' },
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${action.color}20, ${action.color}10)`,
                    border: `2px solid ${action.color}30`,
                    mb: 2,
                    mx: 'auto'
                  }}
                >
                  <Box sx={{ color: action.color }}>
                    {action.icon}
                  </Box>
                </Box>

                {/* Content */}
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#2c3e50',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      mb: 1,
                      lineHeight: 1.3
                    }}
                  >
                    {action.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#7f8c8d',
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {action.description}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuickActions; 