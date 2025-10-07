import React, { useState } from 'react';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Button,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import HomeIcon from '@mui/icons-material/Home';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminHeaderProps {
  onMenuClick: () => void;
  onThemeToggle?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, onThemeToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { toggleColorMode } = useThemeContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    setAnchorEl(null);
  };

  const handleHomeClick = () => {
    navigate('/');
    handleProfileMenuClose();
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAdminDashboardClick = () => {
    navigate('/admin/dashboard');
    handleProfileMenuClose();
  };

  const drawerWidth = 240;

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: {
            xs: '100%',
            md: `calc(100% - ${drawerWidth}px)`
          },
          ml: {
            md: `${drawerWidth}px`
          },
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 1, sm: 2 }
        }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onMenuClick}
              sx={{ 
                mr: 1,
                display: { md: 'none' }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: '#8B5CF6',
                borderRadius: '50%',
                width: 32,
                height: 32,
                justifyContent: 'center',
                mr: 1
              }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>F</Typography>
              </Box>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                noWrap 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
                }}
              >
                FlowTrainer Admin
              </Typography>

              {!isSmallScreen && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  ml: { xs: 2, sm: 4 },
                  color: theme.palette.text.secondary
                }}>
                  <Typography variant="body2">Admin</Typography>
                  <ChevronRightIcon sx={{ fontSize: '1rem', mx: 0.5 }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Dashboard</Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          {/* Center Section - Empty now */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            alignItems: 'center', 
            justifyContent: 'center',
            flexGrow: 1,
            mx: 2
          }}>
          </Box>
          
          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* User Profile and Logout - Similar to main page */}
            <div className="flex items-center space-x-2">
              {user && (
                <>
                  <div className="relative">
                    <button
                      className="flex items-center space-x-2 focus:outline-none"
                      onClick={handleProfileMenuOpen}
                      style={{ 
                        width: 32, 
                        height: 32, 
                        backgroundColor: '#8B5CF6', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    >
                      <span>{user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}</span>
                    </button>
                    
                    {/* Profile Dropdown Menu */}
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleProfileMenuClose}
                      PaperProps={{
                        elevation: 3,
                        sx: {
                          mt: 1,
                          minWidth: 200,
                        }
                      }}
                    >
                      <div style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: theme.palette.text.primary }}>
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: theme.palette.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user?.email}
                        </p>
                      </div>
                      <MenuItem onClick={handleHomeClick}>
                        <HomeIcon sx={{ mr: 1, fontSize: '1rem' }} />
                        Home
                      </MenuItem>
                      <Divider />
                      {/* Admin menu items for admin users - Only show if not on dashboard */}
                      {user && (user.role === 'admin' || user.role === 'super-admin') && location.pathname !== '/admin/dashboard' && (
                        <>
                          <MenuItem onClick={handleAdminDashboardClick}>
                            Admin Dashboard
                          </MenuItem>
                          <Divider />
                        </>
                      )}
                      <MenuItem onClick={handleLogout}>
                        Logout
                      </MenuItem>
                    </Menu>
                  </div>
                </>
              )}
            </div>
            
            {/* Theme toggle icon - using the same icon as in main header */}
            <IconButton 
              sx={{ ml: 1 }} 
              onClick={onThemeToggle || toggleColorMode} 
              color="inherit"
              title="Toggle theme"
            >
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default AdminHeader;