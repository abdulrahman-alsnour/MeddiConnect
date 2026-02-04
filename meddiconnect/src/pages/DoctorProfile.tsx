import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Avatar,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as HospitalIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import DoctorLayout from '../components/DoctorLayout';
import { INSURANCE_PROVIDERS } from '../constants/insuranceProviders';

// Interface for doctor profile data
interface DoctorProfileData {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
  consultationFee: number;
  bio: string;
  clinicName: string;
  licenseNumber: string;
  availableDays: string[];
  availableTimeStart: string;
  availableTimeEnd: string;
  insuranceAccepted: string[];
  specializations: string[];
  educationHistories: EducationHistoryData[];
  workExperiences: WorkExperienceData[];
}

interface EducationHistoryData {
  id: number;
  institutionName: string;
  startDate: string;
  endDate: string;
  stillEnrolled: boolean;
}

interface WorkExperienceData {
  id: number;
  organizationName: string;
  roleTitle: string;
  startDate: string;
  endDate: string;
  stillWorking: boolean;
}

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const specialties = [
  { value: 'INTERNAL_MEDICINE', label: 'Internal Medicine and its subspecialties' },
  { value: 'GENERAL_SURGERY', label: 'Surgical treatment of a wide range of conditions' },
  { value: 'PEDIATRICS', label: 'Healthcare for infants, children, and adolescents' },
  { value: 'OBSTETRICS_GYNECOLOGY', label: "Women's reproductive health" },
  { value: 'FAMILY_MEDICINE', label: 'Comprehensive healthcare for all ages' },
  { value: 'PSYCHIATRY', label: 'Mental health and behavioral conditions' },
  { value: 'EMERGENCY_MEDICINE', label: 'Immediate decision-making and action for acute illnesses/injuries' },
  { value: 'ANESTHESIOLOGY', label: 'Pain relief and anesthesia for surgical procedures' },
  { value: 'RADIOLOGY', label: 'Medical imaging for diagnosis' },
  { value: 'PATHOLOGY', label: 'Study and diagnosis of disease' },
  { value: 'ORTHOPEDIC_SURGERY', label: 'Surgery of the bones and joints' },
  { value: 'NEUROSURGERY', label: 'Surgery of the brain and nervous system' },
  { value: 'CARDIOLOGY', label: 'Heart and cardiovascular care' },
  { value: 'DERMATOLOGY', label: 'Skin conditions' },
  { value: 'NEUROLOGY', label: 'Nervous system disorders' },
  { value: 'UROLOGY', label: 'Urinary tract and male reproductive organs' },
  { value: 'PLASTIC_SURGERY', label: 'Reconstructive and cosmetic surgery' },
  { value: 'OPHTHALMOLOGY', label: 'Eye and vision care' },
];

const DoctorProfile: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [doctorData, setDoctorData] = useState<DoctorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<DoctorProfileData>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<EducationHistoryData[]>([]);
  const [editingWorkExperience, setEditingWorkExperience] = useState<WorkExperienceData[]>([]);
  const [editingInsurance, setEditingInsurance] = useState<string[]>([]);

  useEffect(() => {
    fetchDoctorProfile();
  }, [user?.token]);

  const fetchDoctorProfile = async () => {
    if (!user?.token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching doctor profile with token:', user.token.substring(0, 20) + '...');
      
      const response = await fetch('http://localhost:8080/healthprovider/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        if (data.status === 'success') {
          setDoctorData(data.data);
        } else {
          setError(data.message || 'Failed to fetch profile');
        }
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.message || `Server error: ${response.status}`);
        } catch (parseError) {
          setError(`Server error: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      setEditFormData({});
      setEditingEducation([]);
      setEditingWorkExperience([]);
      setSaveError(null);
      setSaveSuccess(null);
    } else {
      // Start editing - populate form with current data
      console.log('Current doctorData:', doctorData);
      setEditFormData({
        ...doctorData,
      });
      
      // Populate education and work experience arrays for editing
      setEditingEducation(doctorData?.educationHistories || []);
      setEditingWorkExperience(doctorData?.workExperiences || []);
      setEditingInsurance(doctorData?.insuranceAccepted || []);
      console.log('Loaded insurance for editing:', doctorData?.insuranceAccepted);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: keyof DoctorProfileData, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Education management functions
  const addEducation = () => {
    const newEducation: EducationHistoryData = {
      id: Date.now(),
      institutionName: '',
      startDate: '',
      endDate: '',
      stillEnrolled: false
    };
    setEditingEducation(prev => [...prev, newEducation]);
  };

  const updateEducation = (index: number, field: keyof EducationHistoryData, value: any) => {
    setEditingEducation(prev => 
      prev.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    );
  };

  const removeEducation = (index: number) => {
    setEditingEducation(prev => prev.filter((_, i) => i !== index));
  };

  // Work experience management functions
  const addWorkExperience = () => {
    const newWork: WorkExperienceData = {
      id: Date.now(),
      organizationName: '',
      roleTitle: '',
      startDate: '',
      endDate: '',
      stillWorking: false
    };
    setEditingWorkExperience(prev => [...prev, newWork]);
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperienceData, value: any) => {
    setEditingWorkExperience(prev => 
      prev.map((work, i) => 
        i === index ? { ...work, [field]: value } : work
      )
    );
  };

  const removeWorkExperience = (index: number) => {
    setEditingWorkExperience(prev => prev.filter((_, i) => i !== index));
  };

  // Insurance management functions - using multi-select dropdown
  const handleInsuranceChange = (event: any) => {
    const value = event.target.value;
    setEditingInsurance(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSaveProfile = async () => {
    if (!user?.token) {
      setSaveError('Not authenticated');
      return;
    }

    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Prepare the complete data to send
      // Exclude availability fields - they should only be managed from the Schedule page
      const { availableDays, availableTimeStart, availableTimeEnd, ...profileData } = editFormData;
      const dataToSend = {
        ...profileData,
        educationHistories: editingEducation.map(edu => ({
          institutionName: edu.institutionName,
          startDate: edu.startDate,
          endDate: edu.endDate,
          stillEnrolled: edu.stillEnrolled
        })),
        workExperiences: editingWorkExperience.map(work => ({
          organizationName: work.organizationName,
          roleTitle: work.roleTitle,
          startDate: work.startDate,
          endDate: work.endDate,
          stillWorking: work.stillWorking
        })),
        insuranceAccepted: editingInsurance
      };
      
      console.log('Sending data to backend:', dataToSend);
      console.log('Insurance being sent:', editingInsurance);

      const response = await fetch('http://localhost:8080/healthprovider/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setDoctorData(data.data);
          setSaveSuccess('Profile updated successfully!');
          setIsEditing(false);
          setEditFormData({});
          setEditingEducation([]);
          setEditingWorkExperience([]);
          setEditingInsurance([]);
        } else {
          setSaveError(data.message || 'Failed to update profile');
        }
      } else {
        const errorData = await response.json();
        setSaveError(errorData.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError('Failed to update profile. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <DoctorLayout title="My Profile" subtitle="Loading your profile...">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </DoctorLayout>
    );
  }

  if (error) {
    return (
      <DoctorLayout title="My Profile" subtitle="Profile Error">
        <Alert severity="error">{error}</Alert>
      </DoctorLayout>
    );
  }

  if (!doctorData) {
    return (
      <DoctorLayout title="My Profile" subtitle="Profile Not Found">
        <Alert severity="warning">No doctor data found.</Alert>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout title="My Profile" subtitle="View and update your professional profile">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main', fontSize: '2rem' }}>
            {doctorData.firstName.charAt(0)}{doctorData.lastName.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Dr. {doctorData.firstName} {doctorData.lastName}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Username: {doctorData.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label="Healthcare Provider" color="primary" size="small" />
              <Chip label="Licensed" color="success" size="small" />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                  color="success"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleEditToggle}
                  disabled={saveLoading}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditToggle}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(null)}>
          {saveSuccess}
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Basic Information" />
          <Tab label="Professional Information" />
          <Tab label="Clinic Information" />
          <Tab label="Education & Experience" />
        </Tabs>
      </Box>

      {/* Basic Information Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  Personal Details
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={editFormData.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={editFormData.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={editFormData.phoneNumber || ''}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        value={editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={editFormData.gender || ''}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          label="Gender"
                        >
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Email" 
                        secondary={doctorData.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PhoneIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Phone" 
                        secondary={doctorData.phoneNumber}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CalendarIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Date of Birth" 
                        secondary={new Date(doctorData.dateOfBirth).toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Gender" 
                        secondary={doctorData.gender}
                      />
                    </ListItem>
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <HospitalIcon sx={{ mr: 1 }} />
                  License Information
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="License Number"
                        value={editFormData.licenseNumber || ''}
                        onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        multiline
                        rows={4}
                        value={editFormData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><HospitalIcon /></ListItemIcon>
                      <ListItemText 
                        primary="License Number" 
                        secondary={doctorData.licenseNumber || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Bio" 
                        secondary={doctorData.bio || 'Not provided'}
                      />
                    </ListItem>
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Professional Information Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <HospitalIcon sx={{ mr: 1 }} />
                  Specializations
                </Typography>
                {isEditing ? (
                  <FormControl fullWidth>
                    <InputLabel>Select Specializations</InputLabel>
                    <Select
                      multiple
                      value={editFormData.specializations || []}
                      onChange={(e) => handleInputChange('specializations', e.target.value)}
                      renderValue={(selected) =>
                        specialties
                          .filter(option => selected.includes(option.value))
                          .map(option => option.label)
                          .join(', ')
                      }
                    >
                      {specialties.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {doctorData.specializations && doctorData.specializations.length > 0 ? (
                      doctorData.specializations.map((spec, index) => {
                        const specialty = specialties.find(s => s.value === spec);
                        return (
                          <Chip 
                            key={index} 
                            label={specialty ? specialty.label : spec} 
                            color="primary" 
                            variant="outlined" 
                          />
                        );
                      })
                    ) : (
                      <Typography color="text.secondary">No specializations specified</Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Clinic Information Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <HospitalIcon sx={{ mr: 1 }} />
                  Clinic Details
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Clinic Name"
                        value={editFormData.clinicName || ''}
                        onChange={(e) => handleInputChange('clinicName', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={editFormData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        value={editFormData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Country"
                        value={editFormData.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><HospitalIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Clinic Name" 
                        secondary={doctorData.clinicName || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Address" 
                        secondary={doctorData.address || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="City" 
                        secondary={doctorData.city || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Country" 
                        secondary={doctorData.country || 'Not provided'}
                      />
                    </ListItem>
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ mr: 1 }} />
                  Consultation & Availability
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Consultation Fee ($)"
                        type="number"
                        value={editFormData.consultationFee || 0}
                        onChange={(e) => handleInputChange('consultationFee', parseFloat(e.target.value) || 0)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mt: 1 }}>
                        To manage your schedule, availability, and appointment duration, please use the <strong>Schedule</strong> page from the sidebar menu.
                      </Alert>
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><MoneyIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Consultation Fee" 
                        secondary={`$${doctorData.consultationFee || 0}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><ScheduleIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Schedule Management" 
                        secondary="Manage your availability, working hours, and appointment duration from the Schedule page"
                      />
                    </ListItem>
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Insurance Management Card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <HospitalIcon sx={{ mr: 1 }} />
                  Accepted Insurances
                </Typography>
                {isEditing ? (
                  <Box>
                    {/* Multi-select dropdown for insurance */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Select Accepted Insurances</InputLabel>
                      <Select
                        multiple
                        value={editingInsurance}
                        onChange={handleInsuranceChange}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {INSURANCE_PROVIDERS.map((insurance) => (
                          <MenuItem key={insurance} value={insurance}>
                            {insurance}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {doctorData.insuranceAccepted && doctorData.insuranceAccepted.length > 0 ? (
                        doctorData.insuranceAccepted.map((insurance, index) => (
                          <Chip
                            key={index}
                            label={insurance}
                            color="secondary"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No insurance information provided
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Education & Experience Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon sx={{ mr: 1 }} />
                  Education History
                </Typography>
                {isEditing ? (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addEducation}
                      sx={{ mb: 2 }}
                    >
                      Add Education
                    </Button>
                    {editingEducation.map((edu, index) => (
                      <Card key={index} sx={{ mb: 2, p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Institution Name"
                              value={edu.institutionName}
                              onChange={(e) => updateEducation(index, 'institutionName', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Start Date"
                              type="date"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="End Date"
                              type="date"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              disabled={edu.stillEnrolled}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={edu.stillEnrolled}
                                  onChange={(e) => updateEducation(index, 'stillEnrolled', e.target.checked)}
                                  size="small"
                                />
                              }
                              label="Still Enrolled"
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removeEducation(index)}
                              startIcon={<DeleteIcon />}
                            >
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Institution</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {doctorData.educationHistories && doctorData.educationHistories.length > 0 ? (
                          doctorData.educationHistories.map((edu, index) => (
                            <TableRow key={index}>
                              <TableCell>{edu.institutionName}</TableCell>
                              <TableCell>{edu.startDate ? new Date(edu.startDate).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>{edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={edu.stillEnrolled ? 'Currently Enrolled' : 'Completed'} 
                                  color={edu.stillEnrolled ? 'success' : 'default'} 
                                  size="small" 
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">No education history recorded</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <WorkIcon sx={{ mr: 1 }} />
                  Work Experience
                </Typography>
                {isEditing ? (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addWorkExperience}
                      sx={{ mb: 2 }}
                    >
                      Add Work Experience
                    </Button>
                    {editingWorkExperience.map((work, index) => (
                      <Card key={index} sx={{ mb: 2, p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Organization"
                              value={work.organizationName}
                              onChange={(e) => updateWorkExperience(index, 'organizationName', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Role Title"
                              value={work.roleTitle}
                              onChange={(e) => updateWorkExperience(index, 'roleTitle', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Start Date"
                              type="date"
                              value={work.startDate}
                              onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="End Date"
                              type="date"
                              value={work.endDate}
                              onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              disabled={work.stillWorking}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={work.stillWorking}
                                  onChange={(e) => updateWorkExperience(index, 'stillWorking', e.target.checked)}
                                  size="small"
                                />
                              }
                              label="Still Working"
                            />
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removeWorkExperience(index)}
                              startIcon={<DeleteIcon />}
                            >
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Organization</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {doctorData.workExperiences && doctorData.workExperiences.length > 0 ? (
                          doctorData.workExperiences.map((work, index) => (
                            <TableRow key={index}>
                              <TableCell>{work.organizationName}</TableCell>
                              <TableCell>{work.roleTitle}</TableCell>
                              <TableCell>{work.startDate ? new Date(work.startDate).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>{work.endDate ? new Date(work.endDate).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={work.stillWorking ? 'Currently Working' : 'Completed'} 
                                  color={work.stillWorking ? 'success' : 'default'} 
                                  size="small" 
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center">No work experience recorded</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </DoctorLayout>
  );
};

export default DoctorProfile;
