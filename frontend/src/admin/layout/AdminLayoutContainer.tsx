import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import AdminHeader from '../components/layout/AdminHeader';
import AdminSidebar from '../components/layout/AdminSidebar';
import { useThemeContext } from '../context/ThemeContext';

interface AdminLayoutContainerProps {
  children: React.ReactNode;
}

const AdminLayoutContainer: React.FC<AdminLayoutContainerProps> = ({ children }) => {
  const theme = useTheme();
  const { toggleColorMode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Close drawer when screen size changes to mobile
  React.useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const drawerWidth = 240;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Header */}
      <AdminHeader 
        onMenuClick={handleDrawerToggle} 
        onThemeToggle={toggleColorMode}
      />
      
      {/* Sidebar */}
      <AdminSidebar 
        mobileOpen={mobileOpen} 
        onClose={handleDrawerToggle}
      />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: {
            xs: '100%',
            sm: `calc(100% - ${drawerWidth}px)`,
            md: mobileOpen ? '100%' : `calc(100% - ${drawerWidth}px)`
          },
          marginTop: `${theme.mixins.toolbar.minHeight}px`,
          marginLeft: {
            xs: 0,
            sm: 0,
            md: mobileOpen ? 0 : `${drawerWidth}px`
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          [theme.breakpoints.up('md')]: {
            ...(mobileOpen && {
              marginLeft: 0,
              width: '100%',
            }),
          },
        }}
      >
        {/* Add a responsive container for content */}
        <Box sx={{ 
          maxWidth: '100%',
          mx: 'auto',
          width: {
            xs: '100%',
            sm: '100%',
            md: isTablet ? '100%' : '100%',
            lg: '100%',
            xl: '100%'
          }
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayoutContainer;