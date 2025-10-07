import React from 'react';
import { Typography, Container, Box, Paper, Button, Grid, LinearProgress, Divider } from '@mui/material';
import { DataUsage, Storage, Speed, CloudUpload } from '@mui/icons-material';

const DatabaseManagementPage: React.FC = () => {
  // Mock database stats - replace with real data from your API
  const [dbStats, setDbStats] = React.useState({
    size: '2.4 GB',
    collections: 12,
    avgQueryTime: '4.2 ms',
    status: 'Connected',
    lastBackup: '2023-05-14 03:00:00',
    storageUsed: 45, // percentage
  });

  const handleBackup = () => {
    // TODO: Implement database backup
    console.log('Initiating database backup...');
  };

  const handleOptimize = () => {
    // TODO: Implement database optimization
    console.log('Optimizing database...');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Database Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Storage color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Database Size</Typography>
            </Box>
            <Typography variant="h4">{dbStats.size}</Typography>
            <Typography variant="body2" color="text.secondary">
              {dbStats.collections} collections
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Speed color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Performance</Typography>
            </Box>
            <Typography variant="h4">{dbStats.avgQueryTime}</Typography>
            <Typography variant="body2" color="text.secondary">
              Average query time
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DataUsage color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Storage Usage</Typography>
            </Box>
            <Box sx={{ width: '100%', mb: 1 }}>
              <LinearProgress variant="determinate" value={dbStats.storageUsed} sx={{ height: 10, borderRadius: 5 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {dbStats.storageUsed}% of storage used
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Database Actions
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>Create Backup</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create a complete backup of the database. Last backup: {dbStats.lastBackup}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<CloudUpload />}
                onClick={handleBackup}
              >
                Backup Now
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>Optimize Database</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Run optimization tasks to improve database performance
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={handleOptimize}
              >
                Optimize Now
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Database Operations
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
          Database operation log will be displayed here
        </Typography>
      </Paper>
    </Container>
  );
};

export default DatabaseManagementPage;
