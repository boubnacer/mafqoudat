import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Report Lost Item",
      description: "Can't find something? Report it here",
      action: () => navigate('/dash/posts/new?type=lost')
    },
    {
      title: "Report Found Item",
      description: "Found something? Help return it",
      action: () => navigate('/dash/posts/new?type=found')
    },
    {
      title: "Search Items",
      description: "Look for lost or found items",
      action: () => navigate('/dash/search')
    },
    {
      title: "Get Help",
      description: "Need assistance? We're here to help",
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