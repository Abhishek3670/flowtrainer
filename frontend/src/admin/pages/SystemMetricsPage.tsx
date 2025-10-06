import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
  Box,
  Paper,
  Grid,
  LinearProgress,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import { 
  Memory, 
  Storage, 
  Speed, 
  Cloud, 
  CheckCircle, 
  Error, 
  Warning 
} from '@mui/icons-material';
import { systemApi } from '../services/adminApi';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  responseTime: number;
  uptime: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    database: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      latency?: number;
    };
    cache: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      latency?: number;
    };
    storage: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      freeSpace?: string;
    };
  };
}

const SystemMetricsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 24,
    memoryUsage: 42,
    diskUsage: 65,
    networkLatency: 12,
    responseTime: 48,
    uptime: '12 days, 4 hours'
  });
  
  const [health, setHealth] = useState<SystemHealth>({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    components: {
      database: {
        status: 'healthy',
        latency: 5
      },
      cache: {
        status: 'healthy',
        latency: 2
      },
      storage: {
        status: 'healthy',
        freeSpace: '245 GB'
      }
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Fetch system health
      try {
        // For now, we'll use mock data since the backend doesn't have real implementation
        // In a real implementation, you would call:
        // const healthResponse = await systemApi.getHealth();
        // setHealth(healthResponse.data);
      } catch (err) {
        console.error('Error fetching system health:', err);
      }
      
      // Fetch system metrics
      try {
        // For now, we'll use mock data since the backend doesn't have real implementation
        // In a real implementation, you would call:
        // const metricsResponse = await systemApi.getMetrics();
        // setMetrics(metricsResponse.data);
      } catch (err) {
        console.error('Error fetching system metrics:', err);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch system data');
      console.error('Error fetching system data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle color="success" />;
      case 'degraded': return <Warning color="warning" />;
      case 'unhealthy': return <Error color="error" />;
      default: return <CheckCircle />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">System Metrics & Health</Typography>
        <Button variant="outlined" onClick={fetchSystemData}>
          Refresh Data
        </Button>
      </Box>

      {/* System Health Status */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="System Health"
          subheader={`Last updated: ${new Date(health.timestamp).toLocaleString()}`}
        />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {getStatusIcon(health.status)}
            <Typography variant="h6" sx={{ ml: 1, textTransform: 'capitalize' }}>
              {health.status}
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getStatusIcon(health.components.database.status)}
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>Database</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Latency: {health.components.database.latency}ms
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getStatusIcon(health.components.cache.status)}
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>Cache</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Latency: {health.components.cache.latency}ms
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getStatusIcon(health.components.storage.status)}
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>Storage</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Free space: {health.components.storage.freeSpace}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Performance Metrics" />
        <CardContent>
          <Grid container spacing={3}>
            {/* CPU Usage */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Memory color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">CPU Usage</Typography>
                </Box>
                <Box sx={{ width: '100%', mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={metrics.cpuUsage} 
                    color={metrics.cpuUsage > 80 ? 'error' : metrics.cpuUsage > 60 ? 'warning' : 'primary'}
                    sx={{ height: 10, borderRadius: 5 }} 
                  />
                </Box>
                <Typography variant="h4">{metrics.cpuUsage}%</Typography>
              </Paper>
            </Grid>

            {/* Memory Usage */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Storage color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Memory Usage</Typography>
                </Box>
                <Box sx={{ width: '100%', mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={metrics.memoryUsage} 
                    color={metrics.memoryUsage > 80 ? 'error' : metrics.memoryUsage > 60 ? 'warning' : 'primary'}
                    sx={{ height: 10, borderRadius: 5 }} 
                  />
                </Box>
                <Typography variant="h4">{metrics.memoryUsage}%</Typography>
              </Paper>
            </Grid>

            {/* Disk Usage */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Storage color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Disk Usage</Typography>
                </Box>
                <Box sx={{ width: '100%', mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={metrics.diskUsage} 
                    color={metrics.diskUsage > 90 ? 'error' : metrics.diskUsage > 75 ? 'warning' : 'primary'}
                    sx={{ height: 10, borderRadius: 5 }} 
                  />
                </Box>
                <Typography variant="h4">{metrics.diskUsage}%</Typography>
              </Paper>
            </Grid>

            {/* Network Latency */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Cloud color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Network Latency</Typography>
                </Box>
                <Typography variant="h4">{metrics.networkLatency}ms</Typography>
                <Typography variant="body2" color="text.secondary">
                  Average response time
                </Typography>
              </Paper>
            </Grid>

            {/* API Response Time */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Speed color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">API Response</Typography>
                </Box>
                <Typography variant="h4">{metrics.responseTime}ms</Typography>
                <Typography variant="body2" color="text.secondary">
                  Current average
                </Typography>
              </Paper>
            </Grid>

            {/* System Uptime */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">System Uptime</Typography>
                </Box>
                <Typography variant="h4">{metrics.uptime}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Since last restart
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader title="System Actions" />
        <Divider />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" color="primary">
              Run Health Check
            </Button>
            <Button variant="outlined" color="secondary">
              Clear Cache
            </Button>
            <Button variant="outlined" color="info">
              Restart Services
            </Button>
            <Button variant="outlined" color="warning">
              Maintenance Mode
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SystemMetricsPage;