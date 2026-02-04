import React, { useState, useEffect } from 'react';
import {
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
} from '@mui/material';
import PatientLayout from '../components/PatientLayout';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Height as HeightIcon,
  MonitorWeight as WeightIcon,
  LocalHospital as BloodTypeIcon,
  Warning as WarningIcon,
  HealthAndSafety as HealthIcon,
  People as FamilyIcon,
  Medication as MedicationIcon,
  Restaurant as RestaurantIcon,
  Sports as SportsIcon,
  SmokingRooms as SmokingIcon,
  Psychology as PsychologyIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { CircularProgress } from '@mui/material';
import { INSURANCE_PROVIDERS } from '../constants/insuranceProviders';

// Interface for patient profile data
interface PatientProfileData {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  registrationDate: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  allergies?: string;
  medicalConditions?: string;
  previousSurgeries?: string;
  familyMedicalHistory?: string;
  dietaryHabits?: string;
  alcoholConsumption?: string;
  physicalActivity?: string;
  smokingStatus?: string;
  mentalHealthCondition?: string;
  medications: MedicationData[];
  mentalHealthMedications: MentalHealthMedicationData[];
  labResults: LabResult[];
  insuranceProvider?: string;
  insuranceNumber?: string;
}

interface MedicationData {
  id: number;
  medicationName: string;
  medicationDosage: string;
  medicationFrequency: string;
  medicationStartDate: string;
  medicationEndDate: string;
  inUse: boolean;
}

interface MentalHealthMedicationData {
  id: number;
  medicationName: string;
  medicationDosage: string;
  medicationFrequency: string;
  medicationStartDate: string;
  medicationEndDate: string;
  inUse: boolean;
}

interface LabResult {
  id: number;
  description: string;
  hasImage: boolean;
  imageSize: number;
  resultUrl?: string;
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

const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [patientData, setPatientData] = useState<PatientProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PatientProfileData>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [editingMedications, setEditingMedications] = useState<MedicationData[]>([]);
  const [editingMentalHealthMedications, setEditingMentalHealthMedications] = useState<MentalHealthMedicationData[]>([]);
  // Lab results upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPatientProfile();
  }, [user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPatientProfile = async () => {
    if (!user?.token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching patient profile with token:', user.token.substring(0, 20) + '...');
      
      const response = await fetch('http://localhost:8080/patient/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        if (data.status === 'success') {
          setPatientData(data.data);
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
      console.error('Error fetching patient profile:', error);
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
      setEditingMedications([]);
      setEditingMentalHealthMedications([]);
      setSaveError(null);
      setSaveSuccess(null);
    } else {
      // Start editing - populate form with current data
      console.log('Current patientData:', patientData);
      setEditFormData({
        ...patientData,
        // Ensure all fields are properly mapped with fallback to current data
        dietaryHabits: patientData?.dietaryHabits || '',
        physicalActivity: patientData?.physicalActivity || '',
        smokingStatus: patientData?.smokingStatus || '',
        alcoholConsumption: patientData?.alcoholConsumption || '',
        mentalHealthCondition: patientData?.mentalHealthCondition || '',
        bloodType: patientData?.bloodType || '',
      });
      
      // Populate medication arrays for editing
      console.log('Current medications:', patientData?.medications);
      console.log('Current mental health medications:', patientData?.mentalHealthMedications);
      
      setEditingMedications(patientData?.medications || []);
      setEditingMentalHealthMedications(patientData?.mentalHealthMedications || []);
      
      console.log('Populated editFormData:', {
        dietaryHabits: patientData?.dietaryHabits,
        physicalActivity: patientData?.physicalActivity,
        smokingStatus: patientData?.smokingStatus,
        alcoholConsumption: patientData?.alcoholConsumption,
        mentalHealthCondition: patientData?.mentalHealthCondition,
        bloodType: patientData?.bloodType,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: keyof PatientProfileData, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Medication management functions
  const addMedication = () => {
    const newMedication: MedicationData = {
      id: Date.now(), // Temporary ID
      medicationName: '',
      medicationDosage: '',
      medicationFrequency: '',
      medicationStartDate: '',
      medicationEndDate: '',
      inUse: true
    };
    console.log('Adding new medication:', newMedication);
    setEditingMedications(prev => {
      const updated = [...prev, newMedication];
      console.log('Updated medications array:', updated);
      return updated;
    });
  };

  const updateMedication = (index: number, field: keyof MedicationData, value: any) => {
    console.log(`Updating medication ${index}, field ${field}, value:`, value);
    setEditingMedications(prev => {
      const updated = prev.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      );
      console.log('Updated medications after change:', updated);
      return updated;
    });
  };

  const removeMedication = (index: number) => {
    setEditingMedications(prev => prev.filter((_, i) => i !== index));
  };

  const addMentalHealthMedication = () => {
    const newMedication: MentalHealthMedicationData = {
      id: Date.now(), // Temporary ID
      medicationName: '',
      medicationDosage: '',
      medicationFrequency: '',
      medicationStartDate: '',
      medicationEndDate: '',
      inUse: true
    };
    setEditingMentalHealthMedications(prev => [...prev, newMedication]);
  };

  const updateMentalHealthMedication = (index: number, field: keyof MentalHealthMedicationData, value: any) => {
    setEditingMentalHealthMedications(prev => 
      prev.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    );
  };

  const removeMentalHealthMedication = (index: number) => {
    setEditingMentalHealthMedications(prev => prev.filter((_, i) => i !== index));
  };

  // Lab result management functions
  const fetchLabResults = async () => {
    if (!user?.token) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/patient/lab-results', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && patientData) {
          setPatientData({
            ...patientData,
            labResults: data.data || []
          });
        }
      }
    } catch (error) {
      console.error('Error fetching lab results:', error);
    }
  };

  const handleUploadLabResult = async () => {
    if (!user?.token) {
      setUploadError('Not authenticated');
      return;
    }

    if (!uploadFile) {
      setUploadError('Please select a PDF file');
      return;
    }

    // Validate file type
    if (uploadFile.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (uploadFile.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    if (!uploadDescription.trim()) {
      setUploadError('Please enter a description');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('description', uploadDescription);

      const response = await fetch('http://localhost:8080/patient/lab-result/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setUploadSuccess('Lab result uploaded successfully!');
        setUploadFile(null);
        setUploadDescription('');
        // Reset file input
        const fileInput = document.getElementById('lab-result-file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        // Refresh lab results list
        await fetchLabResults();
        // Also refresh full profile to ensure consistency
        await fetchPatientProfile();
      } else {
        setUploadError(data.message || 'Failed to upload lab result');
      }
    } catch (error) {
      console.error('Error uploading lab result:', error);
      setUploadError('Failed to upload lab result. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLabResult = async (id: number) => {
    if (!user?.token) {
      setUploadError('Not authenticated');
      return;
    }

    setDeleting(true);
    setUploadError(null);

    try {
      const response = await fetch(`http://localhost:8080/patient/lab-result/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setUploadSuccess('Lab result deleted successfully!');
        setDeleteConfirmId(null);
        // Refresh lab results list
        await fetchLabResults();
        // Also refresh full profile to ensure consistency
        await fetchPatientProfile();
      } else {
        setUploadError(data.message || 'Failed to delete lab result');
      }
    } catch (error) {
      console.error('Error deleting lab result:', error);
      setUploadError('Failed to delete lab result. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewLabResultPdf = async (id: number) => {
    if (!user?.token) {
      setUploadError('Not authenticated');
      return;
    }

    try {
      // Fetch the PDF with authentication
      const response = await fetch(`http://localhost:8080/patient/lab-result/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setUploadError('Access denied. You do not have permission to view this lab result.');
        } else if (response.status === 404) {
          setUploadError('Lab result not found.');
        } else {
          setUploadError('Failed to load PDF. Please try again.');
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
        setUploadError('Popup blocked. Please allow popups for this site to view PDFs.');
      }
    } catch (error) {
      console.error('Error viewing lab result PDF:', error);
      setUploadError('Failed to load PDF. Please try again.');
    }
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
      const dataToSend = {
        ...editFormData,
        medications: editingMedications.map(med => ({
          medicationName: med.medicationName,
          medicationDosage: med.medicationDosage,
          medicationFrequency: med.medicationFrequency,
          medicationStartDate: med.medicationStartDate,
          medicationEndDate: med.medicationEndDate,
          inUse: med.inUse
        })),
        mentalHealthMedications: editingMentalHealthMedications.map(med => ({
          medicationName: med.medicationName,
          medicationDosage: med.medicationDosage,
          medicationFrequency: med.medicationFrequency,
          medicationStartDate: med.medicationStartDate,
          medicationEndDate: med.medicationEndDate,
          inUse: med.inUse
        }))
      };
      
      console.log('Sending data to backend:', dataToSend);
      console.log('Medications being sent:', dataToSend.medications);
      console.log('Mental health medications being sent:', dataToSend.mentalHealthMedications);

      // Try PUT first, fallback to POST if needed
      let response = await fetch('http://localhost:8080/patient/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      // If PUT fails, try POST as fallback
      if (!response.ok && response.status === 405) {
        console.log('PUT method not supported, trying POST fallback');
        response = await fetch('http://localhost:8080/patient/edit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setPatientData(data.data);
          setSaveSuccess('Profile updated successfully!');
          setIsEditing(false);
          setEditFormData({});
          setEditingMedications([]);
          setEditingMentalHealthMedications([]);
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
      <PatientLayout title="My Profile" subtitle="Loading your profile information...">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </PatientLayout>
    );
  }

  if (error) {
    return (
      <PatientLayout title="My Profile" subtitle="Error loading profile">
        <Alert severity="error">{error}</Alert>
      </PatientLayout>
    );
  }

  if (!patientData) {
    return (
      <PatientLayout title="My Profile" subtitle="No profile data found">
        <Alert severity="warning">No patient data found.</Alert>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="My Profile" subtitle="View and manage your personal and medical information">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main', fontSize: '2rem' }}>
            {patientData.firstName.charAt(0)}{patientData.lastName.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {patientData.firstName} {patientData.lastName}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Username: {patientData.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label="Active Patient" color="success" size="small" />
              <Chip label="Registered" color="info" size="small" />
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
          <Tab label="Medical Information" />
          <Tab label="Lifestyle Information" />
          <Tab label="Current Medications" />
          <Tab label="Laboratory Results" />
          
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
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={editFormData.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
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
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        value={editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={editFormData.gender || ''}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          label="Gender"
                        >
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          
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
                        secondary={patientData.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PhoneIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Phone" 
                        secondary={patientData.phoneNumber}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CalendarIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Date of Birth" 
                        secondary={new Date(patientData.dateOfBirth).toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Gender" 
                        secondary={patientData.gender}
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
                  <HealthIcon sx={{ mr: 1 }} />
                  Insurance Information
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Insurance Provider</InputLabel>
                        <Select
                          value={editFormData.insuranceProvider || ''}
                          label="Insurance Provider"
                          onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                        >
                          <MenuItem value="">None</MenuItem>
                          {INSURANCE_PROVIDERS.map((insurance) => (
                            <MenuItem key={insurance} value={insurance}>
                              {insurance}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Insurance Number"
                        value={editFormData.insuranceNumber || ''}
                        onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><HealthIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Insurance Provider" 
                        secondary={patientData.insuranceProvider || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><HealthIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Insurance Number" 
                        secondary={patientData.insuranceNumber || 'Not provided'}
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
                  <HeightIcon sx={{ mr: 1 }} />
                  Physical Information
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Height (cm)"
                        type="number"
                        value={editFormData.height || ''}
                        onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || null)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Weight (kg)"
                        type="number"
                        value={editFormData.weight || ''}
                        onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || null)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Blood Type</InputLabel>
                        <Select
                          value={editFormData.bloodType || ''}
                          onChange={(e) => handleInputChange('bloodType', e.target.value)}
                          label="Blood Type"
                        >
                          <MenuItem value="">None</MenuItem>
                          <MenuItem value="A_POSITIVE">A+</MenuItem>
                          <MenuItem value="A_NEGATIVE">A-</MenuItem>
                          <MenuItem value="B_POSITIVE">B+</MenuItem>
                          <MenuItem value="B_NEGATIVE">B-</MenuItem>
                          <MenuItem value="AB_POSITIVE">AB+</MenuItem>
                          <MenuItem value="AB_NEGATIVE">AB-</MenuItem>
                          <MenuItem value="O_POSITIVE">O+</MenuItem>
                          <MenuItem value="O_NEGATIVE">O-</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><HeightIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Height" 
                        secondary={patientData.height ? `${patientData.height} cm` : 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><WeightIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Weight" 
                        secondary={patientData.weight ? `${patientData.weight} kg` : 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><BloodTypeIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Blood Type" 
                        secondary={patientData.bloodType || 'Not specified'}
                      />
                    </ListItem>
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Medical Information Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon sx={{ mr: 1 }} />
                  Allergies & Conditions
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Allergies"
                        multiline
                        rows={3}
                        value={editFormData.allergies || ''}
                        onChange={(e) => handleInputChange('allergies', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Medical Conditions"
                        multiline
                        rows={3}
                        value={editFormData.medicalConditions || ''}
                        onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><WarningIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Allergies" 
                        secondary={patientData.allergies || 'None specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><HealthIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Medical Conditions" 
                        secondary={patientData.medicalConditions || 'None specified'}
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
                  <HealthIcon sx={{ mr: 1 }} />
                  Medical History
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Previous Surgeries"
                        multiline
                        rows={3}
                        value={editFormData.previousSurgeries || ''}
                        onChange={(e) => handleInputChange('previousSurgeries', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Family Medical History"
                        multiline
                        rows={3}
                        value={editFormData.familyMedicalHistory || ''}
                        onChange={(e) => handleInputChange('familyMedicalHistory', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><HealthIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Previous Surgeries" 
                        secondary={patientData.previousSurgeries || 'None specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><FamilyIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Family Medical History" 
                        secondary={patientData.familyMedicalHistory || 'None specified'}
                      />
                    </ListItem>
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Lifestyle Information Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <RestaurantIcon sx={{ mr: 1 }} />
                  Diet & Lifestyle
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Dietary Habits</InputLabel>
                        <Select
                          value={editFormData.dietaryHabits || ''}
                          onChange={(e) => handleInputChange('dietaryHabits', e.target.value)}
                          label="Dietary Habits"
                        >
                          <MenuItem value="">None</MenuItem>
                          <MenuItem value="BALANCED_DIET">Balanced Diet</MenuItem>
                          <MenuItem value="VEGETARIAN">Vegetarian</MenuItem>
                          <MenuItem value="VEGAN">Vegan</MenuItem>
                          <MenuItem value="PESCATARIAN">Pescatarian</MenuItem>
                          <MenuItem value="KETO_LOW_CARB">Keto / Low Carb</MenuItem>
                          <MenuItem value="GLUTEN_FREE">Gluten-Free</MenuItem>
                          <MenuItem value="HIGH_PROTEIN">High Protein</MenuItem>
                          <MenuItem value="OTHER">Other</MenuItem>
                          <MenuItem value="PREFER_NOT_TO_SAY">Prefer Not to Say</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Physical Activity</InputLabel>
                        <Select
                          value={editFormData.physicalActivity || ''}
                          onChange={(e) => handleInputChange('physicalActivity', e.target.value)}
                          label="Physical Activity"
                        >
                          <MenuItem value="">None</MenuItem>
                          <MenuItem value="SEDENTARY">Sedentary (Little to no exercise)</MenuItem>
                          <MenuItem value="LIGHTLY_ACTIVE">Lightly Active (Light exercise 1-3 days/week)</MenuItem>
                          <MenuItem value="MODERATELY_ACTIVE">Moderately Active (Moderate exercise 3-5 days/week)</MenuItem>
                          <MenuItem value="VERY_ACTIVE">Very Active (Intense exercise 6-7 days/week)</MenuItem>
                          <MenuItem value="ATHLETE">Athlete / High-Performance Training</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><RestaurantIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Dietary Habits" 
                        secondary={patientData.dietaryHabits || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><SportsIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Physical Activity" 
                        secondary={patientData.physicalActivity || 'Not specified'}
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
                  <SmokingIcon sx={{ mr: 1 }} />
                  Health Habits
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Smoking Status</InputLabel>
                        <Select
                          value={editFormData.smokingStatus || ''}
                          onChange={(e) => handleInputChange('smokingStatus', e.target.value)}
                          label="Smoking Status"
                        >
                          <MenuItem value="">None</MenuItem>
                          <MenuItem value="NEVER_SMOKED">Never Smoked</MenuItem>
                          <MenuItem value="FORMER_SMOKER">Former Smoker</MenuItem>
                          <MenuItem value="OCCASIONAL_SMOKER">Occasional Smoker</MenuItem>
                          <MenuItem value="REGULAR_SMOKER">Regular Smoker</MenuItem>
                          <MenuItem value="HEAVY_SMOKER">Heavy Smoker</MenuItem>
                          <MenuItem value="PREFER_NOT_TO_SAY">Prefer Not to Say</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Alcohol Consumption</InputLabel>
                        <Select
                          value={editFormData.alcoholConsumption || ''}
                          onChange={(e) => handleInputChange('alcoholConsumption', e.target.value)}
                          label="Alcohol Consumption"
                        >
                          <MenuItem value="">None</MenuItem>
                          <MenuItem value="NEVER_DRINKS">Never Drinks</MenuItem>
                          <MenuItem value="OCCASIONALLY_DRINKS">Occasionally Drinks (social drinking)</MenuItem>
                          <MenuItem value="REGULARLY_DRINKS">Regularly Drinks (weekly)</MenuItem>
                          <MenuItem value="HEAVY_DRINKER">Heavy Drinker</MenuItem>
                          <MenuItem value="FORMER_DRINKER">Former Drinker</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><SmokingIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Smoking Status" 
                        secondary={patientData.smokingStatus || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><HealthIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Alcohol Consumption" 
                        secondary={patientData.alcoholConsumption || 'Not specified'}
                      />
                    </ListItem>
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PsychologyIcon sx={{ mr: 1 }} />
                  Mental Health
                </Typography>
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Mental Health Condition</InputLabel>
                        <Select
                          value={editFormData.mentalHealthCondition || ''}
                          onChange={(e) => handleInputChange('mentalHealthCondition', e.target.value)}
                          label="Mental Health Condition"
                        >
                          <MenuItem value="">None</MenuItem>
                          <MenuItem value="NO_KNOWN_MENTAL_HEALTH_CONDITIONS">No Known Mental Health Conditions</MenuItem>
                          <MenuItem value="DEPRESSION">Depression</MenuItem>
                          <MenuItem value="ANXIETY_DISORDER_GENERALIZED_ANXIETY_DISORDER">Anxiety Disorder</MenuItem>
                          <MenuItem value="BIPOLAR_DISORDER">Bipolar Disorder</MenuItem>
                          <MenuItem value="POST_TRAUMATIC_STRESS_DISORDER_PTSD">PTSD</MenuItem>
                          <MenuItem value="OBSESSIVE_COMPULSIVE_DISORDER_OCD">OCD</MenuItem>
                          <MenuItem value="SCHIZOPHRENIA">Schizophrenia</MenuItem>
                          <MenuItem value="ATTENTION_DEFICIT_HYPERACTIVITY_DISORDER_ADHD">ADHD</MenuItem>
                          <MenuItem value="AUTISM_SPECTRUM_DISORDER_ASD">Autism Spectrum Disorder</MenuItem>
                          <MenuItem value="PANIC_DISORDER">Panic Disorder</MenuItem>
                          <MenuItem value="SOCIAL_ANXIETY_DISORDER">Social Anxiety Disorder</MenuItem>
                          <MenuItem value="EATING_DISORDER_E_G_ANOREXIA_BULIMIA">Eating Disorder</MenuItem>
                          <MenuItem value="SUBSTANCE_USE_DISORDER_ALCOHOL_OR_DRUGS">Substance Use Disorder</MenuItem>
                          <MenuItem value="INSOMNIA_CHRONIC_SLEEP_DISORDER">Insomnia / Chronic Sleep Disorder</MenuItem>
                          <MenuItem value="DEMENTIA_COGNITIVE_DECLINE">Dementia / Cognitive Decline</MenuItem>
                          <MenuItem value="ALZHEIMER_DISEASE">Alzheimer's Disease</MenuItem>
                          <MenuItem value="OTHER">Other</MenuItem>
                          <MenuItem value="PREFER_NOT_TO_SAY">Prefer Not to Say</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemIcon><PsychologyIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Mental Health Condition" 
                        secondary={patientData.mentalHealthCondition || 'Not specified'}
                      />
                    </ListItem>
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Current Medications Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <MedicationIcon sx={{ mr: 1 }} />
                  Current Medications
                </Typography>
                {isEditing ? (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addMedication}
                      sx={{ mb: 2 }}
                    >
                      Add Medication
                    </Button>
                    {editingMedications.map((med, index) => (
                      <Card key={index} sx={{ mb: 2, p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Medication Name"
                              value={med.medicationName}
                              onChange={(e) => updateMedication(index, 'medicationName', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Dosage"
                              value={med.medicationDosage}
                              onChange={(e) => updateMedication(index, 'medicationDosage', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Frequency"
                              value={med.medicationFrequency}
                              onChange={(e) => updateMedication(index, 'medicationFrequency', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Start Date"
                              type="date"
                              value={med.medicationStartDate}
                              onChange={(e) => updateMedication(index, 'medicationStartDate', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="End Date"
                              type="date"
                              value={med.medicationEndDate}
                              onChange={(e) => updateMedication(index, 'medicationEndDate', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={med.inUse}
                                    onChange={(e) => updateMedication(index, 'inUse', e.target.checked)}
                                    size="small"
                                  />
                                }
                                label={med.inUse ? "Active" : "Inactive"}
                                sx={{ fontSize: '0.75rem' }}
                              />
                              <Button
                                size="small"
                                color="error"
                                onClick={() => removeMedication(index)}
                                startIcon={<DeleteIcon />}
                                sx={{ fontSize: '0.7rem', minWidth: 'auto' }}
                              >
                                Remove
                              </Button>
                            </Box>
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
                          <TableCell>Medication Name</TableCell>
                          <TableCell>Dosage</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patientData.medications && patientData.medications.length > 0 ? (
                          patientData.medications.map((med, index) => (
                            <TableRow key={index}>
                              <TableCell>{med.medicationName}</TableCell>
                              <TableCell>{med.medicationDosage}</TableCell>
                              <TableCell>{med.medicationStartDate ? new Date(med.medicationStartDate).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>{med.medicationEndDate ? new Date(med.medicationEndDate).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={med.inUse ? 'Active' : 'Inactive'} 
                                  color={med.inUse ? 'success' : 'default'} 
                                  size="small" 
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center">No medications recorded</TableCell>
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
                  <PsychologyIcon sx={{ mr: 1 }} />
                  Mental Health Medications
                </Typography>
                {isEditing ? (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addMentalHealthMedication}
                      sx={{ mb: 2 }}
                    >
                      Add Mental Health Medication
                    </Button>
                    {editingMentalHealthMedications.map((med, index) => (
                      <Card key={index} sx={{ mb: 2, p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Medication Name"
                              value={med.medicationName}
                              onChange={(e) => updateMentalHealthMedication(index, 'medicationName', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Dosage"
                              value={med.medicationDosage}
                              onChange={(e) => updateMentalHealthMedication(index, 'medicationDosage', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Frequency"
                              value={med.medicationFrequency}
                              onChange={(e) => updateMentalHealthMedication(index, 'medicationFrequency', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Start Date"
                              type="date"
                              value={med.medicationStartDate}
                              onChange={(e) => updateMentalHealthMedication(index, 'medicationStartDate', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="End Date"
                              type="date"
                              value={med.medicationEndDate}
                              onChange={(e) => updateMentalHealthMedication(index, 'medicationEndDate', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={med.inUse}
                                    onChange={(e) => updateMentalHealthMedication(index, 'inUse', e.target.checked)}
                                    size="small"
                                  />
                                }
                                label={med.inUse ? "Active" : "Inactive"}
                                sx={{ fontSize: '0.75rem' }}
                              />
                              <Button
                                size="small"
                                color="error"
                                onClick={() => removeMentalHealthMedication(index)}
                                startIcon={<DeleteIcon />}
                                sx={{ fontSize: '0.7rem', minWidth: 'auto' }}
                              >
                                Remove
                              </Button>
                            </Box>
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
                          <TableCell>Medication Name</TableCell>
                          <TableCell>Dosage</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patientData.mentalHealthMedications && patientData.mentalHealthMedications.length > 0 ? (
                          patientData.mentalHealthMedications.map((med, index) => (
                            <TableRow key={index}>
                              <TableCell>{med.medicationName}</TableCell>
                              <TableCell>{med.medicationDosage}</TableCell>
                              <TableCell>{med.medicationStartDate ? new Date(med.medicationStartDate).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>{med.medicationEndDate ? new Date(med.medicationEndDate).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={med.inUse ? 'Active' : 'Inactive'} 
                                  color={med.inUse ? 'success' : 'default'} 
                                  size="small" 
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center">No mental health medications recorded</TableCell>
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

      {/* Laboratory Results Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <HealthIcon sx={{ mr: 1 }} />
                  Laboratory Results
                </Typography>

                {/* Upload Section */}
                <Box sx={{ mb: 4, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Upload New Lab Result (PDF only, max 5MB)
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <input
                        id="lab-result-file-input"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setUploadFile(file);
                          setUploadError(null);
                        }}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="lab-result-file-input">
                        <Button
                          variant="outlined"
                          component="span"
                          fullWidth
                          sx={{ mb: 1 }}
                        >
                          {uploadFile ? uploadFile.name : 'Choose PDF File'}
                        </Button>
                      </label>
                      {uploadFile && (
                        <Typography variant="caption" color="text.secondary">
                          Size: {(uploadFile.size / 1024).toFixed(1)} KB
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={uploadDescription}
                        onChange={(e) => {
                          setUploadDescription(e.target.value);
                          setUploadError(null);
                        }}
                        placeholder="e.g., Blood Test - Complete Blood Count"
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        variant="contained"
                        onClick={handleUploadLabResult}
                        disabled={uploading || !uploadFile || !uploadDescription.trim()}
                        fullWidth
                        startIcon={<AddIcon />}
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>

                {/* Upload Messages */}
                {uploadError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError(null)}>
                    {uploadError}
                  </Alert>
                )}
                {uploadSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setUploadSuccess(null)}>
                    {uploadSuccess}
                  </Alert>
                )}

                {/* Lab Results List */}
                {patientData.labResults && patientData.labResults.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>File Available</TableCell>
                          <TableCell>File Size</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patientData.labResults.map((labResult) => (
                          <TableRow key={labResult.id}>
                            <TableCell>{labResult.description}</TableCell>
                            <TableCell>
                              <Chip 
                                label={labResult.hasImage ? 'Yes' : 'No'} 
                                color={labResult.hasImage ? 'success' : 'default'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>
                              {labResult.hasImage ? `${(labResult.imageSize / 1024).toFixed(1)} KB` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {labResult.hasImage && (
                                  <Button 
                                    variant="outlined" 
                                    size="small"
                                    onClick={() => handleViewLabResultPdf(labResult.id)}
                                  >
                                    View PDF
                                  </Button>
                                )}
                                {deleteConfirmId === labResult.id ? (
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Typography variant="caption" color="error">
                                      Delete?
                                    </Typography>
                                    <Button
                                      size="small"
                                      color="error"
                                      variant="contained"
                                      onClick={() => handleDeleteLabResult(labResult.id)}
                                      disabled={deleting}
                                    >
                                      Yes
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => setDeleteConfirmId(null)}
                                      disabled={deleting}
                                    >
                                      No
                                    </Button>
                                  </Box>
                                ) : (
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => setDeleteConfirmId(labResult.id)}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No laboratory results found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload your laboratory results using the form above.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </PatientLayout>
  );
};

export default PatientProfile;