import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  CheckCircle,
  Cancel,
  Schedule,
  MedicalServices,
  Notifications,
  Visibility,
  Videocam,
  PlayArrow,
  Refresh,
} from '@mui/icons-material';
import PatientLayout from '../components/PatientLayout';
import { useAuth } from '../context/AuthContext';
import { Appointment } from '../types/appointment';

const OnlineAppointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Track open popup windows
  const popupWindowRef = useRef<Window | null>(null);

  /**
   * Join video call for an appointment
   * Opens video call in a popup window so user can continue using the website
   * Only works if doctor has started the call (isCallActive = true)
   */
  const handleJoinCall = (appointment: Appointment) => {
    // Only allow joining confirmed appointments
    if (appointment.status !== 'confirmed') {
      setError('You can only join confirmed appointments.');
      return;
    }

    // Only allow joining if doctor has started the call
    if (!appointment.isCallActive) {
      setError('The doctor has not started the call yet. Please wait for the doctor to start the appointment.');
      return;
    }

    // Check if popup is already open
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      // Focus existing popup
      popupWindowRef.current.focus();
      return;
    }

    // Store appointment data in sessionStorage for the popup to access
    const appointmentData = {
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      isDoctor: false,
      patientName: appointment.patientName,
      doctorName: appointment.doctorName,
      token: user?.token,
    };
    sessionStorage.setItem(`videoCall_${appointment.id}`, JSON.stringify(appointmentData));

    // Open popup window with video call page
    const popupWidth = 1200;
    const popupHeight = 800;
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 2;

    const popup = window.open(
      `/video-call/${appointment.id}`,
      `videoCall_${appointment.id}`,
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no,status=no`
    );

    if (popup) {
      popupWindowRef.current = popup;
      
      // Clean up when popup closes
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          popupWindowRef.current = null;
          sessionStorage.removeItem(`videoCall_${appointment.id}`);
        }
      }, 1000);
    } else {
      setError('Popup blocked. Please allow popups for this site.');
    }
  };

  /**
   * Transform backend appointment data to frontend format
   * Filters to show only video call appointments from psychiatry doctors
   */
  const transformAppointment = (apt: any): Appointment => {
    const appointmentDateTime = new Date(apt.appointmentDateTime);
    const dateStr = appointmentDateTime.toISOString().split('T')[0];
    const timeStr = appointmentDateTime.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
    
    return {
      id: apt.id,
      patientId: apt.patientId,
      patientName: apt.patientName,
      patientEmail: apt.patientEmail,
      patientPhone: apt.patientPhone,
      doctorId: apt.doctorId,
      doctorName: apt.doctorName,
      doctorSpecialty: apt.doctorSpecialty,
      doctorEmail: apt.doctorEmail,
      doctorPhone: apt.doctorPhone,
      doctorProfilePicture: apt.doctorProfilePicture || undefined,
      date: dateStr,
      time: timeStr,
      description: apt.description || '',
      shareMedicalRecords: apt.shareMedicalRecords || false,
      isVideoCall: apt.isVideoCall || false,
      isCallActive: apt.isCallActive || false,
      status: apt.status?.toLowerCase() || 'pending',
      createdAt: apt.createdAt ? new Date(apt.createdAt).toISOString() : new Date().toISOString(),
      doctorNotes: apt.doctorNotes || undefined,
    };
  };

  const fetchAppointments = async (showLoading: boolean = true) => {
    if (!user?.token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/appointments/patient', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch appointments' }));
        throw new Error(errorData.message || 'Failed to fetch appointments');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        // Filter to show only video call appointments
        // These should only be from psychiatry doctors
        const videoCallAppointments = data.data
          .map((apt: any) => transformAppointment(apt))
          .filter((apt: Appointment) => apt.isVideoCall === true);
        
        setAppointments(videoCallAppointments);
      }
    } catch (error: any) {
      console.error('Error fetching online appointments:', error);
      setError(error.message || 'Failed to fetch online appointments');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Initial load only - no auto-refresh
    fetchAppointments(true);
  }, [user]);

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

  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'rescheduled':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle />;
      case 'cancelled':
        return <Cancel />;
      default:
        return <Schedule />;
    }
  };

  const openAppointmentDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const closeAppointmentDialog = () => {
    setDialogOpen(false);
    setSelectedAppointment(null);
  };

  if (loading) {
    return (
      <PatientLayout title="Online Appointments" subtitle="Your video call appointments with psychiatry doctors">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="Online Appointments" subtitle="Your video call appointments with psychiatry doctors">
      <Box>
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Header with Refresh Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Alert severity="info" sx={{ flex: 1 }}>
            <Typography variant="body1">
              This page shows your video call appointments with psychiatry doctors only.
              Click refresh to check if the doctor has started the call.
            </Typography>
          </Alert>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchAppointments(false)}
            sx={{ ml: 2, minWidth: 120 }}
          >
            Refresh
          </Button>
        </Box>

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Videocam sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Online Appointments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You don't have any video call appointments scheduled yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Schedule />}
              onClick={() => window.location.href = '/find-doctor'}
            >
              Find a Psychiatry Doctor
            </Button>
          </Paper>
        ) : (
          <List>
            {appointments.map((appointment, index) => (
              <React.Fragment key={appointment.id}>
                <ListItem>
                  <Avatar 
                    src={appointment.doctorProfilePicture}
                    sx={{ mr: 2, bgcolor: getStatusColor(appointment.status) + '.main' }}
                  >
                    {appointment.doctorName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="h6">{appointment.doctorName}</Typography>
                        <Chip
                          icon={getStatusIcon(appointment.status)}
                          label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          color={getStatusColor(appointment.status) as any}
                          size="small"
                        />
                        <Chip
                          icon={<Videocam />}
                          label="Video Call"
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {formatDate(appointment.date)} at {formatTime(appointment.time)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.description}
                        </Typography>
                        {appointment.doctorSpecialty && (
                          <Chip
                            label={appointment.doctorSpecialty}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* Join Call Button - Only show for confirmed appointments where doctor has started the call */}
                      {appointment.status === 'confirmed' && appointment.isCallActive && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<PlayArrow />}
                          onClick={() => handleJoinCall(appointment)}
                          size="small"
                        >
                          Join Call
                        </Button>
                      )}
                      {/* Show message if call not started yet */}
                      {appointment.status === 'confirmed' && !appointment.isCallActive && (
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                          Waiting for doctor to start...
                        </Typography>
                      )}
                      <IconButton onClick={() => openAppointmentDialog(appointment)}>
                        <Visibility />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < appointments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Appointment Detail Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={closeAppointmentDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedAppointment && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={selectedAppointment.doctorProfilePicture}>
                    {selectedAppointment.doctorName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedAppointment.doctorName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedAppointment.doctorSpecialty}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CalendarToday color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Date
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {formatDate(selectedAppointment.date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AccessTime color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Time
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {formatTime(selectedAppointment.time)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Videocam color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Appointment Type
                      </Typography>
                    </Box>
                    <Chip
                      icon={<Videocam />}
                      label="Video Call Appointment"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      You'll receive a meeting link before the appointment time.
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <MedicalServices color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Description
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {selectedAppointment.description || 'No description provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Chip
                      icon={getStatusIcon(selectedAppointment.status)}
                      label={selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                      color={getStatusColor(selectedAppointment.status) as any}
                      size="medium"
                    />
                  </Grid>
                  {selectedAppointment.doctorNotes && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Notifications color="primary" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Doctor's Notes
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {selectedAppointment.doctorNotes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={closeAppointmentDialog}>Close</Button>
                {/* Join Call Button in Dialog - Only for confirmed appointments where doctor has started the call */}
                {selectedAppointment.status === 'confirmed' && selectedAppointment.isCallActive && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={() => {
                      handleJoinCall(selectedAppointment);
                      closeAppointmentDialog();
                    }}
                  >
                    Join Call
                  </Button>
                )}
                {/* Show message if call not started yet */}
                {selectedAppointment.status === 'confirmed' && !selectedAppointment.isCallActive && (
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    Waiting for doctor to start the call...
                  </Typography>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </PatientLayout>
  );
};

export default OnlineAppointments;

