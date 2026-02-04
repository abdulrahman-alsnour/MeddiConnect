import React, { useEffect, useState } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, Avatar, Menu, MenuItem, Chip, Container } from '@mui/material';
import { Menu as MenuIcon, Person as PersonIcon, Settings as SettingsIcon, Logout as LogoutIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PatientSidebar from './PatientSidebar';
import NotificationBell from './NotificationBell';

interface PatientLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const PatientLayout: React.FC<PatientLayoutProps> = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (user?.type !== 'patient') {
      navigate('/patient-login', { replace: true });
    }
  }, [user?.type, navigate]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => { logout(); navigate('/'); handleMenuClose(); };
  const handleProfile = () => { navigate('/patient-profile'); handleMenuClose(); };
  const handleSettings = () => { navigate('/patient-settings'); handleMenuClose(); };
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
            MediConnect Patient Dashboard
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
              label="Patient" 
              color="secondary" 
              size="small" 
              icon={<DashboardIcon />}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            />
            
            {/* Notification Bell */}
            <NotificationBell />
            
            <IconButton 
              onClick={handleMenuClick} 
              size="small" 
              sx={{ ml: { xs: 0.5, sm: 2 } }} 
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined} 
              aria-haspopup="true" 
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, bgcolor: 'secondary.main' }}>
                {user?.username?.charAt(0).toUpperCase() || 'P'}
              </Avatar>
            </IconButton>
            <Menu 
              id="account-menu" 
              anchorEl={anchorEl} 
              open={Boolean(anchorEl)} 
              onClose={handleMenuClose} 
              onClick={handleMenuClose} 
              transformOrigin={{ horizontal: 'right', vertical: 'top' }} 
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfile}><PersonIcon sx={{ mr: 1 }} />Profile</MenuItem>
              <MenuItem onClick={handleSettings}><SettingsIcon sx={{ mr: 1 }} />Settings</MenuItem>
              <MenuItem onClick={handleLogout}><LogoutIcon sx={{ mr: 1 }} />Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <PatientSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Add top padding to account for fixed AppBar */}
      <Box sx={{ height: 64 }} /> {/* AppBar height */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 4 }, 
          px: { xs: 1, sm: 2 },
          flexGrow: 1 
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
          {subtitle && (
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {children}
      </Container>
    </Box>
  );
};

export default PatientLayout;
