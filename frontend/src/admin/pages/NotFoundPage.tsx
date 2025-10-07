import React from 'react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Debug logging
  console.log('NotFoundPage rendered for path:', location.pathname);
  console.log('Full location object:', location);

  // Check if this is actually the dashboard route that should exist
  const isDashboardRoute = location.pathname === '/admin/dashboard';
  console.log('Is this the dashboard route?', isDashboardRoute);

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 8, textAlign: 'center', mt: 8 }}>
        <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'text.secondary' }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Current path: {location.pathname}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Full location: {JSON.stringify(location)}
        </Typography>
        {isDashboardRoute && (
          <Typography variant="body2" color="error" paragraph>
            ERROR: This should be the dashboard route but it's showing as not found!
          </Typography>
        )}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none' }}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/admin/dashboard')}
            sx={{ textTransform: 'none' }}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;