import React from 'react';
import { Typography, Container, Box, Paper, Tabs, Tab, Button, Grid, Card, CardContent, CardActions, Divider, Chip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PlayArrow as RunIcon } from '@mui/icons-material';

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
      id={`model-tabpanel-${index}`}
      aria-labelledby={`model-tab-${index}`}
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
    id: `model-tab-${index}`,
    'aria-controls': `model-tabpanel-${index}`,
  };
}

// Mock model data - replace with real data from your API
const models = [
  {
    id: 'model-1',
    name: 'Sentiment Analysis',
    version: '1.0.2',
    status: 'active',
    lastTrained: '2023-05-10',
    accuracy: 92.5,
    type: 'nlp',
  },
  {
    id: 'model-2',
    name: 'Image Classifier',
    version: '2.1.0',
    status: 'training',
    lastTrained: '2023-05-12',
    accuracy: 87.3,
    type: 'cv',
  },
  {
    id: 'model-3',
    name: 'Recommendation Engine',
    version: '0.9.5',
    status: 'inactive',
    lastTrained: '2023-04-28',
    accuracy: 78.9,
    type: 'recommendation',
  },
];

const ModelsConfigPage: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleEditModel = (modelId: string) => {
    // TODO: Implement model editing
    console.log('Edit model:', modelId);
  };

  const handleDeleteModel = (modelId: string) => {
    // TODO: Implement model deletion
    console.log('Delete model:', modelId);
  };

  const handleRunModel = (modelId: string) => {
    // TODO: Implement model execution
    console.log('Run model:', modelId);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Models Configuration</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add New Model
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="model configuration tabs"
        >
          <Tab label="All Models" {...a11yProps(0)} />
          <Tab label="Active" {...a11yProps(1)} />
          <Tab label="In Development" {...a11yProps(2)} />
          <Tab label="Archived" {...a11yProps(3)} />
        </Tabs>
      </Paper>

      <TabPanel value={value} index={0}>
        <Grid container spacing={3}>
          {models.map((model) => (
            <Grid item xs={12} sm={6} md={4} key={model.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {model.name}
                    </Typography>
                    <Chip 
                      label={model.status} 
                      size="small" 
                      color={model.status === 'active' ? 'success' : model.status === 'training' ? 'warning' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    v{model.version} • {model.type.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Last trained: {model.lastTrained}<br />
                    Accuracy: {model.accuracy}%
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                  <Button 
                    size="small" 
                    startIcon={<RunIcon />}
                    onClick={() => handleRunModel(model.id)}
                  >
                    Run
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => handleEditModel(model.id)}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteModel(model.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
      
      {/* Other tab panels would go here */}
      <TabPanel value={value} index={1}>
        <Typography>Active models will be listed here</Typography>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Typography>Models in development will be listed here</Typography>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Typography>Archived models will be listed here</Typography>
      </TabPanel>
    </Container>
  );
};

export default ModelsConfigPage;
