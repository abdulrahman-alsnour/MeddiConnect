import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFindDoctor = () => {
    console.log('Find Doctor button clicked');
    navigate('/find-doctor', { replace: true });
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    setDrawerOpen(false);
    navigate('/', { replace: true });
  };

  const getMenuItems = () => {
    if (user?.type === 'patient') {
      return [
        { text: 'Dashboard', icon: <HomeIcon />, path: '/patient-dashboard' },
        { text: 'Find Doctor', icon: <SearchIcon />, path: '/find-doctor' },
        { text: 'My Profile', icon: <PersonIcon />, path: '/patient-profile' },
        { text: 'Appointments', icon: <CalendarIcon />, path: '/patient-appointments' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
      ];
    } else if (user?.type === 'doctor') {
      return [
        { text: 'Dashboard', icon: <HomeIcon />, path: '/doctor-dashboard' },
        { text: 'My Patients', icon: <PersonIcon />, path: '/doctor-patients' },
        { text: 'Appointments', icon: <CalendarIcon />, path: '/doctor-appointments' },
        { text: 'My Profile', icon: <PersonIcon />, path: '/doctor-profile' },
        { text: 'Availability', icon: <CalendarIcon />, path: '/doctor/availability' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/doctor-settings' },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

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
    <AppBar 
      position="fixed"
      sx={{
        transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        {isAuthenticated && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: { xs: 1, sm: 2 } }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          component={RouterLink}
          to={
            isAuthenticated
              ? user?.type === 'patient'
                ? '/patient-dashboard'
                : user?.type === 'doctor'
                ? '/doctor-dashboard'
                : user?.type === 'admin'
                ? '/admin/dashboard'
                : '/'
              : '/'
          }
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          MeddieConnect
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
          {isAuthenticated ? (
            <>
              <IconButton color="inherit" sx={{ p: { xs: 0.5, sm: 1 } }}>
                <NotificationsIcon />
              </IconButton>
              <IconButton
                onClick={handleMenu}
                size="small"
                sx={{ ml: { xs: 0.5, sm: 2 } }}
                aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
              >
                <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}>M</Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={Boolean(anchorEl)}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleClose}>Profile</MenuItem>
                <MenuItem onClick={handleClose}>My Account</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={handleFindDoctor}
                startIcon={<SearchIcon />}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                  display: { xs: 'none', sm: 'flex' },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                Find Doctor
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/login"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}
              >
                Login
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/register"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                  display: { xs: 'none', sm: 'flex' }
                }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  toggleDrawer();
                }}
                sx={{ cursor: 'pointer' }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            <Divider />
            <ListItem
              onClick={handleLogout}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navigation; 