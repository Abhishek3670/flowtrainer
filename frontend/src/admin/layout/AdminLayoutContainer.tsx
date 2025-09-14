import React from 'react';
import { Box } from '@mui/material';
import AdminHeader from '../components/layout/AdminHeader';
import AdminSidebar from '../components/layout/AdminSidebar';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useThemeContext } from '../context/ThemeContext';

interface AdminLayoutContainerProps {
  children: React.ReactNode;
}

const AdminLayoutContainer: React.FC<AdminLayoutContainerProps> = ({ children }) => {
  const theme = useTheme();
  const { toggleColorMode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Close drawer when screen size changes to mobile
  React.useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    } else {
      setMobileOpen(true);
    }
  }, [isMobile]);

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
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${theme.spacing(30)})` },
          marginTop: theme.mixins.toolbar.minHeight,
          marginLeft: { sm: theme.spacing(30) },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(mobileOpen && {
            [theme.breakpoints.down('md')]: {
              marginLeft: 0,
              width: '100%',
            },
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayoutContainer;
