import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday,
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  MedicalServices,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface AppointmentNotification {
  id: number;
  type: 'appointment_request' | 'appointment_accepted' | 'appointment_rejected' | 'appointment_rescheduled';
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  description: string;
  createdAt: string;
  isRead: boolean;
}

interface AppointmentNotificationCardProps {
  notification: AppointmentNotification;
  onAction: (notificationId: number, action: 'accept' | 'reject' | 'reschedule') => void;
  userType: 'patient' | 'doctor';
}

const AppointmentNotificationCard: React.FC<AppointmentNotificationCardProps> = ({
  notification,
  onAction,
  userType,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'appointment_request':
        return <CalendarToday color="primary" />;
      case 'appointment_accepted':
        return <CheckCircle color="success" />;
      case 'appointment_rejected':
        return <Cancel color="error" />;
      case 'appointment_rescheduled':
        return <Schedule color="warning" />;
      default:
        return <CalendarToday />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'appointment_request':
        return 'primary';
      case 'appointment_accepted':
        return 'success';
      case 'appointment_rejected':
        return 'error';
      case 'appointment_rescheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getNotificationTitle = () => {
    switch (notification.type) {
      case 'appointment_request':
        return userType === 'doctor' 
          ? `New appointment request from ${notification.patientName}`
          : `Appointment request sent to Dr. ${notification.doctorName}`;
      case 'appointment_accepted':
        return `Appointment accepted by Dr. ${notification.doctorName}`;
      case 'appointment_rejected':
        return `Appointment rejected by Dr. ${notification.doctorName}`;
      case 'appointment_rescheduled':
        return `Appointment rescheduled by Dr. ${notification.doctorName}`;
      default:
        return 'Appointment notification';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 2, 
          opacity: notification.isRead ? 0.7 : 1,
          border: notification.isRead ? 'none' : '2px solid',
          borderColor: `${getNotificationColor()}.main`,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar sx={{ bgcolor: `${getNotificationColor()}.main` }}>
              {getNotificationIcon()}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {getNotificationTitle()}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Date:</strong> {formatDate(notification.appointmentDate)}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Time:</strong> {formatTime(notification.appointmentTime)}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Purpose:</strong> {notification.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={notification.type.replace('_', ' ').toUpperCase()}
                  color={getNotificationColor() as any}
                  size="small"
                />
                
                {!notification.isRead && (
                  <Chip
                    label="NEW"
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            {userType === 'doctor' && notification.type === 'appointment_request' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => onAction(notification.id, 'accept')}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => onAction(notification.id, 'reject')}
                >
                  Reject
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setDialogOpen(true)}
                >
                  Reschedule
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Reschedule Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reschedule Appointment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rescheduling and suggest new times.
          </Typography>
          {/* Add reschedule form fields here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              onAction(notification.id, 'reschedule');
              setDialogOpen(false);
            }}
          >
            Reschedule
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

interface AppointmentNotificationsProps {
  userType: 'patient' | 'doctor';
}

const AppointmentNotifications: React.FC<AppointmentNotificationsProps> = ({ userType }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  const mockNotifications: AppointmentNotification[] = [
    {
      id: 1,
      type: 'appointment_request',
      patientName: 'John Smith',
      doctorName: 'Dr. Sarah Johnson',
      appointmentDate: '2024-01-20',
      appointmentTime: '10:00',
      description: 'Regular checkup and blood pressure monitoring',
      createdAt: '2024-01-15T10:30:00Z',
      isRead: false,
    },
    {
      id: 2,
      type: 'appointment_accepted',
      patientName: 'Sarah Johnson',
      doctorName: 'Dr. Michael Chen',
      appointmentDate: '2024-01-21',
      appointmentTime: '14:30',
      description: 'Follow-up appointment for recent surgery',
      createdAt: '2024-01-16T09:15:00Z',
      isRead: true,
    },
    {
      id: 3,
      type: 'appointment_rejected',
      patientName: 'Mike Wilson',
      doctorName: 'Dr. Emily Davis',
      appointmentDate: '2024-01-22',
      appointmentTime: '11:15',
      description: 'Annual physical examination',
      createdAt: '2024-01-17T14:20:00Z',
      isRead: false,
    },
  ];

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Mock API call - replace with actual endpoint
        await new Promise(resolve => setTimeout(resolve, 1000));
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleNotificationAction = async (notificationId: number, action: 'accept' | 'reject' | 'reschedule') => {
    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update notification status
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, type: `appointment_${action}ed` as any }
            : notif
        )
      );
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Box>
      {unreadCount > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have {unreadCount} unread appointment notification{unreadCount > 1 ? 's' : ''}.
        </Alert>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No appointment notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You'll receive notifications when appointments are booked, accepted, or rescheduled.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        notifications.map((notification) => (
          <AppointmentNotificationCard
            key={notification.id}
            notification={notification}
            onAction={handleNotificationAction}
            userType={userType}
          />
        ))
      )}
    </Box>
  );
};

export default AppointmentNotifications;
