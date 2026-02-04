import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Divider,
  Alert,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  CalendarToday,
  Schedule,
  Block,
  Edit,
  Save,
  Delete,
  Add,
  AccessTime,
} from '@mui/icons-material';
import DoctorLayout from '../components/DoctorLayout';
import { useAuth } from '../context/AuthContext';

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
      id={`schedule-tabpanel-${index}`}
      aria-labelledby={`schedule-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface DayAvailability {
  dayOfWeek: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface BlockedTimeSlot {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorSchedule: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Weekly Availability State
  const [dayAvailabilities, setDayAvailabilities] = useState<DayAvailability[]>([]);
  const [appointmentDuration, setAppointmentDuration] = useState<number>(30);

  // Blocked Time Slots State
  const [blockedSlots, setBlockedSlots] = useState<BlockedTimeSlot[]>([]);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [newBlockedSlot, setNewBlockedSlot] = useState<BlockedTimeSlot>({
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  });

  // Initialize day availabilities
  useEffect(() => {
    const initialAvailabilities: DayAvailability[] = DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day,
      enabled: false,
      startTime: '09:00',
      endTime: '17:00',
    }));
    setDayAvailabilities(initialAvailabilities);
  }, []);

  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.token) return;

      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/healthprovider/schedule', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data) {
            // Update day availabilities
            if (data.data.dayAvailabilities && data.data.dayAvailabilities.length > 0) {
              const availabilitiesMap = new Map<string, any>(
                data.data.dayAvailabilities.map((av: any) => [av.dayOfWeek, av])
              );
              const updatedAvailabilities: DayAvailability[] = DAYS_OF_WEEK.map(day => {
                const existing: any = availabilitiesMap.get(day);
                if (existing) {
                  return {
                    dayOfWeek: existing.dayOfWeek || day,
                    enabled: existing.enabled !== undefined ? existing.enabled : false,
                    startTime: existing.startTime || '09:00',
                    endTime: existing.endTime || '17:00',
                  };
                }
                return {
                  dayOfWeek: day,
                  enabled: false,
                  startTime: '09:00',
                  endTime: '17:00',
                };
              });
              setDayAvailabilities(updatedAvailabilities);
            }
            // Update appointment duration
            if (data.data.appointmentDurationMinutes) {
              setAppointmentDuration(data.data.appointmentDurationMinutes);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user?.token]);

  // Fetch blocked slots
  useEffect(() => {
    const fetchBlockedSlots = async () => {
      if (!user?.token) return;

      try {
        const response = await fetch('http://localhost:8080/healthprovider/blocked-slots', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data) {
            setBlockedSlots(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching blocked slots:', error);
      }
    };

    if (tabValue === 1) {
      fetchBlockedSlots();
    }
  }, [user?.token, tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDayAvailabilityChange = (day: string, field: keyof DayAvailability, value: any) => {
    setDayAvailabilities(prev =>
      prev.map(av =>
        av.dayOfWeek === day ? { ...av, [field]: value } : av
      )
    );
  };

  const handleSaveSchedule = async () => {
    if (!user?.token) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('http://localhost:8080/healthprovider/schedule', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayAvailabilities: dayAvailabilities,
          appointmentDurationMinutes: appointmentDuration,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setSuccess('Schedule updated successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(data.message || 'Failed to update schedule');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update schedule' }));
        setError(errorData.message || 'Failed to update schedule');
      }
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      setError(error.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlockedSlot = async () => {
    if (!user?.token || !newBlockedSlot.date || !newBlockedSlot.startTime) {
      setError('Please fill in date and start time');
      return;
    }

    // Calculate end time based on appointment duration
    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      startDate.setMinutes(startDate.getMinutes() + durationMinutes);
      const endHours = startDate.getHours().toString().padStart(2, '0');
      const endMinutes = startDate.getMinutes().toString().padStart(2, '0');
      return `${endHours}:${endMinutes}`;
    };

    const endTime = calculateEndTime(newBlockedSlot.startTime, appointmentDuration);

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('http://localhost:8080/healthprovider/blocked-slots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newBlockedSlot,
          endTime: endTime,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setBlockedSlots(prev => [...prev, { ...newBlockedSlot, id: data.data.id }]);
          setNewBlockedSlot({ date: '', startTime: '', endTime: '', reason: '' });
          setBlockDialogOpen(false);
          setSuccess('Time slot blocked successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(data.message || 'Failed to block time slot');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to block time slot' }));
        setError(errorData.message || 'Failed to block time slot');
      }
    } catch (error: any) {
      console.error('Error blocking time slot:', error);
      setError(error.message || 'Failed to block time slot');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBlockedSlot = async (id: number) => {
    if (!user?.token) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`http://localhost:8080/healthprovider/blocked-slots/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setBlockedSlots(prev => prev.filter(slot => slot.id !== id));
          setSuccess('Blocked time slot removed successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(data.message || 'Failed to remove blocked time slot');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to remove blocked time slot' }));
        setError(errorData.message || 'Failed to remove blocked time slot');
      }
    } catch (error: any) {
      console.error('Error removing blocked slot:', error);
      setError(error.message || 'Failed to remove blocked time slot');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DoctorLayout title="Schedule" subtitle="Manage your availability and schedule">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout 
      title="Schedule" 
      subtitle="Manage your availability, time slots, and appointments schedule"
    >
      <Box>
        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="schedule management tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<CalendarToday />} 
              iconPosition="start"
              label="Weekly Availability" 
            />
            <Tab 
              icon={<Block />} 
              iconPosition="start"
              label="Blocked Time Slots" 
            />
          </Tabs>
        </Paper>

        {/* Tab 1: Weekly Availability */}
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">
                Weekly Availability
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                onClick={handleSaveSchedule}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Schedule'}
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Appointment Duration */}
            <Box sx={{ mb: 4 }}>
              <FormControl fullWidth sx={{ maxWidth: 300 }}>
                <InputLabel>Appointment Duration</InputLabel>
                <Select
                  value={appointmentDuration}
                  label="Appointment Duration"
                  onChange={(e) => setAppointmentDuration(Number(e.target.value))}
                >
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={45}>45 minutes</MenuItem>
                  <MenuItem value={60}>1 hour</MenuItem>
                  <MenuItem value={90}>1.5 hours</MenuItem>
                  <MenuItem value={120}>2 hours</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This is the time period between appointments. Patients will book slots based on this duration.
              </Typography>
            </Box>

            {/* Day Availabilities */}
            <Grid container spacing={3}>
              {dayAvailabilities.map((availability) => (
                <Grid item xs={12} md={6} key={availability.dayOfWeek}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">{availability.dayOfWeek}</Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={availability.enabled}
                              onChange={(e) =>
                                handleDayAvailabilityChange(availability.dayOfWeek, 'enabled', e.target.checked)
                              }
                            />
                          }
                          label={availability.enabled ? 'Available' : 'Not Available'}
                        />
                      </Box>

                      {availability.enabled && (
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Start Time"
                              type="time"
                              value={availability.startTime}
                              onChange={(e) =>
                                handleDayAvailabilityChange(availability.dayOfWeek, 'startTime', e.target.value)
                              }
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="End Time"
                              type="time"
                              value={availability.endTime}
                              onChange={(e) =>
                                handleDayAvailabilityChange(availability.dayOfWeek, 'endTime', e.target.value)
                              }
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </TabPanel>

        {/* Tab 2: Blocked Time Slots */}
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">
                Blocked Time Slots
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setBlockDialogOpen(true)}
              >
                Block Time Slot
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Block specific time slots when you're unavailable (e.g., phone call appointments, meetings, etc.)
              <br />
              <strong>Note:</strong> Each blocked slot will block one appointment slot ({appointmentDuration} minutes) starting from the selected time.
            </Typography>

            {blockedSlots.length === 0 ? (
              <Alert severity="info">
                No blocked time slots. Click "Block Time Slot" to add one.
              </Alert>
            ) : (
              <List>
                {blockedSlots.map((slot) => (
                  <ListItem
                    key={slot.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={slot.date} size="small" />
                          <AccessTime fontSize="small" />
                          <Typography variant="body1">
                            {slot.startTime} - {slot.endTime} ({appointmentDuration} min)
                          </Typography>
                        </Box>
                      }
                      secondary={slot.reason || 'No reason provided'}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => slot.id && handleRemoveBlockedSlot(slot.id)}
                        disabled={saving}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </TabPanel>

        {/* Block Time Slot Dialog */}
        <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Block Time Slot</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={newBlockedSlot.date}
                onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                margin="normal"
                required
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                }}
              />
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={newBlockedSlot.startTime}
                onChange={(e) => {
                  let timeValue = e.target.value;
                  // Validate and round to nearest valid slot based on appointment duration
                  if (timeValue) {
                    const [hours, minutes] = timeValue.split(':').map(Number);
                    const totalMinutes = hours * 60 + minutes;
                    // Round to nearest appointment duration interval
                    const roundedMinutes = Math.round(totalMinutes / appointmentDuration) * appointmentDuration;
                    const roundedHours = Math.floor(roundedMinutes / 60) % 24;
                    const roundedMins = roundedMinutes % 60;
                    timeValue = `${roundedHours.toString().padStart(2, '0')}:${roundedMins.toString().padStart(2, '0')}`;
                  }
                  setNewBlockedSlot({ ...newBlockedSlot, startTime: timeValue });
                }}
                InputLabelProps={{ shrink: true }}
                margin="normal"
                required
                inputProps={{
                  step: appointmentDuration * 60, // Convert minutes to seconds for HTML5 time input
                }}
                helperText={`This will block ${appointmentDuration} minutes starting from the selected time. Only times aligned with ${appointmentDuration}-minute intervals are allowed.`}
              />
              <TextField
                fullWidth
                label="Reason (Optional)"
                placeholder="e.g., Phone call appointment, Meeting, etc."
                value={newBlockedSlot.reason}
                onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, reason: e.target.value })}
                margin="normal"
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBlockDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleAddBlockedSlot}
              variant="contained"
              disabled={saving || !newBlockedSlot.date || !newBlockedSlot.startTime}
              startIcon={saving ? <CircularProgress size={20} /> : undefined}
            >
              {saving ? 'Blocking...' : 'Block Time Slot'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DoctorLayout>
  );
};

export default DoctorSchedule;
