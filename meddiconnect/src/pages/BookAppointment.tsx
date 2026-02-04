import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  LocalHospital,
  CheckCircle,
  Schedule,
  MedicalServices,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import PatientLayout from '../components/PatientLayout';
import { DoctorData, TimeSlot } from '../types/appointment';

const BookAppointment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [visitDescription, setVisitDescription] = useState('');
  const [shareMedicalRecords, setShareMedicalRecords] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);

  const steps = ['Select Date & Time', 'Visit Details', 'Confirmation'];

  // Redirect to sign up if user is not a logged-in patient
  useEffect(() => {
    if (!user?.token || user.type !== 'patient') {
      navigate('/register');
    }
  }, [user, navigate]);

  /**
   * Fetch available time slots from the backend API
   * Checks confirmed appointments for the selected date and doctor
   */
  const fetchAvailableTimeSlots = useCallback(async (date: string) => {
    if (!id) {
      console.log('Cannot fetch slots: missing doctor ID');
      return;
    }

    // Get start/end time for the selected day
    const dayName = getDayName(date);
    let startTime = doctorData?.availableTimeStart || '09:00';
    let endTime = doctorData?.availableTimeEnd || '17:00';

    // Use day-specific availability if available
    if (doctorData?.dayAvailabilities && doctorData.dayAvailabilities.length > 0) {
      const dayAvailability = doctorData.dayAvailabilities.find(
        (av: any) => normalizeDayName(av.dayOfWeek) === normalizeDayName(dayName)
      );
      if (dayAvailability && dayAvailability.enabled && dayAvailability.startTime && dayAvailability.endTime) {
        startTime = dayAvailability.startTime;
        endTime = dayAvailability.endTime;
      }
    }

    console.log('Fetching available slots:', { doctorId: id, date, startTime, endTime });

    try {
      const url = `http://localhost:8080/appointments/available-slots?doctorId=${id}&date=${date}&startTime=${startTime}&endTime=${endTime}`;
      console.log('API URL:', url);
      
      const response = await fetch(url);

      console.log('API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (data.status === 'success' && data.data) {
          // Convert backend response to TimeSlot format
          const slots: TimeSlot[] = data.data.map((slot: any) => ({
            time: slot.time,
            available: slot.available,
          }));
          console.log('Processed slots:', slots);
          setAvailableTimeSlots(slots);
          // Clear selected time if it's no longer available
          setSelectedTime(prev => {
            if (prev && !slots.find(s => s.time === prev && s.available)) {
              return '';
            }
            return prev;
          });
        } else {
          console.error('API returned error status:', data);
          // Don't fallback - show error
          setError('Failed to load available time slots. Please try again.');
          if (doctorData?.availableTimeStart && doctorData?.availableTimeEnd) {
            generateFallbackSlots();
          }
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch available slots. Status:', response.status, 'Error:', errorText);
        // Don't fallback - show error
        setError('Failed to load available time slots. Please try again.');
        if (doctorData?.availableTimeStart && doctorData?.availableTimeEnd) {
          generateFallbackSlots();
        }
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      // Don't fallback - show error
      setError('Network error loading available time slots. Please try again.');
      if (doctorData?.availableTimeStart && doctorData?.availableTimeEnd) {
        generateFallbackSlots();
      }
    }
  }, [id, doctorData?.availableTimeStart, doctorData?.availableTimeEnd, doctorData?.dayAvailabilities]);

  /**
   * Generate fallback time slots (all available) if API call fails
   */
  const generateFallbackSlots = () => {
    if (!doctorData?.availableTimeStart || !doctorData?.availableTimeEnd) {
      return;
    }

    const slots: TimeSlot[] = [];
    const start = new Date(`2000-01-01T${doctorData.availableTimeStart}`);
    const end = new Date(`2000-01-01T${doctorData.availableTimeEnd}`);
    
    while (start < end) {
      const timeString = start.toTimeString().slice(0, 5);
      slots.push({
        time: timeString,
        available: true, // Assume all available if API fails
      });
      start.setMinutes(start.getMinutes() + 30); // 30-minute slots
    }
    
    setAvailableTimeSlots(slots);
  };

  // Fetch doctor data
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/healthprovider/public-profile/${id}`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            console.log('Doctor data received:', data.data);
            console.log('Day availabilities:', data.data.dayAvailabilities);
            setDoctorData(data.data);
            
            // Generate fallback slots if doctor has availability
            // Real availability will be fetched when user selects a date
            if (data.data.availableTimeStart && data.data.availableTimeEnd) {
              generateFallbackSlots();
            }
          } else {
            setError('Doctor profile not found');
          }
        } else {
          setError('Failed to load doctor profile');
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error);
        setError('Failed to load doctor profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDoctorData();
    }
  }, [id, user?.token]);

  // Fetch available time slots when date is selected
  useEffect(() => {
    if (selectedDate && id && doctorData) {
      // Check if date is available before fetching slots
      if (isDateAvailable(selectedDate)) {
        fetchAvailableTimeSlots(selectedDate);
      } else {
        setError('The selected date is not available. Please choose another date.');
        setAvailableTimeSlots([]);
      }
    }
  }, [selectedDate, fetchAvailableTimeSlots, doctorData]);

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedDate || !selectedTime) {
        setError('Please select both date and time');
        return;
      }
      // Validate that the selected date is on an available day
      if (!isDateAvailable(selectedDate)) {
        const dayName = getDayName(selectedDate);
        setError(`Dr. ${doctorData?.firstName} ${doctorData?.lastName} is not available on ${dayName}. Please select a date when the doctor is available.`);
        return;
      }
    }
    if (activeStep === 1 && !visitDescription.trim()) {
      setError('Please provide a description for your visit');
      return;
    }
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (!user?.token || !id) {
      setError('Authentication required');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      // Combine date and time into a single Date object
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      // Verify the date is in the future
      if (appointmentDateTime <= new Date()) {
        setError('Appointment date and time must be in the future');
        setSubmitting(false);
        return;
      }

      // Verify the date is on an available day
      if (!isDateAvailable(selectedDate)) {
        const dayName = getDayName(selectedDate);
        setError(`Dr. ${doctorData?.firstName} ${doctorData?.lastName} is not available on ${dayName}. Please select a date when the doctor is available.`);
        setSubmitting(false);
        return;
      }

      // Check if doctor is a psychiatrist (has PSYCHIATRY specialization)
      const isPsychiatrist = doctorData?.specializations?.some(spec => spec === 'PSYCHIATRY') || false;
      
      // Call the backend API to book the appointment
      const response = await fetch('http://localhost:8080/appointments/book', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: parseInt(id),
          appointmentDateTime: appointmentDateTime.toISOString(),
          description: visitDescription.trim(),
          shareMedicalRecords: shareMedicalRecords,
          isVideoCall: isPsychiatrist ? isVideoCall : false, // Only send video call flag if psychiatrist
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to book appointment' }));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `Failed to book appointment (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log('Booking Response:', data);
      
      if (data.status === 'success') {
        setSuccess(true);
      } else {
        throw new Error(data.message || 'Failed to book appointment');
      }
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(error.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getNextAvailableDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  /**
   * Get the day name from a date string (e.g., "Monday", "Tuesday")
   */
  const getDayName = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  /**
   * Normalize day name for comparison (handles variations)
   */
  const normalizeDayName = (dayName: string): string => {
    return dayName.trim().toLowerCase();
  };

  /**
   * Check if a date falls on one of the doctor's available days
   * Uses new dayAvailabilities system if available, otherwise falls back to old availableDays
   */
  const isDateAvailable = (dateString: string): boolean => {
    const dayName = getDayName(dateString);
    const normalizedDayName = normalizeDayName(dayName);
    
    // First check new dayAvailabilities system
    if (doctorData?.dayAvailabilities && doctorData.dayAvailabilities.length > 0) {
      const dayAvailability = doctorData.dayAvailabilities.find(
        (av: any) => normalizeDayName(av.dayOfWeek) === normalizedDayName
      );
      // If day availability exists, check if it's enabled
      if (dayAvailability) {
        const isEnabled = dayAvailability.enabled === true;
        console.log(`Day availability check for ${dayName}:`, {
          dayOfWeek: dayAvailability.dayOfWeek,
          enabled: dayAvailability.enabled,
          isEnabled
        });
        return isEnabled;
      }
      // If day not found in dayAvailabilities array, it means it was never configured
      // In this case, we should fall back to old system or treat as unavailable
      console.log(`Day ${dayName} not found in dayAvailabilities, falling back to old system`);
    }
    
    // Fallback to old availableDays system
    if (!doctorData?.availableDays || doctorData.availableDays.length === 0) {
      // If no available days specified, allow all dates (backward compatibility)
      console.log(`No day restrictions found, allowing ${dayName}`);
      return true;
    }
    
    // Check if the day name matches any of the available days (case-insensitive)
    const isInAvailableDays = doctorData.availableDays.some(
      availableDay => normalizeDayName(availableDay) === normalizedDayName
    );
    console.log(`Old system check for ${dayName}:`, {
      availableDays: doctorData.availableDays,
      isInAvailableDays
    });
    return isInAvailableDays;
  };

  /**
   * Get the next available date that falls on one of the doctor's available days
   */
  const getNextAvailableDateOnAvailableDay = (): string => {
    if (!doctorData?.availableDays || doctorData.availableDays.length === 0) {
      return getNextAvailableDate();
    }

    let date = new Date();
    date.setDate(date.getDate() + 1); // Start from tomorrow
    
    // Try up to 14 days ahead to find an available day
    for (let i = 0; i < 14; i++) {
      const dateString = date.toISOString().split('T')[0];
      if (isDateAvailable(dateString)) {
        return dateString;
      }
      date.setDate(date.getDate() + 1);
    }
    
    // Fallback to tomorrow if no available day found
    return getNextAvailableDate();
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

  // Don't render if user is not logged in (will be redirected by useEffect)
  if (!user?.token) {
    return null;
  }

  if (loading) {
    return (
      <PatientLayout title="Book Appointment" subtitle="Loading doctor information...">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PatientLayout>
    );
  }

  if (error && !doctorData) {
    return (
      <PatientLayout title="Book Appointment" subtitle="Error loading doctor information">
        <Box p={3}>
          <Alert severity="error">{error}</Alert>
          <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
            Go Back
          </Button>
        </Box>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="Book Appointment" subtitle={`Schedule your visit with Dr. ${doctorData?.firstName} ${doctorData?.lastName}`}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* Doctor Info Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                src={doctorData?.profilePicture}
                sx={{ width: 80, height: 80 }}
              >
                {doctorData?.firstName?.[0]}{doctorData?.lastName?.[0]}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6" gutterBottom>
                Dr. {doctorData?.firstName} {doctorData?.lastName}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {doctorData?.specializations?.map((spec, index) => (
                  <Chip key={index} label={spec} size="small" color="primary" variant="outlined" />
                ))}
              </Box>
              {doctorData?.clinicName && (
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocalHospital fontSize="small" />
                  {doctorData.clinicName}
                </Typography>
              )}
              {doctorData?.consultationFee && (
                <Typography variant="body2" color="text.secondary">
                  Consultation Fee: ${doctorData.consultationFee}
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Paper sx={{ p: 4 }}>
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday />
              Select Date & Time
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Select Date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setError(null); // Clear previous errors
                    
                    if (!newDate) {
                      setSelectedDate('');
                      setSelectedTime('');
                      return;
                    }
                    
                    // Validate that the selected date is on an available day
                    if (!isDateAvailable(newDate)) {
                      const dayName = getDayName(newDate);
                      setError(`Dr. ${doctorData?.firstName} ${doctorData?.lastName} is not available on ${dayName}. Please select a date when the doctor is available.`);
                      setSelectedDate('');
                      setSelectedTime('');
                      setAvailableTimeSlots([]);
                      return;
                    }
                    
                    setSelectedDate(newDate);
                    setSelectedTime(''); // Clear selected time when date changes
                  }}
                  inputProps={{
                    min: getNextAvailableDateOnAvailableDay(),
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText={
                    (() => {
                      // Use new dayAvailabilities system if available
                      if (doctorData?.dayAvailabilities && Array.isArray(doctorData.dayAvailabilities) && doctorData.dayAvailabilities.length > 0) {
                        console.log('Using dayAvailabilities:', doctorData.dayAvailabilities);
                        const availableDays = doctorData.dayAvailabilities
                          .filter((av: any) => av.enabled === true || av.enabled === 'true')
                          .map((av: any) => av.dayOfWeek)
                          .filter((day: string) => day); // Remove any null/undefined values
                        console.log('Filtered available days:', availableDays);
                        if (availableDays.length > 0) {
                          return `Available days: ${availableDays.join(', ')}`;
                        } else {
                          return 'No available days. Please contact the doctor.';
                        }
                      }
                      // Fallback to old availableDays system
                      if (doctorData?.availableDays && Array.isArray(doctorData.availableDays) && doctorData.availableDays.length > 0) {
                        return `Available days: ${doctorData.availableDays.join(', ')}`;
                      }
                      return 'Select an appointment date';
                    })()
                  }
                  error={!!error && error.includes('not available on')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Available Time Slots
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableTimeSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={selectedTime === slot.time ? 'contained' : 'outlined'}
                      color={slot.available ? 'primary' : 'secondary'}
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      sx={{ minWidth: 80 }}
                    >
                      {formatTime(slot.time)}
                    </Button>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicalServices />
              Visit Details
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Describe the reason for your visit"
              placeholder="Please provide details about your symptoms, concerns, or the purpose of your visit..."
              value={visitDescription}
              onChange={(e) => setVisitDescription(e.target.value)}
              sx={{ mb: 3 }}
            />
            
            {/* Video Call Option - Only for Psychiatry Doctors */}
            {doctorData?.specializations?.some(spec => spec === 'PSYCHIATRY') && (
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isVideoCall}
                      onChange={(e) => setIsVideoCall(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Video Call Appointment"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                  Choose a video call appointment for your psychiatry consultation. You'll receive a meeting link before the appointment.
                </Typography>
              </Box>
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={shareMedicalRecords}
                  onChange={(e) => setShareMedicalRecords(e.target.checked)}
                  color="primary"
                />
              }
              label="Share my medical records with the doctor"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will allow the doctor to view your medical history, previous diagnoses, and medications to provide better care.
            </Typography>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle />
              Confirm Appointment
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Appointment Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Doctor
                    </Typography>
                    <Typography variant="body1">
                      Dr. {doctorData?.firstName} {doctorData?.lastName}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedDate)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Time
                    </Typography>
                    <Typography variant="body1">
                      {formatTime(selectedTime)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Medical Records
                    </Typography>
                    <Typography variant="body1">
                      {shareMedicalRecords ? 'Shared' : 'Not Shared'}
                    </Typography>
                  </Grid>
                  
                  {doctorData?.specializations?.some(spec => spec === 'PSYCHIATRY') && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Appointment Type
                      </Typography>
                      <Typography variant="body1">
                        {isVideoCall ? 'Video Call' : 'In-Person'}
                      </Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Visit Description
                    </Typography>
                    <Typography variant="body1">
                      {visitDescription}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <Schedule />}
              >
                {submitting ? 'Booking...' : 'Book Appointment'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={success} onClose={() => navigate('/patient-appointments')}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5">
            Appointment Booked Successfully!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" textAlign="center">
            Your appointment has been booked and the doctor will be notified.
            You will receive a confirmation notifcation shortly.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" onClick={() => navigate('/patient-appointments')}>
            View My Appointments
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </PatientLayout>
  );
};

export default BookAppointment;
