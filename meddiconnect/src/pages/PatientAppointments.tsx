import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Rating,
  TextField,
  useMediaQuery,
  useTheme,
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
  Add,
  Videocam,
  Done,
  Star,
  RateReview,
} from '@mui/icons-material';
import PatientLayout from '../components/PatientLayout';
import { useAuth } from '../context/AuthContext';
import { Appointment } from '../types/appointment';
import { useLocation, useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`appointment-tabpanel-${index}`}
      aria-labelledby={`appointment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

const PatientAppointments: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Review dialog states
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAppointmentId, setReviewAppointmentId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasReviewMap, setHasReviewMap] = useState<Map<number, boolean>>(new Map());

  /**
   * Transform backend appointment data to frontend format
   * Converts ISO date-time string to separate date and time strings
   * This utility function reduces code duplication
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
      status: apt.status?.toLowerCase() || 'pending',
      createdAt: apt.createdAt ? new Date(apt.createdAt).toISOString() : new Date().toISOString(),
      doctorNotes: apt.doctorNotes || undefined,
    };
  };

  // Mock data removed - now using real API
  // Old mock data commented out:
  /*
    {
      id: 1,
      patientId: user?.id || 1,
      patientName: 'John Smith',
      patientEmail: 'john.smith@email.com',
      patientPhone: '+1-555-0123',
      doctorId: 1,
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'Cardiology',
      doctorEmail: 'sarah.johnson@clinic.com',
      doctorPhone: '+1-555-0100',
      date: '2024-01-20',
      time: '10:00',
      description: 'Regular checkup and blood pressure monitoring',
      shareMedicalRecords: true,
      status: 'accepted',
      createdAt: '2024-01-15T10:30:00Z',
      doctorNotes: 'Please bring your blood pressure log and current medications.',
    },
    {
      id: 2,
      patientId: user?.id || 1,
      patientName: 'John Smith',
      patientEmail: 'john.smith@email.com',
      patientPhone: '+1-555-0123',
      doctorId: 2,
      doctorName: 'Dr. Michael Chen',
      doctorSpecialty: 'Dermatology',
      doctorEmail: 'michael.chen@clinic.com',
      doctorPhone: '+1-555-0200',
      date: '2024-01-25',
      time: '14:30',
      description: 'Skin examination for mole check',
      shareMedicalRecords: false,
      status: 'pending',
      createdAt: '2024-01-18T14:20:00Z',
    },
    {
      id: 3,
      patientId: user?.id || 1,
      patientName: 'John Smith',
      patientEmail: 'john.smith@email.com',
      patientPhone: '+1-555-0123',
      doctorId: 3,
      doctorName: 'Dr. Emily Davis',
      doctorSpecialty: 'Internal Medicine',
      doctorEmail: 'emily.davis@clinic.com',
      doctorPhone: '+1-555-0300',
      date: '2024-01-22',
      time: '11:15',
      description: 'Follow-up for diabetes management',
      shareMedicalRecords: true,
      status: 'rejected',
      createdAt: '2024-01-19T09:15:00Z',
      doctorNotes: 'Appointment rejected due to scheduling conflict. Please reschedule.',
    },
    {
      id: 4,
      patientId: user?.id || 1,
      patientName: 'John Smith',
      patientEmail: 'john.smith@email.com',
      patientPhone: '+1-555-0123',
      doctorId: 4,
      doctorName: 'Dr. Robert Wilson',
      doctorSpecialty: 'Orthopedics',
      doctorEmail: 'robert.wilson@clinic.com',
      doctorPhone: '+1-555-0400',
      date: '2024-01-28',
      time: '09:00',
      description: 'Knee pain evaluation and treatment plan',
      shareMedicalRecords: true,
      status: 'rescheduled',
      createdAt: '2024-01-20T16:45:00Z',
      doctorNotes: 'Appointment rescheduled to accommodate your availability. New time confirmed.',
    },
    {
      id: 5,
      patientId: user?.id || 1,
      patientName: 'John Smith',
      patientEmail: 'john.smith@email.com',
      patientPhone: '+1-555-0123',
      doctorId: 5,
      doctorName: 'Dr. Lisa Martinez',
      doctorSpecialty: 'Pediatrics',
      doctorEmail: 'lisa.martinez@clinic.com',
      doctorPhone: '+1-555-0500',
      date: '2024-02-02',
      time: '15:30',
      description: 'Annual physical examination',
      shareMedicalRecords: false,
      status: 'accepted',
      createdAt: '2024-01-21T11:20:00Z',
      doctorNotes: 'Please arrive 15 minutes early for paperwork completion.',
    },
    {
      id: 6,
      patientId: user?.id || 1,
      patientName: 'John Smith',
      patientEmail: 'john.smith@email.com',
      patientPhone: '+1-555-0123',
      doctorId: 6,
      doctorName: 'Dr. James Thompson',
      doctorSpecialty: 'Neurology',
      doctorEmail: 'james.thompson@clinic.com',
      doctorPhone: '+1-555-0600',
      date: '2024-01-30',
      time: '13:45',
      description: 'Headache consultation and MRI review',
      shareMedicalRecords: true,
      status: 'pending',
      createdAt: '2024-01-22T08:30:00Z',
    },
  ];
  */

  useEffect(() => {
    // Fetch appointments from backend API
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Fetch from API instead
        const response = await fetch('http://localhost:8080/appointments/patient', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch appointments' }));
          throw new Error(errorData.message || 'Failed to fetch appointments');
        }

        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
          // Transform backend response to frontend format using utility function
          const transformedAppointments: Appointment[] = data.data.map(transformAppointment);
          setAppointments(transformedAppointments);
        } else {
          setAppointments([]);
        }
      } catch (error: any) {
        console.error('Error fetching appointments:', error);
        setError(error.message || 'Failed to fetch appointments');
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user?.token]);

  // Calculate filtered appointments
  const upcomingAppointments = appointments.filter(apt => apt.status === 'confirmed');
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const rescheduledAppointments = appointments.filter(apt => apt.status === 'rescheduled');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const allAppointments = appointments;

  // Check review status for completed appointments
  useEffect(() => {
    const checkReviews = async () => {
      if (!user?.token || completedAppointments.length === 0) return;
      
      const reviewMap = new Map<number, boolean>();
      
      // Check each completed appointment
      for (const appointment of completedAppointments) {
        try {
          const response = await fetch(`http://localhost:8080/reviews/appointment/${appointment.id}/exists`, {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            reviewMap.set(appointment.id, data.hasReview || false);
          }
        } catch (error) {
          console.error(`Error checking review for appointment ${appointment.id}:`, error);
          reviewMap.set(appointment.id, false);
        }
      }
      
      setHasReviewMap(reviewMap);
    };
    
    checkReviews();
  }, [completedAppointments, user?.token]);

  // Handle navigation from notifications - open specific appointment
  useEffect(() => {
    const appointmentId = (location.state as any)?.appointmentId;
    if (appointmentId && appointments.length > 0) {
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        // Determine which tab the appointment is in
        if (appointment.status === 'pending') {
          setTabValue(1); // Pending tab
        } else if (appointment.status === 'confirmed') {
          setTabValue(0); // Upcoming tab
        } else if (appointment.status === 'completed') {
          setTabValue(2); // Completed tab
        } else if (appointment.status === 'rescheduled') {
          setTabValue(3); // Rescheduled tab
        } else {
          setTabValue(4); // All tab
        }
        
        // Open the appointment dialog
        setTimeout(() => {
          openAppointmentDialog(appointment);
        }, 100);
        
        // Clear the navigation state
        window.history.replaceState({}, document.title);
      }
    }
  }, [appointments, location.state]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openAppointmentDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  /**
   * Open review dialog for a completed appointment
   */
  const openReviewDialog = (appointment: Appointment) => {
    setReviewAppointmentId(appointment.id);
    setReviewRating(null);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  /**
   * Close review dialog
   */
  const closeReviewDialog = () => {
    setReviewDialogOpen(false);
    setReviewAppointmentId(null);
    setReviewRating(null);
    setReviewNotes('');
  };

  /**
   * Submit review for a completed appointment
   */
  const handleSubmitReview = async () => {
    if (!reviewAppointmentId || !reviewRating || !user?.token) {
      setError('Please provide a rating (1-5 stars)');
      return;
    }

    setReviewLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8080/reviews/appointment/${reviewAppointmentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: reviewRating,
          notes: reviewNotes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Failed to submit review');
      }

      // Update hasReviewMap
      setHasReviewMap(prev => {
        const updated = new Map(prev);
        updated.set(reviewAppointmentId, true);
        return updated;
      });

      closeReviewDialog();
      setError(null);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRescheduleResponse = async (appointmentId: number, action: 'confirm' | 'cancel') => {
    if (!user?.token) {
      setError('Not authenticated');
      return;
    }

    setActionLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8080/appointments/${appointmentId}/respond-reschedule?action=${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update appointment' }));
        throw new Error(errorData.message || 'Failed to update appointment');
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        // Reload appointments to get updated data
        const fetchResponse = await fetch('http://localhost:8080/appointments/patient', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json();
          if (fetchData.status === 'success' && fetchData.data) {
            const transformedAppointments: Appointment[] = fetchData.data.map((apt: any) => {
              const appointmentDateTime = new Date(apt.appointmentDateTime);
              const dateStr = appointmentDateTime.toISOString().split('T')[0];
              const timeStr = appointmentDateTime.toTimeString().split(' ')[0].substring(0, 5);
              
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
                status: apt.status?.toLowerCase() || 'pending',
                createdAt: apt.createdAt ? new Date(apt.createdAt).toISOString() : new Date().toISOString(),
                doctorNotes: apt.doctorNotes || undefined,
              };
            });
            setAppointments(transformedAppointments);
          }
        }
        
        // Close dialog if open
        setDialogOpen(false);
        setSelectedAppointment(null);
      }
    } catch (error: any) {
      console.error('Error responding to rescheduled appointment:', error);
      setError(error.message || `Failed to ${action} appointment`);
    } finally {
      setActionLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'cancelled': return 'error';
      case 'rescheduled': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'confirmed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      case 'rescheduled': return <Schedule />;
      case 'completed': return <CheckCircle />;
      default: return <CalendarToday />;
    }
  };

  if (loading) {
    return (
      <PatientLayout title="My Appointments" subtitle="View and manage your appointments">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="My Appointments" subtitle="View and manage your appointments">
      <Box>
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Quick Actions */}
        <Box sx={{ mb: { xs: 2, sm: 3 }, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => window.location.href = '/find-doctor'}
            fullWidth={isMobile}
            sx={{ minWidth: { sm: 'auto' } }}
          >
            Book New Appointment
          </Button>
        </Box>

        {/* Status Alerts */}
        {pendingAppointments.length > 0 && (
          <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              You have {pendingAppointments.length} appointment{pendingAppointments.length > 1 ? 's' : ''} pending doctor approval.
            </Typography>
          </Alert>
        )}

        {upcomingAppointments.length > 0 && (
          <Alert severity="success" sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              You have {upcomingAppointments.length} upcoming appointment{upcomingAppointments.length > 1 ? 's' : ''}.
            </Typography>
          </Alert>
        )}

        {rescheduledAppointments.length > 0 && (
          <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              You have {rescheduledAppointments.length} rescheduled appointment{rescheduledAppointments.length > 1 ? 's' : ''}. Please review the new times.
            </Typography>
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: { xs: 2, sm: 3 }, overflow: 'auto' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="appointment tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: 80, sm: 120 },
                px: { xs: 1, sm: 2 },
              }
            }}
          >
            <Tab 
              label={`Upcoming (${upcomingAppointments.length})`} 
              icon={<CalendarToday />}
              iconPosition="start"
            />
            <Tab 
              label={`Pending (${pendingAppointments.length})`} 
              icon={<Notifications />}
              iconPosition="start"
            />
            <Tab 
              label={`Completed (${completedAppointments.length})`} 
              icon={<Done />}
              iconPosition="start"
            />
            <Tab 
              label={`Rescheduled (${rescheduledAppointments.length})`} 
              icon={<Schedule />}
              iconPosition="start"
            />
            <Tab 
              label={`All (${allAppointments.length})`} 
              icon={<Visibility />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Upcoming Appointments */}
        <TabPanel value={tabValue} index={0}>
          {upcomingAppointments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No upcoming appointments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Book an appointment with a doctor to get started.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                sx={{ mt: 2 }}
                onClick={() => window.location.href = '/find-doctor'}
              >
                Book Appointment
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {upcomingAppointments.map((appointment) => (
                <Grid item xs={12} sm={6} key={appointment.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flex: 1, minWidth: { xs: '100%', sm: 'auto' } }}>
                          <Avatar 
                            src={appointment.doctorProfilePicture}
                            sx={{ bgcolor: 'primary.main', width: { xs: 40, sm: 56 }, height: { xs: 40, sm: 56 } }}
                          >
                            {appointment.doctorName.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6"
                              onClick={() => navigate(`/doctor/${appointment.doctorId}`)}
                              sx={{ 
                                cursor: 'pointer',
                                color: 'primary.main',
                                fontSize: { xs: '1rem', sm: '1.25rem' },
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {appointment.doctorName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {appointment.doctorSpecialty}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          icon={getStatusIcon(appointment.status)}
                          label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          color={getStatusColor(appointment.status) as any}
                          size="small"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Appointment Details
                        </Typography>
                        <Typography variant="body2">
                          <strong>Date:</strong> {formatDate(appointment.date)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Time:</strong> {formatTime(appointment.time)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Purpose:</strong> {appointment.description}
                        </Typography>
                        {appointment.doctorNotes && (
                          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                            <strong>Doctor's Note:</strong> {appointment.doctorNotes}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openAppointmentDialog(appointment)}
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Pending Appointments */}
        <TabPanel value={tabValue} index={1}>
          {pendingAppointments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No pending appointments
              </Typography>
            </Paper>
          ) : (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {pendingAppointments.map((appointment) => (
                    <Grid item xs={12} sm={6} key={appointment.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            src={appointment.doctorProfilePicture}
                            sx={{ bgcolor: 'warning.main' }}
                          >
                            {appointment.doctorName.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="h6"
                              onClick={() => navigate(`/doctor/${appointment.doctorId}`)}
                              sx={{ 
                                cursor: 'pointer',
                                color: 'primary.main',
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {appointment.doctorName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.doctorSpecialty}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          icon={getStatusIcon(appointment.status)}
                          label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          color={getStatusColor(appointment.status) as any}
                          size="small"
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Appointment Details
                        </Typography>
                        <Typography variant="body2">
                          <strong>Date:</strong> {formatDate(appointment.date)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Time:</strong> {formatTime(appointment.time)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Purpose:</strong> {appointment.description}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openAppointmentDialog(appointment)}
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Completed Appointments */}
        <TabPanel value={tabValue} index={2}>
          {completedAppointments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No completed appointments
              </Typography>
            </Paper>
          ) : (
            <List>
              {completedAppointments.map((appointment, index) => (
                <React.Fragment key={appointment.id}>
                  <ListItem>
                    <Avatar 
                      src={appointment.doctorProfilePicture}
                      sx={{ mr: 2, bgcolor: 'success.main' }}
                    >
                      {appointment.doctorName.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Typography 
                            variant="h6"
                            onClick={() => navigate(`/doctor/${appointment.doctorId}`)}
                            sx={{ 
                              cursor: 'pointer',
                              color: 'primary.main',
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {appointment.doctorName}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(appointment.status)}
                            label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            color={getStatusColor(appointment.status) as any}
                            size="small"
                          />
                          {appointment.isVideoCall && (
                            <Chip
                              icon={<Videocam />}
                              label="Video Call"
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          )}
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
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', mt: { xs: 1, sm: 0 } }}>
                        {/* Give Review Button - Only show if review doesn't exist */}
                        {!hasReviewMap.get(appointment.id) && (
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<RateReview />}
                            onClick={() => openReviewDialog(appointment)}
                            size="small"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                          >
                            Give Review
                          </Button>
                        )}
                        {/* Show "Reviewed" chip if review exists */}
                        {hasReviewMap.get(appointment.id) && (
                          <Chip
                            icon={<Star />}
                            label="Reviewed"
                            color="success"
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                          />
                        )}
                        <IconButton 
                          onClick={() => openAppointmentDialog(appointment)}
                          size="small"
                          sx={{ p: { xs: 0.5, sm: 1 } }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < completedAppointments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Rescheduled Appointments */}
        <TabPanel value={tabValue} index={3}>
          {rescheduledAppointments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No rescheduled appointments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Rescheduled appointments will appear here when doctors modify your appointment times.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {rescheduledAppointments.map((appointment) => (
                <Grid item xs={12} sm={6} key={appointment.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            src={appointment.doctorProfilePicture}
                            sx={{ bgcolor: 'info.main' }}
                          >
                            {appointment.doctorName.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="h6"
                              onClick={() => navigate(`/doctor/${appointment.doctorId}`)}
                              sx={{ 
                                cursor: 'pointer',
                                color: 'primary.main',
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {appointment.doctorName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.doctorSpecialty}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          icon={getStatusIcon(appointment.status)}
                          label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          color={getStatusColor(appointment.status) as any}
                          size="small"
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Appointment Details
                        </Typography>
                        <Typography variant="body2">
                          <strong>Date:</strong> {formatDate(appointment.date)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Time:</strong> {formatTime(appointment.time)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Purpose:</strong> {appointment.description}
                        </Typography>
                        {appointment.doctorNotes && (
                          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                            <strong>Doctor's Note:</strong> {appointment.doctorNotes}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openAppointmentDialog(appointment)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleRescheduleResponse(appointment.id, 'confirm')}
                          disabled={actionLoading}
                        >
                          Confirm New Time
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleRescheduleResponse(appointment.id, 'cancel')}
                          disabled={actionLoading}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* All Appointments */}
        <TabPanel value={tabValue} index={4}>
          <List>
            {allAppointments.map((appointment, index) => (
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
                        <Typography 
                          variant="h6"
                          onClick={() => navigate(`/doctor/${appointment.doctorId}`)}
                          sx={{ 
                            cursor: 'pointer',
                            color: 'primary.main',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {appointment.doctorName}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(appointment.status)}
                          label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          color={getStatusColor(appointment.status) as any}
                          size="small"
                        />
                        {appointment.isVideoCall && (
                          <Chip
                            icon={<Videocam />}
                            label="Video Call"
                            color="primary"
                            size="small"
                            variant="outlined"
                          />
                        )}
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
                    <IconButton onClick={() => openAppointmentDialog(appointment)}>
                      <Visibility />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < allAppointments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </TabPanel>

        {/* Appointment Detail Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              m: { xs: 0, sm: 2 },
              height: { xs: '100%', sm: 'auto' },
              maxHeight: { xs: '100%', sm: '90vh' },
            }
          }}
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Appointment Details -{' '}
              <Typography
                component="span"
                variant="h6"
                onClick={() => {
                  if (selectedAppointment) {
                    navigate(`/doctor/${selectedAppointment.doctorId}`);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {selectedAppointment?.doctorName}
              </Typography>
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
            {selectedAppointment && (
              <Box>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Doctor Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong>{' '}
                      <Typography
                        component="span"
                        onClick={() => {
                          if (selectedAppointment) {
                            navigate(`/doctor/${selectedAppointment.doctorId}`);
                          }
                        }}
                        sx={{
                          cursor: 'pointer',
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {selectedAppointment.doctorName}
                      </Typography>
                    </Typography>
                    <Typography variant="body2">
                      <strong>Specialty:</strong> {selectedAppointment.doctorSpecialty}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedAppointment.doctorEmail}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedAppointment.doctorPhone}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Appointment Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {formatDate(selectedAppointment.date)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Time:</strong> {formatTime(selectedAppointment.time)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Medical Records:</strong> {selectedAppointment.shareMedicalRecords ? 'Shared' : 'Not Shared'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Visit Description
                    </Typography>
                    <Typography variant="body2">
                      {selectedAppointment.description}
                    </Typography>
                  </Grid>
                  
                  {selectedAppointment.doctorNotes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Doctor's Notes
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                        {selectedAppointment.doctorNotes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: 1, flexWrap: 'wrap' }}>
            <Button 
              onClick={() => setDialogOpen(false)}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              fullWidth={isMobile}
            >
              Close
            </Button>
            {selectedAppointment?.status === 'rescheduled' && (
              <>
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => {
                    handleRescheduleResponse(selectedAppointment.id, 'confirm');
                  }}
                  disabled={actionLoading}
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  fullWidth={isMobile}
                >
                  Confirm New Time
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={() => {
                    handleRescheduleResponse(selectedAppointment.id, 'cancel');
                  }}
                  disabled={actionLoading}
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  fullWidth={isMobile}
                >
                  Cancel Appointment
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Review Dialog */}
        <Dialog
          open={reviewDialogOpen}
          onClose={closeReviewDialog}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              m: { xs: 0, sm: 2 },
              height: { xs: '100%', sm: 'auto' },
              maxHeight: { xs: '100%', sm: '90vh' },
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RateReview color="primary" />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Review Appointment
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
            <Box sx={{ pt: 2 }}>
              {/* Star Rating */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Rate your experience (1-5 stars)
                </Typography>
                <Rating
                  value={reviewRating}
                  onChange={(event, newValue) => {
                    setReviewRating(newValue);
                  }}
                  size="large"
                  sx={{ fontSize: { xs: 32, sm: 40 } }}
                />
                {reviewRating && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {reviewRating === 1 && 'Poor'}
                    {reviewRating === 2 && 'Fair'}
                    {reviewRating === 3 && 'Good'}
                    {reviewRating === 4 && 'Very Good'}
                    {reviewRating === 5 && 'Excellent'}
                  </Typography>
                )}
              </Box>

              {/* Review Notes */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Feedback (Optional)"
                placeholder="Share your experience with this doctor..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />

              {/* Error Display */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: 1 }}>
            <Button 
              onClick={closeReviewDialog} 
              disabled={reviewLoading}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitReview}
              disabled={reviewLoading || !reviewRating}
              startIcon={reviewLoading ? <CircularProgress size={20} /> : <Star />}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {reviewLoading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PatientLayout>
  );
};

export default PatientAppointments;
