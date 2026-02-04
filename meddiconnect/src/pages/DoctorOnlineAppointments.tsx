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
} from '@mui/icons-material';
import DoctorLayout from '../components/DoctorLayout';
import { useAuth } from '../context/AuthContext';
import { Appointment } from '../types/appointment';

const DoctorOnlineAppointments: React.FC = () => {
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
   * Start video call for an appointment
   * Opens video call in a popup window so user can continue using the website
   */
  const handleStartAppointment = async (appointment: Appointment) => {
    console.log('Start appointment clicked for:', appointment.id);
    
    // Only allow starting confirmed appointments
    if (appointment.status !== 'confirmed') {
      setError('You can only start confirmed appointments.');
      return;
    }

    // Check if popup is already open
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      // Focus existing popup
      popupWindowRef.current.focus();
      return;
    }

    try {
      // Call backend API to start the call
      const response = await fetch(`http://localhost:8080/appointments/${appointment.id}/start-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Failed to start call');
      }

      console.log('Call started successfully, opening popup window...');

      // Store appointment data in sessionStorage for the popup to access
      const appointmentData = {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        isDoctor: true,
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
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
    } catch (err: any) {
      console.error('Error starting call:', err);
      setError(err.message || 'Failed to start video call. Please try again.');
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8080/appointments/doctor', {
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
          // Transform and filter to show only video call appointments
          const transformedAppointments: Appointment[] = data.data.map((apt: any) => {
            const appointmentDateTime = new Date(apt.appointmentDateTime);
            const dateStr = appointmentDateTime.toISOString().split('T')[0];
            const timeStr = appointmentDateTime.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
            
            // Transform medical records if they exist
            let medicalRecords: any = undefined;
            if (apt.medicalRecords) {
              medicalRecords = {
                gender: apt.medicalRecords.gender || '',
                dateOfBirth: apt.medicalRecords.dateOfBirth ? new Date(apt.medicalRecords.dateOfBirth).toISOString().split('T')[0] : '',
                height: apt.medicalRecords.height,
                weight: apt.medicalRecords.weight,
                bloodType: apt.medicalRecords.bloodType,
                allergies: apt.medicalRecords.allergies,
                medicalConditions: apt.medicalRecords.medicalConditions,
                previousSurgeries: apt.medicalRecords.previousSurgeries,
                familyMedicalHistory: apt.medicalRecords.familyMedicalHistory,
                dietaryHabits: apt.medicalRecords.dietaryHabits,
                alcoholConsumption: apt.medicalRecords.alcoholConsumption,
                physicalActivity: apt.medicalRecords.physicalActivity,
                smokingStatus: apt.medicalRecords.smokingStatus,
                mentalHealthCondition: apt.medicalRecords.mentalHealthCondition,
                medications: apt.medicalRecords.medications || [],
                mentalHealthMedications: apt.medicalRecords.mentalHealthMedications || [],
                labResults: apt.medicalRecords.labResults || [],
              };
            }
            
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
              date: dateStr,
              time: timeStr,
              description: apt.description || '',
              shareMedicalRecords: apt.shareMedicalRecords || false,
              isVideoCall: apt.isVideoCall || false,
              isCallActive: apt.isCallActive || false,
              status: apt.status?.toLowerCase() || 'pending',
              createdAt: apt.createdAt ? new Date(apt.createdAt).toISOString() : new Date().toISOString(),
              doctorNotes: apt.doctorNotes || undefined,
              // Always include insurance information for doctors
              insuranceProvider: apt.insuranceProvider || undefined,
              insuranceNumber: apt.insuranceNumber || undefined,
              medicalRecords: medicalRecords,
            };
          });
          
          // Filter to show only video call appointments
          const videoCallAppointments = transformedAppointments.filter(
            (apt: Appointment) => apt.isVideoCall === true
          );
          
          setAppointments(videoCallAppointments);
        }
      } catch (error: any) {
        console.error('Error fetching online appointments:', error);
        setError(error.message || 'Failed to fetch online appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
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
      <DoctorLayout title="Online Appointments" subtitle="Your video call appointments with patients">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout title="Online Appointments" subtitle="Your video call appointments with patients">
      <Box>
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1">
            This page shows your video call appointments with patients only.
            You'll receive meeting details before the appointment time.
          </Typography>
        </Alert>

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
          </Paper>
        ) : (
          <List>
            {appointments.map((appointment, index) => (
              <React.Fragment key={appointment.id}>
                <ListItem>
                  <Avatar sx={{ mr: 2, bgcolor: getStatusColor(appointment.status) + '.main' }}>
                    {appointment.patientName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="h6">{appointment.patientName}</Typography>
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
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* Start Appointment Button - Only show for confirmed appointments */}
                      {appointment.status === 'confirmed' && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<PlayArrow />}
                          onClick={() => handleStartAppointment(appointment)}
                          size="small"
                        >
                          Start Appointment
                        </Button>
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
                  <Avatar>
                    {selectedAppointment.patientName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedAppointment.patientName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Patient
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
                      This is a video call appointment. Meeting link will be sent before the appointment.
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
                  {selectedAppointment.insuranceProvider && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Insurance Provider
                      </Typography>
                      <Typography variant="body1">
                        {selectedAppointment.insuranceProvider}
                      </Typography>
                    </Grid>
                  )}
                  {selectedAppointment.insuranceNumber && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Insurance Number
                      </Typography>
                      <Typography variant="body1">
                        {selectedAppointment.insuranceNumber}
                      </Typography>
                    </Grid>
                  )}
                  {selectedAppointment.shareMedicalRecords && selectedAppointment.medicalRecords && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Medical Records (Shared by Patient)
                      </Typography>
                      {selectedAppointment.medicalRecords.allergies && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Allergies:</strong> {selectedAppointment.medicalRecords.allergies}
                        </Typography>
                      )}
                      {selectedAppointment.medicalRecords.medicalConditions && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Medical Conditions:</strong> {selectedAppointment.medicalRecords.medicalConditions}
                        </Typography>
                      )}
                      {selectedAppointment.medicalRecords.previousSurgeries && (
                        <Typography variant="body2">
                          <strong>Previous Surgeries:</strong> {selectedAppointment.medicalRecords.previousSurgeries}
                        </Typography>
                      )}
                    </Grid>
                  )}
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
                          Your Notes
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
                {/* Start Appointment Button in Dialog - Only for confirmed appointments */}
                {selectedAppointment.status === 'confirmed' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={() => {
                      handleStartAppointment(selectedAppointment);
                      closeAppointmentDialog();
                    }}
                  >
                    Start Appointment
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </DoctorLayout>
  );
};

export default DoctorOnlineAppointments;

