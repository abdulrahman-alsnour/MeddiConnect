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
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  CalendarToday as CalendarIcon,
  Chat as ChatIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface PatientSidebarProps {
  open: boolean;
  onClose: () => void;
}

const PatientSidebar: React.FC<PatientSidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/patient-dashboard',
    },
    {
      title: 'My Profile',
      icon: <PersonIcon />,
      path: '/patient-profile',
    },
    {
      title: 'Find Doctors',
      icon: <SearchIcon />,
      path: '/find-doctor',
    },
    {
      title: 'My Appointments',
      icon: <CalendarIcon />,
      path: '/patient-appointments',
    },
    {
      title: 'Online Appointments',
      icon: <VideocamIcon />,
      path: '/online-appointments',
    },
    {
      title: 'Chat with Doctors',
      icon: <ChatIcon />,
      path: '/patient-chat',
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/patient-settings',
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
            {user?.username?.charAt(0).toUpperCase() || 'P'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {user?.username || 'Patient'}
            </Typography>
            <Chip
              label="Patient"
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

export default PatientSidebar;
