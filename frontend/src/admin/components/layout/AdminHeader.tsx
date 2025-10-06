import React from 'react';
import { AppBar, Box, IconButton, Toolbar, Typography, useTheme, useMediaQuery, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircle from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import { useThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  onMenuClick: () => void;
  onThemeToggle?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, onThemeToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { toggleColorMode } = useThemeContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const drawerWidth = 240;

  return (
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
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
            }}
          >
            FlowTrainer Admin
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Home button to navigate to main page */}
          <Button
            startIcon={<HomeIcon />}
            onClick={handleHomeClick}
            sx={{ 
              mr: 2,
              color: theme.palette.text.primary,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Home
          </Button>
          
          {user && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mr: 1,
              px: 1,
              py: 0.5,
              borderRadius: 2,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }}>
              <AccountCircle sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  fontWeight: 500,
                  color: theme.palette.text.primary
                }}
              >
                {user.email}
              </Typography>
            </Box>
          )}
          
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
  );
};

export default AdminHeader;