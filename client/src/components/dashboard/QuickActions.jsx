import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../utils/translations";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../features/auth/authSlice";

const QuickActions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useSelector(selectCurrentToken);

  const quickActions = [
    {
      title: t('reportLostItem'),
      description: t('reportLostItemDesc'),
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
      action: () => navigate('/dash/search')
    },
    {
      title: t('getHelp'),
      description: t('getHelpDesc'),
      action: () => navigate('/dash/help')
    }
  ];

  return (
    <Box m="0 1rem" mb="2rem">
      <Grid container spacing={2}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'scale(1.02)' },
                transition: 'transform 0.2s'
              }}
              onClick={action.action}
            >
              <CardContent>
                <Typography variant="h6">{action.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuickActions; 