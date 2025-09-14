import React from 'react';
import { Box, Typography, Container, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '100%',
}));

const DashboardPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Box sx={{ flexGrow: 1, mt: 3 }}>
        <Grid container spacing={3}>
          {/* System Status Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Item>
              <Typography variant="h6">System Status</Typography>
              <Typography variant="h4" color="success.main">Operational</Typography>
              <Typography variant="caption">All systems normal</Typography>
            </Item>
          </Grid>
          
          {/* Active Users Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Item>
              <Typography variant="h6">Active Users</Typography>
              <Typography variant="h4">24</Typography>
              <Typography variant="caption" color="success.main">+5 today</Typography>
            </Item>
          </Grid>
          
          {/* API Response Time */}
          <Grid item xs={12} sm={6} md={3}>
            <Item>
              <Typography variant="h6">API Response</Typography>
              <Typography variant="h4">128ms</Typography>
              <Typography variant="caption" color="success.main">Good</Typography>
            </Item>
          </Grid>
          
          {/* System Load */}
          <Grid item xs={12} sm={6} md={3}>
            <Item>
              <Typography variant="h6">System Load</Typography>
              <Typography variant="h4">24%</Typography>
              <Typography variant="caption" color="success.main">Optimal</Typography>
            </Item>
          </Grid>
          
          {/* Recent Activity */}
          <Grid item xs={12} md={8}>
            <Item>
              <Typography variant="h6" gutterBottom>Recent Activity</Typography>
              <Box sx={{ textAlign: 'left', p: 1 }}>
                <Typography>• User 'admin' logged in</Typography>
                <Typography>• System configuration updated</Typography>
                <Typography>• New user 'johndoe' created</Typography>
              </Box>
            </Item>
          </Grid>
          
          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Item>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>• Add New User</Typography>
                <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>• View System Logs</Typography>
                <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>• Run System Check</Typography>
                <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>• Backup Database</Typography>
              </Box>
            </Item>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default DashboardPage;
