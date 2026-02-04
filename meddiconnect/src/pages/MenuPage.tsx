import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  Assessment as AssessmentIcon,
  Medication as MedicationIcon,
} from '@mui/icons-material';

const menuItems = [
  {
    title: 'Find Doctor',
    icon: <SearchIcon sx={{ fontSize: 40 }} />,
    description: 'Search and connect with healthcare professionals',
    path: '/find-doctor',
    color: '#2196f3',
  },
  {
    title: 'Appointments',
    icon: <CalendarIcon sx={{ fontSize: 40 }} />,
    description: 'Manage your medical appointments',
    path: '/appointments',
    color: '#4caf50',
  },
  {
    title: 'My Profile',
    icon: <PersonIcon sx={{ fontSize: 40 }} />,
    description: 'View and update your profile information',
    path: '/patient-profile',
    color: '#ff9800',
  },
  {
    title: 'Medical Records',
    icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
    description: 'Access your medical history and records',
    path: '/medical-records',
    color: '#9c27b0',
  },
  {
    title: 'Prescriptions',
    icon: <MedicationIcon sx={{ fontSize: 40 }} />,
    description: 'View and manage your prescriptions',
    path: '/prescriptions',
    color: '#f44336',
  },
  {
    title: 'Chat with Doctor',
    icon: <ChatIcon sx={{ fontSize: 40 }} />,
    description: 'Connect with your healthcare providers',
    path: '/chat',
    color: '#00bcd4',
  },
  {
    title: 'Nearby Hospitals',
    icon: <HospitalIcon sx={{ fontSize: 40 }} />,
    description: 'Find hospitals and emergency care centers',
    path: '/hospitals',
    color: '#795548',
  },
  {
    title: 'Settings',
    icon: <SettingsIcon sx={{ fontSize: 40 }} />,
    description: 'Manage your account settings',
    path: '/settings',
    color: '#607d8b',
  },
];

const MenuPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to MeddieConnect
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Access your healthcare services and manage your medical needs
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(item.path)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${item.color}15`,
                    mb: 2,
                  }}
                >
                  <Box sx={{ color: item.color }}>{item.icon}</Box>
                </Box>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MenuPage; 