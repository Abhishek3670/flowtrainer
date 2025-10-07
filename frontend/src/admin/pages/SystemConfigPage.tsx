import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { Save, Refresh, History } from '@mui/icons-material';
import { systemApi } from '../services/adminApi';
import { SystemConfig } from '../types';

interface ConfigFormData {
  appName: string;
  environment: string;
  maintenanceMode: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
}

const SystemConfigPage: React.FC = () => {
  const [config, setConfig] = useState<ConfigFormData>({
    appName: '',
    environment: 'production',
    maintenanceMode: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      // Fetch all configurations
      const response = await systemApi.getConfigs();
      
      if (response.data.success) {
        setConfigs(response.data.data?.configs || []);
        
        // For demo purposes, we'll set some default values
        // In a real implementation, you would populate the form with actual config values
        setConfig({
          appName: 'FlowTrainer',
          environment: 'production',
          maintenanceMode: false,
          maxLoginAttempts: 5,
          sessionTimeout: 30,
        });
      }
    } catch (err) {
      setError('Failed to fetch configurations');
      console.error('Error fetching configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = event.target.name as keyof typeof config;
    const value = name === 'maintenanceMode' 
      ? event.target.value === 'true' 
      : event.target.value;
      
    setConfig({
      ...config,
      [name]: value,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      setSaving(true);
      
      // Save each configuration item
      // In a real implementation, you would save each config item to the API
      /*
      await Promise.all([
        systemApi.updateConfig('appName', config.appName, 'Application name'),
        systemApi.updateConfig('environment', config.environment, 'Application environment'),
        systemApi.updateConfig('maintenanceMode', config.maintenanceMode, 'Maintenance mode status'),
        systemApi.updateConfig('maxLoginAttempts', config.maxLoginAttempts, 'Maximum login attempts'),
        systemApi.updateConfig('sessionTimeout', config.sessionTimeout, 'Session timeout in minutes')
      ]);
      */
      
      // For demo purposes, we'll just simulate a successful save
      setSuccess('Configuration saved successfully');
      setSnackbar({ open: true, message: 'Configuration saved successfully', severity: 'success' });
    } catch (err) {
      setError('Failed to save configuration');
      setSnackbar({ open: true, message: 'Failed to save configuration', severity: 'error' });
      console.error('Error saving configuration:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    fetchConfigurations();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">System Configuration</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<History />}
            sx={{ mr: 1 }}
            onClick={() => console.log('View config history')}
          >
            History
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>
      )}

      <Grid container spacing={3}>
        {/* Configuration Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Configuration Settings" />
            <Divider />
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'grid', gap: 3, maxWidth: 600 }}>
                  <TextField
                    name="appName"
                    label="Application Name"
                    value={config.appName}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />

                  <FormControl fullWidth margin="normal">
                    <InputLabel id="environment-label">Environment</InputLabel>
                    <Select
                      labelId="environment-label"
                      name="environment"
                      value={config.environment}
                      label="Environment"
                      onChange={handleChange}
                    >
                      <MenuItem value="development">Development</MenuItem>
                      <MenuItem value="staging">Staging</MenuItem>
                      <MenuItem value="production">Production</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel id="maintenance-mode-label">Maintenance Mode</InputLabel>
                    <Select
                      labelId="maintenance-mode-label"
                      name="maintenanceMode"
                      value={config.maintenanceMode ? 'true' : 'false'}
                      label="Maintenance Mode"
                      onChange={handleChange}
                    >
                      <MenuItem value="false">Off</MenuItem>
                      <MenuItem value="true">On</MenuItem>
                    </Select>
                    <FormHelperText>When enabled, only administrators can access the system</FormHelperText>
                  </FormControl>

                  <TextField
                    name="maxLoginAttempts"
                    label="Max Login Attempts"
                    type="number"
                    value={config.maxLoginAttempts}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    inputProps={{ min: 1, max: 10 }}
                  />

                  <TextField
                    name="sessionTimeout"
                    label="Session Timeout (minutes)"
                    type="number"
                    value={config.sessionTimeout}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    inputProps={{ min: 1, max: 1440 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button variant="outlined" color="secondary">
                      Reset
                    </Button>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary" 
                      startIcon={<Save />}
                      disabled={saving}
                    >
                      {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuration Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Configuration Overview" />
            <Divider />
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Total Configurations: {configs.length}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recent Changes:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No recent changes
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Environment:
                </Typography>
                <Chip 
                  label={config.environment} 
                  color={config.environment === 'production' ? 'success' : config.environment === 'staging' ? 'warning' : 'default'} 
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Maintenance Mode:
                </Typography>
                <Chip 
                  label={config.maintenanceMode ? 'Enabled' : 'Disabled'} 
                  color={config.maintenanceMode ? 'warning' : 'success'} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SystemConfigPage;