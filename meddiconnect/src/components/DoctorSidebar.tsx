import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  LocalHospital as HospitalIcon,
  Public as PublicIcon,
  Videocam as VideocamIcon,
  RateReview as FeedbackIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface DoctorSidebarProps {
  open: boolean;
  onClose: () => void;
}

const DoctorSidebar: React.FC<DoctorSidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/doctor-dashboard',
    },
    {
      title: 'My Profile',
      icon: <PersonIcon />,
      path: '/doctor-profile',
    },
    {
      title: 'Public Profile',
      icon: <PublicIcon />,
      path: '/doctor-public-profile',
    },
    {
      title: 'Appointments',
      icon: <CalendarIcon />,
      path: '/doctor-appointments',
    },
    {
      title: 'Schedule',
      icon: <ScheduleIcon />,
      path: '/doctor-schedule',
    },
    {
      title: 'Online Appointments',
      icon: <VideocamIcon />,
      path: '/doctor-online-appointments',
    },
    {
      title: 'Chat with Patients',
      icon: <ChatIcon />,
      path: '/doctor-chat',
    },
    {
      title: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/doctor-analytics',
    },
    {
      title: 'Feedback',
      icon: <FeedbackIcon />,
      path: '/doctor-feedback',
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/doctor-settings',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        width: 280,
        flexShrink: 0,
        zIndex: (theme) => theme.zIndex.drawer,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          top: '64px', // Start below the AppBar
          height: 'calc(100% - 64px)', // Full height minus AppBar
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, backgroundColor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
            {user?.username?.charAt(0).toUpperCase() || 'D'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Dr. {user?.username || 'Doctor'}
            </Typography>
            <Chip
              label="Healthcare Provider"
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '0.75rem',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Menu Items */}
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.title} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isActive(item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? 'white' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: isActive(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Footer Actions */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              mx: 1,
              borderRadius: 2,
              mb: 0.5,
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default DoctorSidebar;
