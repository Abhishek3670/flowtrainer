import React from 'react';
import { Typography, Container, Box, Paper, TextField, Button, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';

const SystemConfigPage: React.FC = () => {
  // Mock configuration data - replace with real data from your API
  const [config, setConfig] = React.useState({
    appName: 'FlowTrainer',
    environment: 'production',
    maintenanceMode: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30, // minutes
  });

  const handleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = event.target.name as keyof typeof config;
    setConfig({
      ...config,
      [name]: event.target.value,
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implement save to API
    console.log('Saving configuration:', config);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        System Configuration
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
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
                onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.value === 'true' })}
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
              <Button type="submit" variant="contained" color="primary">
                Save Changes
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default SystemConfigPage;
