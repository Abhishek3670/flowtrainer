import React from 'react';
import { Typography, Container, Box, Paper, Tabs, Tab, TextField, Button, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Divider } from '@mui/material';
import { Save as SaveIcon, Notifications as NotificationsIcon, Security as SecurityIcon, Code as ApiIcon } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SettingsPage: React.FC = () => {
  const [value, setValue] = React.useState(0);
  const [settings, setSettings] = React.useState({
    notifications: {
      email: true,
      push: true,
      weeklyReport: true,
      securityAlerts: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordComplexity: 'medium',
    },
    api: {
      enableApiAccess: false,
      apiKey: 'sk_****************',
      rateLimit: 100,
    },
  });

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // TODO: Implement settings save
    console.log('Saving settings:', settings);
  };

  const handleRegenerateApiKey = () => {
    // TODO: Implement API key regeneration
    console.log('Regenerating API key...');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={value}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="settings tabs"
        >
          <Tab icon={<NotificationsIcon />} label="Notifications" {...a11yProps(0)} />
          <Tab icon={<SecurityIcon />} label="Security" {...a11yProps(1)} />
          <Tab icon={<ApiIcon />} label="API" {...a11yProps(2)} />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TabPanel value={value} index={0}>
          <Typography variant="h6" gutterBottom>Notification Settings</Typography>
          <Box sx={{ display: 'grid', gap: 2, maxWidth: 600 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.email}
                  onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.push}
                  onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                />
              }
              label="Push Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.weeklyReport}
                  onChange={(e) => handleSettingChange('notifications', 'weeklyReport', e.target.checked)}
                />
              }
              label="Weekly Report"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.securityAlerts}
                  onChange={(e) => handleSettingChange('notifications', 'securityAlerts', e.target.checked)}
                />
              }
              label="Security Alerts"
            />
          </Box>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Typography variant="h6" gutterBottom>Security Settings</Typography>
          <Box sx={{ display: 'grid', gap: 3, maxWidth: 600 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                />
              }
              label="Two-Factor Authentication"
            />
            
            <FormControl fullWidth>
              <InputLabel id="password-complexity-label">Password Complexity</InputLabel>
              <Select
                labelId="password-complexity-label"
                value={settings.security.passwordComplexity}
                label="Password Complexity"
                onChange={(e) => handleSettingChange('security', 'passwordComplexity', e.target.value)}
              >
                <MenuItem value="low">Low (minimum 6 characters)</MenuItem>
                <MenuItem value="medium">Medium (minimum 8 characters with numbers)</MenuItem>
                <MenuItem value="high">High (minimum 10 characters with numbers and symbols)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Session Timeout (minutes)"
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value) || 0)}
              inputProps={{ min: 1, max: 1440 }}
              fullWidth
            />
          </Box>
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Typography variant="h6" gutterBottom>API Settings</Typography>
          <Box sx={{ display: 'grid', gap: 3, maxWidth: 800 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.api.enableApiAccess}
                  onChange={(e) => handleSettingChange('api', 'enableApiAccess', e.target.checked)}
                />
              }
              label="Enable API Access"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>API Key</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  value={settings.api.apiKey}
                  disabled
                  variant="outlined"
                  size="small"
                  fullWidth
                />
                <Button
                  variant="outlined"
                  onClick={handleRegenerateApiKey}
                  color="warning"
                >
                  Regenerate
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Keep your API key secure and do not share it publicly.
              </Typography>
            </Box>

            <TextField
              label="Rate Limit (requests per minute)"
              type="number"
              value={settings.api.rateLimit}
              onChange={(e) => handleSettingChange('api', 'rateLimit', parseInt(e.target.value) || 0)}
              inputProps={{ min: 10, max: 1000 }}
              fullWidth
              disabled={!settings.api.enableApiAccess}
            />
          </Box>
        </TabPanel>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          size="large"
        >
          Save Changes
        </Button>
      </Box>
    </Container>
  );
};

export default SettingsPage;
