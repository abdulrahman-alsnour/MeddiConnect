import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import DoctorSidebar from './DoctorSidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';

interface DoctorLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const DoctorLayout: React.FC<DoctorLayoutProps> = ({ 
  children, 
  title = "Doctor Dashboard",
  subtitle = "Manage your practice and patient care"
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (user?.type !== 'doctor') {
      navigate('/doctor-login', { replace: true });
    }
  }, [user?.type, navigate]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
  };

  const handleProfile = () => {
    navigate('/doctor-profile');
    handleMenuClose();
  };

  const handleSettings = () => {
    navigate('/doctor-settings');
    handleMenuClose();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle scroll detection to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when at top of page
      if (currentScrollY < 10) {
        setShowNavbar(true);
      } 
      // Hide navbar when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setShowNavbar(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setShowNavbar(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top App Bar */}
      <AppBar 
        position="fixed"
        elevation={1}
        sx={{
          transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleSidebar}
            sx={{ mr: { xs: 1, sm: 2 } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '0.9rem', sm: '1.25rem' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            MediConnect {title}
          </Typography>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: '0.9rem',
              display: { xs: 'block', sm: 'none' }
            }}
          >
            MediConnect
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
            <Chip
              label="Doctor"
              color="secondary"
              size="small"
              icon={<DashboardIcon />}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            />
            
            {/* Notification Bell */}
            <NotificationBell />
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuClick}
              color="inherit"
            >
              <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, bgcolor: 'secondary.main' }}>
                {user?.username?.charAt(0).toUpperCase() || 'D'}
              </Avatar>
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleProfile}>
                <PersonIcon sx={{ mr: 1 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleSettings}>
                <SettingsIcon sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Add top padding to account for fixed AppBar */}
      <Box sx={{ height: 64 }} /> {/* AppBar height */}

      {/* Main Content */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2 }
        }}
      >
        <Box sx={{ mb: { xs: 2, sm: 4 } }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
          >
            {title}
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            {subtitle}
          </Typography>
        </Box>

        {/* Page Content */}
        {children}

        {/* Sidebar */}
        <DoctorSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </Container>
    </Box>
  );
};

export default DoctorLayout;
