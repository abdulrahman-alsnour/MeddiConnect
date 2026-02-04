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
  TextField,
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
  Done,
  PictureAsPdf,
} from '@mui/icons-material';
import DoctorLayout from '../components/DoctorLayout';
import { useAuth } from '../context/AuthContext';
import { Appointment, PatientMedicalRecords } from '../types/appointment';
import { useLocation } from 'react-router-dom';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Note dialog states
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteAction, setNoteAction] = useState<'confirm' | 'cancel' | null>(null);
  const [noteAppointmentId, setNoteAppointmentId] = useState<number | null>(null);
  const [doctorNote, setDoctorNote] = useState('');

  // Reschedule dialog states
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<number | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');
  const [newRescheduleTime, setNewRescheduleTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');

  // Complete appointment dialog states
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeAppointmentId, setCompleteAppointmentId] = useState<number | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');

  // Mock data removed - now using real API
  // Old mock data commented out:
  /*
    {
      id: 1,
      patientId: 1,
      patientName: 'John Smith',
      patientEmail: 'john.smith@email.com',
      patientPhone: '+1-555-0123',
      doctorId: user?.id || 1,
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'Cardiology',
      doctorEmail: 'sarah.johnson@clinic.com',
      doctorPhone: '+1-555-0100',
      date: '2024-01-20',
      time: '10:00',
      description: 'Regular checkup and blood pressure monitoring',
      shareMedicalRecords: true,
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z',
      medicalRecords: {
        gender: 'Male',
        dateOfBirth: '1985-03-15',
        height: 175,
        weight: 80,
        bloodType: 'O+',
        allergies: 'Penicillin, Shellfish, Latex',
        medicalConditions: 'Hypertension, Type 2 Diabetes, High Cholesterol',
        previousSurgeries: 'Appendectomy (2010), Gallbladder removal (2018)',
        familyMedicalHistory: 'Father: Heart disease, Mother: Diabetes, Maternal grandmother: Breast cancer',
        dietaryHabits: 'Generally healthy diet, occasional fast food',
        alcoholConsumption: 'Social drinker, 2-3 drinks per week',
        physicalActivity: 'Moderate exercise 3 times per week',
        smokingStatus: 'Non-smoker',
        mentalHealthCondition: 'Mild anxiety, managed with therapy',
        medications: [
          {
            id: 1,
            medicationName: 'Lisinopril',
            medicationDosage: '10mg',
            medicationFrequency: 'Once daily',
            medicationStartDate: '2023-01-15',
            medicationEndDate: '',
            inUse: true,
          },
          {
            id: 2,
            medicationName: 'Metformin',
            medicationDosage: '500mg',
            medicationFrequency: 'Twice daily',
            medicationStartDate: '2023-02-01',
            medicationEndDate: '',
            inUse: true,
          },
          {
            id: 3,
            medicationName: 'Atorvastatin',
            medicationDosage: '20mg',
            medicationFrequency: 'Once daily',
            medicationStartDate: '2023-03-10',
            medicationEndDate: '',
            inUse: true,
          },
        ],
        mentalHealthMedications: [
          {
            id: 1,
            medicationName: 'Sertraline',
            medicationDosage: '50mg',
            medicationFrequency: 'Once daily',
            medicationStartDate: '2023-06-01',
            medicationEndDate: '',
            inUse: true,
          },
        ],
        labResults: [
          {
            id: 1,
            description: 'Complete Blood Count (CBC)',
            hasImage: true,
            imageSize: 1024,
          },
          {
            id: 2,
            description: 'Lipid Panel',
            hasImage: true,
            imageSize: 2048,
          },
          {
            id: 3,
            description: 'HbA1c Test',
            hasImage: false,
            imageSize: 0,
          },
        ],
        insuranceProvider: 'Blue Cross Blue Shield',
        insuranceNumber: 'BC123456789',
      },
    },
    {
      id: 2,
      patientId: 2,
      patientName: 'Sarah Johnson',
      patientEmail: 'sarah.johnson@email.com',
      patientPhone: '+1-555-0456',
      doctorId: user?.id || 1,
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'Cardiology',
      doctorEmail: 'sarah.johnson@clinic.com',
      doctorPhone: '+1-555-0100',
      date: '2024-01-21',
      time: '14:30',
      description: 'Follow-up appointment for recent surgery',
      shareMedicalRecords: false,
      status: 'accepted',
      createdAt: '2024-01-16T09:15:00Z',
      doctorNotes: 'Please bring your insurance card and arrive 15 minutes early.',
    },
    {
      id: 3,
      patientId: 3,
      patientName: 'Mike Wilson',
      patientEmail: 'mike.wilson@email.com',
      patientPhone: '+1-555-0789',
      doctorId: user?.id || 1,
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'Cardiology',
      doctorEmail: 'sarah.johnson@clinic.com',
      doctorPhone: '+1-555-0100',
      date: '2024-01-22',
      time: '11:15',
      description: 'Annual physical examination',
      shareMedicalRecords: true,
      status: 'pending',
      createdAt: '2024-01-17T14:20:00Z',
      medicalRecords: {
        gender: 'Male',
        dateOfBirth: '1990-07-22',
        height: 180,
        weight: 75,
        bloodType: 'A+',
        allergies: 'Latex',
        medicalConditions: 'None',
        previousSurgeries: 'None',
        familyMedicalHistory: 'Father: Hypertension, Mother: Healthy',
        dietaryHabits: 'Vegetarian diet',
        alcoholConsumption: 'Occasional wine',
        physicalActivity: 'Regular gym workouts 4 times per week',
        smokingStatus: 'Non-smoker',
        mentalHealthCondition: 'None',
        medications: [
          {
            id: 1,
            medicationName: 'Multivitamin',
            medicationDosage: '1 tablet',
            medicationFrequency: 'Once daily',
            medicationStartDate: '2023-01-01',
            medicationEndDate: '',
            inUse: true,
          },
        ],
        mentalHealthMedications: [],
        labResults: [
          {
            id: 1,
            description: 'Annual Physical Blood Work',
            hasImage: false,
            imageSize: 0,
          },
        ],
        insuranceProvider: 'Aetna',
        insuranceNumber: 'AE987654321',
      },
    },
  ];
  */

  // Helper function to transform appointment data from backend to frontend format
  const transformAppointment = (apt: any): Appointment => {
    const appointmentDateTime = new Date(apt.appointmentDateTime);
    const dateStr = appointmentDateTime.toISOString().split('T')[0];
    const timeStr = appointmentDateTime.toTimeString().split(' ')[0].substring(0, 5);
    
    // Transform medical records if they exist
    let medicalRecords: PatientMedicalRecords | undefined = undefined;
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
      doctorProfilePicture: apt.doctorProfilePicture,
      date: dateStr,
      time: timeStr,
      description: apt.description || '',
      shareMedicalRecords: apt.shareMedicalRecords || false,
      isVideoCall: apt.isVideoCall || false,
      isCallActive: apt.isCallActive || false,
      status: apt.status?.toLowerCase() || 'pending',
      createdAt: apt.createdAt ? new Date(apt.createdAt).toISOString() : new Date().toISOString(),
      doctorNotes: apt.doctorNotes || undefined,
      insuranceProvider: apt.insuranceProvider || undefined,
      insuranceNumber: apt.insuranceNumber || undefined,
      medicalRecords: medicalRecords,
    };
  };

  // Helper function to fetch and update appointments list
  const fetchAndUpdateAppointments = async () => {
    if (!user?.token) {
      setError('Not authenticated');
      return;
    }

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
        const transformedAppointments: Appointment[] = data.data.map(transformAppointment);
        setAppointments(transformedAppointments);
      }
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      setError(error.message || 'Failed to fetch appointments');
    }
  };

  useEffect(() => {
    // Fetch appointments from backend API
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
          // Transform backend response to frontend format
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

  // Handle navigation from notifications - open specific appointment
  useEffect(() => {
    const appointmentId = (location.state as any)?.appointmentId;
    if (appointmentId && appointments.length > 0) {
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        // Determine which tab the appointment is in
        if (appointment.status === 'pending') {
          setTabValue(0); // Pending tab
        } else if (appointment.status === 'confirmed') {
          setTabValue(1); // Upcoming tab
        } else if (appointment.status === 'completed') {
          setTabValue(2); // Completed tab
        } else {
          setTabValue(3); // All tab
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

  const handleViewLabResultPdf = async (appointmentId: number, labResultId: number) => {
    if (!user?.token) {
      setError('Not authenticated');
      return;
    }

    try {
      // Fetch the PDF with authentication
      const response = await fetch(`http://localhost:8080/healthprovider/appointment/${appointmentId}/lab-result/${labResultId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. You do not have permission to view this lab result.');
        } else if (response.status === 404) {
          setError('Lab result not found.');
        } else {
          setError('Failed to load PDF. Please try again.');
        }
        return;
      }

      // Convert response to blob
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open(blobUrl, '_blank');
      
      // Clean up blob URL after a delay (to allow the browser to load it)
      if (newWindow) {
        newWindow.addEventListener('load', () => {
          // Clean up after the window loads
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 100);
        });
      } else {
        // If popup was blocked, clean up immediately
        window.URL.revokeObjectURL(blobUrl);
        setError('Popup blocked. Please allow popups for this site to view PDFs.');
      }
    } catch (error) {
      console.error('Error viewing lab result PDF:', error);
      setError('Failed to load PDF. Please try again.');
    }
  };

  const handleAppointmentAction = async (appointmentId: number, action: 'confirm' | 'cancel' | 'reschedule') => {
    if (action === 'confirm' || action === 'cancel') {
      // Open note dialog for confirm/cancel actions
      setNoteAction(action);
      setNoteAppointmentId(appointmentId);
      setDoctorNote('');
      setNoteDialogOpen(true);
    } else if (action === 'reschedule') {
      // Open reschedule dialog
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        setRescheduleAppointmentId(appointmentId);
        setNewRescheduleDate(appointment.date); // Pre-fill with current date
        setNewRescheduleTime(appointment.time); // Pre-fill with current time
        setRescheduleNote('');
        setRescheduleDialogOpen(true);
      }
    }
  };

  const handleNoteSubmit = async () => {
    if (!noteAction || !noteAppointmentId || !user?.token) return;
    
    setActionLoading(true);
    setError(null);
    try {
      // Determine the status based on action
      const status = noteAction === 'confirm' ? 'CONFIRMED' : 'CANCELLED';
      
      // Call the backend API to update appointment status
      const response = await fetch(`http://localhost:8080/appointments/${noteAppointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          doctorNotes: doctorNote.trim() || undefined, // Optional note
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update appointment' }));
        throw new Error(errorData.message || 'Failed to update appointment');
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        // Reload appointments to get updated data
        await fetchAndUpdateAppointments();
      }
      
      // Close dialogs
      setNoteDialogOpen(false);
      setDialogOpen(false);
      setSelectedAppointment(null);
      setNoteAction(null);
      setNoteAppointmentId(null);
      setDoctorNote('');
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      setError(error.message || 'Failed to update appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoteCancel = () => {
    setNoteDialogOpen(false);
    setNoteAction(null);
    setNoteAppointmentId(null);
    setDoctorNote('');
  };

  const openAppointmentDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
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

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const upcomingAppointments = appointments.filter(apt => apt.status === 'confirmed');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const allAppointments = appointments;

  if (loading) {
    return (
      <DoctorLayout title="Appointments" subtitle="Manage your patient appointments">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout title="Appointments" subtitle="Manage your patient appointments">
      <Box>
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Notification Alert */}
        {pendingAppointments.length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body1">
              You have {pendingAppointments.length} pending appointment{pendingAppointments.length > 1 ? 's' : ''} requiring your attention.
            </Typography>
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="appointment tabs">
            <Tab 
              label={`Pending (${pendingAppointments.length})`} 
              icon={<Notifications />}
              iconPosition="start"
            />
            <Tab 
              label={`Upcoming (${upcomingAppointments.length})`} 
              icon={<CalendarToday />}
              iconPosition="start"
            />
            <Tab 
              label={`Completed (${completedAppointments.length})`} 
              icon={<Done />}
              iconPosition="start"
            />
            <Tab 
              label={`All (${allAppointments.length})`} 
              icon={<Visibility />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Pending Appointments */}
        <TabPanel value={tabValue} index={0}>
          {pendingAppointments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No pending appointments
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {pendingAppointments.map((appointment) => (
                <Grid item xs={12} md={6} key={appointment.id}>
      <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {appointment.patientName.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{appointment.patientName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.patientEmail}
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
                        <Typography variant="body2">
                          <strong>Medical Records:</strong> {appointment.shareMedicalRecords ? 'Shared' : 'Not Shared'}
                        </Typography>
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
                          onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
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

        {/* Upcoming Appointments */}
        <TabPanel value={tabValue} index={1}>
          {upcomingAppointments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No upcoming appointments
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {upcomingAppointments.map((appointment) => (
                <Grid item xs={12} md={6} key={appointment.id}>
      <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            {appointment.patientName.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{appointment.patientName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.patientEmail}
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
                          color="warning"
                          onClick={() => handleAppointmentAction(appointment.id, 'reschedule')}
                        >
                          Reschedule
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => {
                            setCompleteAppointmentId(appointment.id);
                            setCompleteNotes('');
                            setCreateFollowUp(false);
                            setFollowUpDate('');
                            setFollowUpTime('');
                            setCompleteDialogOpen(true);
                          }}
                        >
                          Complete
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
                    <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
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
                  {index < completedAppointments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        {/* All Appointments */}
        <TabPanel value={tabValue} index={3}>
          <List>
            {allAppointments.map((appointment, index) => (
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
        >
          <DialogTitle>
            <Typography variant="h6">
              Appointment Details - {selectedAppointment?.patientName}
            </Typography>
          </DialogTitle>
          <DialogContent>
            {selectedAppointment && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Patient Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {selectedAppointment.patientName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedAppointment.patientEmail}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedAppointment.patientPhone}
                    </Typography>
                    {/* Always show insurance information for doctors */}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Insurance Provider:</strong> {selectedAppointment.insuranceProvider || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Insurance Number:</strong> {selectedAppointment.insuranceNumber || 'N/A'}
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
                      <strong>Appointment Type:</strong> {
                        selectedAppointment.isVideoCall 
                          ? 'Video Call' 
                          : 'In-Person'
                      }
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
                        Doctor's Note
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          {selectedAppointment.doctorNotes}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  
                  {/* Show medical records ONLY if patient granted permission */}
                  {selectedAppointment.shareMedicalRecords === true && selectedAppointment.medicalRecords && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Medical Records (Shared)
                      </Typography>
                      <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                        <Grid container spacing={2}>
                          {/* Basic Information */}
                          <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                              Basic Information
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="body2" fontWeight="bold">Gender:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.gender}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" fontWeight="bold">Date of Birth:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.dateOfBirth}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" fontWeight="bold">Height:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.height} cm</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" fontWeight="bold">Weight:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.weight} kg</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" fontWeight="bold">Blood Type:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.bloodType}</Typography>
                              </Grid>
                            </Grid>
                          </Grid>

                          {/* Medical History */}
                          <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mt: 2 }}>
                              Medical History
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Typography variant="body2" fontWeight="bold">Allergies:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.allergies || 'None'}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" fontWeight="bold">Medical Conditions:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.medicalConditions || 'None'}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" fontWeight="bold">Previous Surgeries:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.previousSurgeries || 'None'}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" fontWeight="bold">Family Medical History:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.familyMedicalHistory || 'None'}</Typography>
                              </Grid>
                            </Grid>
                          </Grid>

                          {/* Lifestyle */}
                          <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mt: 2 }}>
                              Lifestyle Information
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="body2" fontWeight="bold">Dietary Habits:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.dietaryHabits || 'Not specified'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" fontWeight="bold">Alcohol Consumption:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.alcoholConsumption || 'Not specified'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" fontWeight="bold">Physical Activity:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.physicalActivity || 'Not specified'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" fontWeight="bold">Smoking Status:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.smokingStatus || 'Not specified'}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" fontWeight="bold">Mental Health Condition:</Typography>
                                <Typography variant="body2">{selectedAppointment.medicalRecords.mentalHealthCondition || 'None'}</Typography>
                              </Grid>
                            </Grid>
                          </Grid>

                          {/* Current Medications */}
                          <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mt: 2 }}>
                              Current Medications
                            </Typography>
                            {selectedAppointment.medicalRecords.medications.filter(med => med.inUse).length > 0 ? (
                              selectedAppointment.medicalRecords.medications.filter(med => med.inUse).map((medication) => (
                                <Box key={medication.id} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                  <Typography variant="body2" fontWeight="bold">{medication.medicationName}</Typography>
                                  <Typography variant="body2">{medication.medicationDosage} - {medication.medicationFrequency}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Started: {medication.medicationStartDate}
                                  </Typography>
                                </Box>
                              ))
                            ) : (
                              <Typography variant="body2">No current medications</Typography>
                            )}
                          </Grid>

                          {/* Mental Health Medications */}
                          {selectedAppointment.medicalRecords.mentalHealthMedications.filter(med => med.inUse).length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mt: 2 }}>
                                Mental Health Medications
                              </Typography>
                              {selectedAppointment.medicalRecords.mentalHealthMedications.filter(med => med.inUse).map((medication) => (
                                <Box key={medication.id} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                  <Typography variant="body2" fontWeight="bold">{medication.medicationName}</Typography>
                                  <Typography variant="body2">{medication.medicationDosage} - {medication.medicationFrequency}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Started: {medication.medicationStartDate}
                                  </Typography>
                                </Box>
                              ))}
                            </Grid>
                          )}

                          {/* Lab Results */}
                          <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mt: 2 }}>
                              Lab Results
                            </Typography>
                            {selectedAppointment.medicalRecords.labResults.length > 0 ? (
                              selectedAppointment.medicalRecords.labResults.map((lab) => (
                                <Box key={lab.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2" fontWeight="bold" gutterBottom>{lab.description}</Typography>
                                      {lab.hasImage && (
                                        <Typography variant="caption" color="text.secondary">
                                          PDF available ({lab.imageSize ? Math.round(lab.imageSize / 1024) : 0} KB)
                                        </Typography>
                                      )}
                                    </Box>
                                    {lab.hasImage && (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<PictureAsPdf />}
                                        onClick={() => handleViewLabResultPdf(selectedAppointment.id, lab.id)}
                                        sx={{ ml: 2 }}
                                      >
                                        View PDF
                                      </Button>
                                    )}
                                  </Box>
                                </Box>
                              ))
                            ) : (
                              <Typography variant="body2">No lab results available</Typography>
                            )}
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
            {selectedAppointment?.status === 'pending' && (
              <>
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => handleAppointmentAction(selectedAppointment.id, 'confirm')}
                  disabled={actionLoading}
                >
                  Confirm
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={() => handleAppointmentAction(selectedAppointment.id, 'cancel')}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
              </>
            )}
            {selectedAppointment?.status === 'confirmed' && (
              <Button
                color="warning"
                variant="contained"
                onClick={() => {
                  setDialogOpen(false);
                  handleAppointmentAction(selectedAppointment.id, 'reschedule');
                }}
                disabled={actionLoading}
              >
                Reschedule
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Doctor Note Dialog */}
        <Dialog open={noteDialogOpen} onClose={handleNoteCancel} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6">
              {noteAction === 'confirm' ? 'Confirm Appointment' : 'Cancel Appointment'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add an optional note for the patient
            </Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={noteAction === 'confirm' ? 'Confirmation Note' : 'Cancellation Reason'}
              placeholder={
                noteAction === 'confirm' 
                  ? 'e.g., Please bring your insurance card and arrive 15 minutes early...'
                  : 'e.g., Appointment rejected due to scheduling conflict. Please reschedule...'
              }
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={doctorNote}
              onChange={(e) => setDoctorNote(e.target.value)}
              sx={{ mt: 2 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Optional: This note will be visible to the patient and help them understand your decision.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleNoteCancel} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleNoteSubmit}
              variant="contained"
              color={noteAction === 'confirm' ? 'success' : 'error'}
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={20} /> : undefined}
            >
              {actionLoading ? 'Processing...' : `${noteAction === 'confirm' ? 'Confirm' : 'Cancel'} Appointment`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog 
          open={rescheduleDialogOpen} 
          onClose={() => setRescheduleDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6">Reschedule Appointment</Typography>
            <Typography variant="body2" color="text.secondary">
              Select a new date and time for this appointment
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="New Date"
                type="date"
                value={newRescheduleDate}
                onChange={(e) => setNewRescheduleDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                margin="normal"
                required
                inputProps={{
                  min: new Date().toISOString().split('T')[0], // Prevent past dates
                }}
              />
              <TextField
                fullWidth
                label="New Time"
                type="time"
                value={newRescheduleTime}
                onChange={(e) => setNewRescheduleTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                margin="normal"
                required
                inputProps={{
                  step: 300, // 5 minute intervals
                }}
              />
              <TextField
                fullWidth
                label="Reschedule Note (Optional)"
                placeholder="e.g., The original time slot conflicts with emergency surgery. New time slot confirmed."
                multiline
                rows={3}
                value={rescheduleNote}
                onChange={(e) => setRescheduleNote(e.target.value)}
                margin="normal"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This note will be visible to the patient and help them understand why the appointment was rescheduled.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => {
                setRescheduleDialogOpen(false);
                setRescheduleAppointmentId(null);
                setNewRescheduleDate('');
                setNewRescheduleTime('');
                setRescheduleNote('');
              }} 
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!rescheduleAppointmentId || !newRescheduleDate || !newRescheduleTime || !user?.token) {
                  setError('Please provide both date and time for rescheduling');
                  return;
                }

                setActionLoading(true);
                setError(null);
                
                try {
                  // Combine date and time into ISO string
                  const newDateTime = new Date(`${newRescheduleDate}T${newRescheduleTime}`);
                  
                  // Call the backend API to reschedule
                  const response = await fetch(`http://localhost:8080/appointments/${rescheduleAppointmentId}/status`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${user.token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      status: 'RESCHEDULED',
                      newAppointmentDateTime: newDateTime.toISOString(),
                      doctorNotes: rescheduleNote.trim() || undefined, // Optional note
                    }),
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to reschedule appointment' }));
                    throw new Error(errorData.message || 'Failed to reschedule appointment');
                  }

                  const data = await response.json();
                  
                  if (data.status === 'success') {
                    // Reload appointments to get updated data
                    await fetchAndUpdateAppointments();
                    
                    // Close dialogs
                    setRescheduleDialogOpen(false);
                    setDialogOpen(false);
                    setSelectedAppointment(null);
                    setRescheduleAppointmentId(null);
                    setNewRescheduleDate('');
                    setNewRescheduleTime('');
                    setRescheduleNote('');
                  }
                } catch (error: any) {
                  console.error('Error rescheduling appointment:', error);
                  setError(error.message || 'Failed to reschedule appointment');
                } finally {
                  setActionLoading(false);
                }
              }}
              variant="contained"
              color="warning"
              disabled={actionLoading || !newRescheduleDate || !newRescheduleTime}
              startIcon={actionLoading ? <CircularProgress size={20} /> : undefined}
            >
              {actionLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Complete Appointment Dialog */}
        <Dialog 
          open={completeDialogOpen} 
          onClose={() => setCompleteDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6">
              Complete Appointment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mark this appointment as completed and add notes about the visit
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Appointment Notes"
                placeholder="Enter notes about the visit, diagnosis, treatment, recommendations, etc."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <input
                  type="checkbox"
                  id="createFollowUp"
                  checked={createFollowUp}
                  onChange={(e) => setCreateFollowUp(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <Typography component="label" htmlFor="createFollowUp" variant="body2">
                  Create follow-up appointment
                </Typography>
              </Box>

              {createFollowUp && (
                <Box sx={{ pl: 4, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Follow-up Date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Follow-up Time"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setCompleteDialogOpen(false);
                setCompleteAppointmentId(null);
                setCompleteNotes('');
                setCreateFollowUp(false);
                setFollowUpDate('');
                setFollowUpTime('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!completeAppointmentId || !user?.token) return;

                setActionLoading(true);
                setError(null);

                try {
                  // Prepare request body
                  const requestBody: any = {};
                  
                  // Add notes if provided
                  if (completeNotes.trim()) {
                    requestBody.notes = completeNotes.trim();
                  }

                  // Add follow-up date/time if enabled
                  if (createFollowUp && followUpDate && followUpTime) {
                    // Combine date and time into ISO format
                    const followUpDateTime = new Date(`${followUpDate}T${followUpTime}`).toISOString();
                    requestBody.followUpDateTime = followUpDateTime;
                  }

                  // Call the backend API to complete appointment
                  const response = await fetch(`http://localhost:8080/appointments/${completeAppointmentId}/complete`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${user.token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to complete appointment' }));
                    throw new Error(errorData.message || 'Failed to complete appointment');
                  }

                  const data = await response.json();

                  if (data.status === 'success') {
                    // Reload appointments to get updated data
                    await fetchAndUpdateAppointments();
                  }

                  // Close dialogs
                  setCompleteDialogOpen(false);
                  setDialogOpen(false);
                  setSelectedAppointment(null);
                  setCompleteAppointmentId(null);
                  setCompleteNotes('');
                  setCreateFollowUp(false);
                  setFollowUpDate('');
                  setFollowUpTime('');

                } catch (err: any) {
                  console.error('Error completing appointment:', err);
                  setError(err.message || 'Failed to complete appointment');
                } finally {
                  setActionLoading(false);
                }
              }}
              variant="contained"
              color="success"
              disabled={actionLoading || (createFollowUp && (!followUpDate || !followUpTime))}
              startIcon={actionLoading ? <CircularProgress size={20} /> : undefined}
            >
              {actionLoading ? 'Completing...' : 'Complete Appointment'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DoctorLayout>
  );
};

export default DoctorAppointments;
