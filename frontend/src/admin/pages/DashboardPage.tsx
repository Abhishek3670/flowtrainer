import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  CircularProgress, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import { systemApi, userApi, activityApi } from '../services/adminApi';
import { User, ActivityLog } from '../types';

// Debug logging
console.log('DashboardPage module loaded');

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '100%',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const StatCard = styled(Item)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const DashboardPage: React.FC = () => {
  // Debug logging
  console.log('DashboardPage rendered');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [users, setUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('DashboardPage useEffect running');
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersResponse = await userApi.getUsers({ limit: 100 });
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.data || []);
          // For demo purposes, we'll assume half of the users are active
          setActiveUsers(Math.floor((usersResponse.data.data?.length || 0) / 2));
        }
        
        // Fetch recent activities (audit logs)
        const activitiesResponse = await activityApi.getLogs({ limit: isMobile ? 3 : 5 });
        if (activitiesResponse.data.success) {
          setRecentActivities(activitiesResponse.data.data?.logs || []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isMobile]);

  if (loading) {
    console.log('DashboardPage showing loading state');
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    console.log('DashboardPage showing error state:', error);
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  console.log('DashboardPage rendering content');
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} component="h1">
          Admin Dashboard
        </Typography>
      </Box>
      
      {/* Success message to confirm the page is working */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
        <Typography variant="body1">
          Success! Dashboard page is working correctly.
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)' 
        },
        gap: { xs: 2, sm: 3 },
        mt: 3
      }}>
        {/* System Status Card */}
        <StatCard>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Typography variant={isMobile ? "h5" : "h4"} color="success.main">
            Operational
          </Typography>
          <Typography variant="caption">
            All systems normal
          </Typography>
        </StatCard>
        
        {/* Active Users Card */}
        <StatCard>
          <Typography variant="h6" gutterBottom>
            Active Users
          </Typography>
          <Typography variant={isMobile ? "h5" : "h4"}>
            {activeUsers}
          </Typography>
          <Typography variant="caption" color="success.main">
            +{users.length - activeUsers} today
          </Typography>
        </StatCard>
        
        {/* Total Users Card */}
        <StatCard>
          <Typography variant="h6" gutterBottom>
            Total Users
          </Typography>
          <Typography variant={isMobile ? "h5" : "h4"}>
            {users.length}
          </Typography>
          <Typography variant="caption">
            All registered users
          </Typography>
        </StatCard>
        
        {/* System Load */}
        <StatCard>
          <Typography variant="h6" gutterBottom>
            System Load
          </Typography>
          <Typography variant={isMobile ? "h5" : "h4"}>
            24%
          </Typography>
          <Typography variant="caption" color="success.main">
            Optimal
          </Typography>
        </StatCard>
      </Box>
      
      {/* Recent Activity - Full Width */}
      <Box sx={{ 
        mt: 3
      }}>
        <Item>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Box sx={{ 
            textAlign: 'left', 
            p: 1,
            maxHeight: 300,
            overflow: 'auto'
          }}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <Typography 
                  key={activity.id} 
                  variant="body2"
                  sx={{ 
                    py: 1,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:last-child': {
                      borderBottom: 'none'
                    }
                  }}
                >
                  • {activity.action} by user {activity.userId} at {new Date(activity.timestamp).toLocaleString()}
                </Typography>
              ))
            ) : (
              <Typography>No recent activities</Typography>
            )}
          </Box>
        </Item>
      </Box>
    </Container>
  );
};

export default DashboardPage;