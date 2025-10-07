import React from 'react';
import { Box, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useTheme, useMediaQuery } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import BuildIcon from '@mui/icons-material/Build';
import SecurityIcon from '@mui/icons-material/Security';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const drawerWidth = 240;

interface SidebarItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

const sidebarItems: SidebarItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Role Management', icon: <SecurityIcon />, path: '/admin/roles' },
  { text: 'Audit Logs', icon: <HistoryIcon />, path: '/admin/audit' },
  { text: 'System Metrics', icon: <AssessmentIcon />, path: '/admin/metrics' },
  { text: 'Database Management', icon: <StorageIcon />, path: '/admin/database' },
  { text: 'System Configuration', icon: <SettingsIcon />, path: '/admin/system' },
  { text: 'Models Configuration', icon: <BuildIcon />, path: '/admin/models' },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const drawer = (
    <div>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        px: 1
      }}>
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          noWrap 
          component="div"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ py: 0 }}>
        {sidebarItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={onClose}
              sx={{
                borderRadius: 2,
                my: 0.5,
                py: 1,
                minHeight: 48,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.contrastText,
                  },
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: 'inherit',
                  minWidth: 40
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  variant: 'body1',
                  fontWeight: 500
                }}
                sx={{
                  display: { xs: 'none', sm: 'block' }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="admin navigation"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawer}
      </Drawer>
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default AdminSidebar;