import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Grid,
  Avatar,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton as MuiIconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Person,
  Lock,
  Notifications,
  Security,
  PrivacyTip,
  AccountCircle,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  CheckCircle,
  CalendarToday,
  AccessTime,
  Language,
  ArrowBack
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import PatientLayout from '../components/PatientLayout';

interface PatientProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  emergencyContact: string;
  medicalHistory: string;
  profilePicture: string;
  username: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  commentLikes: boolean;
  commentReplies: boolean;
  appointmentReminders: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  showMedicalHistory: boolean;
}

interface GeneralSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  theme: 'light' | 'dark' | 'auto';
}

const PatientSettings: React.FC = () => {
  const { user } = useAuth();
  const { setMode: setThemeMode } = useThemeMode();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<PatientProfile>({
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
    medicalHistory: '',
    profilePicture: '',
    username: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    commentLikes: true,
    commentReplies: true,
    appointmentReminders: true
  });
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'private',
    showEmail: false,
    showPhone: false,
    showAddress: false,
    showMedicalHistory: false
  });

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    theme: 'light'
  });

  // Password change states
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Forgot password OTP states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpData, setOtpData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Form states
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && user.token) {
        try {
          const response = await fetch('http://localhost:8080/patient/profile', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success' && data.data) {
              setProfile({
                id: data.data.id || 0,
                firstName: data.data.firstName || '',
                lastName: data.data.lastName || '',
                email: data.data.email || '',
                phoneNumber: data.data.phoneNumber || '',
                address: data.data.address || '',
                dateOfBirth: data.data.dateOfBirth || '',
                emergencyContact: data.data.emergencyContactName || '',
                medicalHistory: data.data.medicalConditions || '',
                profilePicture: data.data.profilePicture || '',
                username: data.data.username || user.username || ''
              });
            }
          } else {
            // Fallback to default values if API fails
            setProfile({
              id: user.id || 0,
              firstName: '',
              lastName: '',
              email: '',
              phoneNumber: '',
              address: '',
              dateOfBirth: '',
              emergencyContact: '',
              medicalHistory: '',
              profilePicture: '',
              username: user.username || ''
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          // Fallback to default values on error
          setProfile({
            id: user.id || 0,
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            address: '',
            dateOfBirth: '',
            emergencyContact: '',
            medicalHistory: '',
            profilePicture: '',
            username: user.username || ''
          });
        }
      }
    };
    
    fetchProfile();
  }, [user]);

  // Fetch notification preferences
  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      if (user && user.token) {
        try {
          const response = await fetch('http://localhost:8080/patient/notification-preferences', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success' && data.preferences) {
              setNotificationSettings({
                emailNotifications: data.preferences.emailNotifications ?? true,
                commentLikes: data.preferences.commentLikes ?? true,
                commentReplies: data.preferences.commentReplies ?? true,
                appointmentReminders: data.preferences.appointmentReminders ?? true
              });
            }
          } else {
            console.error('Failed to fetch notification preferences:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching notification preferences:', error);
        }
      }
    };

    fetchNotificationPreferences();
  }, [user]);

  // Fetch 2FA status
  useEffect(() => {
    const fetch2FAStatus = async () => {
      if (user && user.token) {
        try {
          const response = await fetch('http://localhost:8080/patient/2fa-status', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
              setTwoFactorEnabled(data.twoFactorEnabled || false);
            }
          }
        } catch (error) {
          console.error('Error fetching 2FA status:', error);
        }
      }
    };
    
    fetch2FAStatus();
  }, [user]);

  // Fetch privacy settings
  useEffect(() => {
    const fetchPrivacySettings = async () => {
      if (user && user.token) {
        try {
          const response = await fetch('http://localhost:8080/patient/privacy-settings', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success' && data.settings) {
              setPrivacySettings({
                profileVisibility: data.settings.profileVisibility || 'private',
                showEmail: data.settings.showEmail ?? false,
                showPhone: data.settings.showPhone ?? false,
                showAddress: data.settings.showAddress ?? false,
                showMedicalHistory: data.settings.showMedicalHistory ?? false
              });
            }
          } else {
            console.error('Failed to fetch privacy settings:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching privacy settings:', error);
        }
      }
    };

    fetchPrivacySettings();
  }, [user]);

  // Load general settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('patientGeneralSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setGeneralSettings(parsed);
        
        // Apply saved theme using ThemeContext
        if (parsed.theme) {
          setThemeMode(parsed.theme);
        }
      } catch (error) {
        console.error('Error loading general settings:', error);
      }
    }
  }, [setThemeMode]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      if (!user?.token) {
        throw new Error('Authentication required');
      }

      // Prepare the data for the backend
      const updateData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        dateOfBirth: profile.dateOfBirth,
        username: profile.username,
      };

      console.log('Saving profile:', updateData);

      const response = await fetch('http://localhost:8080/patient/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success'
        });
        setEditingProfile(false);
        
        // Refresh profile data from backend
        const profileResponse = await fetch('http://localhost:8080/patient/profile', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.status === 'success' && profileData.data) {
            setProfile({
              id: profileData.data.id || 0,
              firstName: profileData.data.firstName || '',
              lastName: profileData.data.lastName || '',
              email: profileData.data.email || '',
              phoneNumber: profileData.data.phoneNumber || '',
              address: profileData.data.address || '',
              dateOfBirth: profileData.data.dateOfBirth || '',
              emergencyContact: profileData.data.emergencyContactName || '',
              medicalHistory: profileData.data.medicalConditions || '',
              profilePicture: profileData.data.profilePicture || '',
              username: profileData.data.username || user.username || ''
            });
          }
        }
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match.',
        severity: 'error'
      });
      return;
    }

    // Password validation - must match registration constraints
    if (passwordData.newPassword.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters long.',
        severity: 'error'
      });
      return;
    }

    if (!/[A-Z]/.test(passwordData.newPassword)) {
      setSnackbar({
        open: true,
        message: 'Password must contain at least one uppercase letter (A-Z).',
        severity: 'error'
      });
      return;
    }

    if (!/[0-9]/.test(passwordData.newPassword)) {
      setSnackbar({
        open: true,
        message: 'Password must contain at least one number (0-9).',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      if (!user?.token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:8080/patient/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSnackbar({
          open: true,
          message: 'Password changed successfully!',
          severity: 'success'
        });
        
        setPasswordDialog(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to change password. Please check your current password.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!otpData.email) {
      setSnackbar({
        open: true,
        message: 'Please enter your email address',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/otp/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: otpData.email }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setOtpSent(true);
        setSnackbar({
          open: true,
          message: 'OTP sent to your email!',
          severity: 'success'
        });
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to send OTP. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordWithOTP = async () => {
    if (otpData.newPassword !== otpData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match.',
        severity: 'error'
      });
      return;
    }

    // Password validation - must match registration constraints
    if (otpData.newPassword.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters long.',
        severity: 'error'
      });
      return;
    }

    if (!/[A-Z]/.test(otpData.newPassword)) {
      setSnackbar({
        open: true,
        message: 'Password must contain at least one uppercase letter (A-Z).',
        severity: 'error'
      });
      return;
    }

    if (!/[0-9]/.test(otpData.newPassword)) {
      setSnackbar({
        open: true,
        message: 'Password must contain at least one number (0-9).',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/otp/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otpData.email,
          otp: otpData.otp,
          newPassword: otpData.newPassword,
          confirmPassword: otpData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSnackbar({
          open: true,
          message: 'Password reset successfully!',
          severity: 'success'
        });
        
        // Reset all states
        setPasswordDialog(false);
        setForgotPasswordMode(false);
        setOtpSent(false);
        setOtpData({
          email: '',
          otp: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to reset password. Please check your OTP.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordMode(false);
    setOtpSent(false);
    setOtpData({
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleToggle2FA = async (enabled: boolean) => {
    setLoading(true);
    try {
      if (!user?.token) {
        throw new Error('Authentication required');
      }

      const endpoint = enabled 
        ? 'http://localhost:8080/patient/enable-2fa'
        : 'http://localhost:8080/patient/disable-2fa';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setTwoFactorEnabled(enabled);
        setSnackbar({
          open: true,
          message: enabled 
            ? 'Two-factor authentication enabled! You will need to enter an OTP when logging in.' 
            : 'Two-factor authentication disabled.',
          severity: 'success'
        });
      } else {
        throw new Error(data.message || 'Failed to update 2FA settings');
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to update 2FA settings.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setLoading(true);
    try {
      if (!user?.token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:8080/patient/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(notificationSettings),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSnackbar({
          open: true,
          message: 'Notification settings saved successfully!',
          severity: 'success'
        });
      } else {
        throw new Error(data.message || 'Failed to save notification settings');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save notification settings.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacySettings = async () => {
    setLoading(true);
    try {
      if (!user?.token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:8080/patient/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(privacySettings),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response from server');
      }

      if (response.ok && data.status === 'success') {
        setSnackbar({
          open: true,
          message: 'Privacy settings saved successfully!',
          severity: 'success'
        });
      } else {
        throw new Error(data.message || 'Failed to save privacy settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save privacy settings.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneralSettings = async () => {
    setLoading(true);
    try {
      // Save general settings to localStorage
      localStorage.setItem('patientGeneralSettings', JSON.stringify(generalSettings));
      console.log('Saving general settings:', generalSettings);
      
      // Apply theme using ThemeContext
      setThemeMode(generalSettings.theme);
      
      setSnackbar({
        open: true,
        message: 'General settings saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving general settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save settings.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <Person /> },
    { id: 'security', label: 'Security', icon: <Security /> },
    { id: 'notifications', label: 'Notifications', icon: <Notifications /> },
    { id: 'privacy', label: 'Privacy', icon: <PrivacyTip /> },
    { id: 'general', label: 'General', icon: <Language /> }
    
  ];

  const renderProfileTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Profile Information</Typography>
          {!editingProfile ? (
            <Button
              startIcon={<Edit />}
              variant="outlined"
              onClick={() => setEditingProfile(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Box>
              <Button
                startIcon={<Cancel />}
                variant="outlined"
                onClick={() => setEditingProfile(false)}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                startIcon={<Save />}
                variant="contained"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Username"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  disabled={!editingProfile}
                  helperText="Your unique username for login"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  disabled={!editingProfile}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  disabled={!editingProfile}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={!editingProfile}
                  helperText="Primary email for notifications and communications"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  type="tel"
                  value={profile.phoneNumber}
                  onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                  disabled={!editingProfile}
                  helperText="Contact number for appointments and emergencies"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                  disabled={!editingProfile}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSecurityTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Security Settings
        </Typography>

        <List>
          <ListItem>
            <ListItemText
              primary="Password"
              secondary="Last changed 2 months ago"
              primaryTypographyProps={{ fontWeight: 'medium' }}
            />
            <ListItemSecondaryAction>
              <Button
                variant="outlined"
                startIcon={<Lock />}
                onClick={() => setPasswordDialog(true)}
              >
                Change Password
              </Button>
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemText
              primary="Two-Factor Authentication"
              secondary={twoFactorEnabled 
                ? "Enabled - OTP required for login" 
                : "Add an extra layer of security to your account"}
              primaryTypographyProps={{ fontWeight: 'medium' }}
            />
            <ListItemSecondaryAction>
              <Switch
                checked={twoFactorEnabled}
                onChange={(e) => handleToggle2FA(e.target.checked)}
                color="primary"
              />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemText
              primary="Login Activity"
              secondary="View recent login activity and active sessions"
              primaryTypographyProps={{ fontWeight: 'medium' }}
            />
            <ListItemSecondaryAction>
              <Button 
                variant="outlined"
                onClick={() => navigate('/user-activity')}
              >
                View Activity
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const renderNotificationsTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Notification Preferences</Typography>
          <Button
            variant="contained"
            onClick={handleSaveNotificationSettings}
            disabled={loading}
          >
            Save Settings
          </Button>
        </Box>

        <List>
          <ListItem>
            <ListItemText
              primary="Email Notifications"
              secondary="Receive notifications via email"
              primaryTypographyProps={{ fontWeight: 'medium' }}
            />
            <ListItemSecondaryAction>
              <Switch
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  emailNotifications: e.target.checked
                })}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
            Social Media Notifications
          </Typography>

          <ListItem>
            <ListItemText
              primary="Comment Likes"
              secondary="Notify when someone likes your comment"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={notificationSettings.commentLikes}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  commentLikes: e.target.checked
                })}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText
              primary="Comment Replies"
              secondary="Notify when someone replies to your comments"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={notificationSettings.commentReplies}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  commentReplies: e.target.checked
                })}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
            Medical Notifications
          </Typography>

          <ListItem>
            <ListItemText
              primary="Appointment Reminders"
              secondary="Receive reminders for upcoming appointments"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={notificationSettings.appointmentReminders}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  appointmentReminders: e.target.checked
                })}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const renderPrivacyTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Privacy Settings</Typography>
          <Button
            variant="contained"
            onClick={handleSavePrivacySettings}
            disabled={loading}
          >
            Save Settings
          </Button>
        </Box>

        <List>
          <ListItem>
            <ListItemText
              primary="Show Medical Records to Doctor"
              secondary="Allow doctors to view your medical records when booking an appointment"
              primaryTypographyProps={{ fontWeight: 'medium' }}
            />
            <ListItemSecondaryAction>
              <Switch
                checked={privacySettings.showMedicalHistory}
                onChange={(e) => setPrivacySettings({
                  ...privacySettings,
                  showMedicalHistory: e.target.checked
                })}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const renderGeneralTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">General Settings</Typography>
          <Button
            variant="contained"
            onClick={handleSaveGeneralSettings}
            disabled={loading}
          >
            Save Settings
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={generalSettings.language}
                onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                label="Language"
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ar">Arabic</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={generalSettings.theme}
                onChange={(e) => setGeneralSettings({ ...generalSettings, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                label="Theme"
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto (System)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <PatientLayout
      title="Settings"
      subtitle="Manage your account settings and preferences"
    >
      <Box>
        {/* Go Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
          variant="outlined"
        >
          Go Back
        </Button>

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', overflowX: 'auto' }}>
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                startIcon={tab.icon}
                sx={{
                  minWidth: 'auto',
                  px: 3,
                  py: 2,
                  borderRadius: 0,
                  borderBottom: activeTab === tab.id ? 2 : 0,
                  borderColor: activeTab === tab.id ? 'primary.main' : 'transparent',
                  color: activeTab === tab.id ? 'primary.main' : 'text.secondary',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* Tab Content */}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'privacy' && renderPrivacyTab()}
        {activeTab === 'general' && renderGeneralTab()}
        
      </Box>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {forgotPasswordMode ? 'Reset Password with OTP' : 'Change Password'}
        </DialogTitle>
        <DialogContent>
          {!forgotPasswordMode ? (
            <>
              <TextField
                fullWidth
                type={showPasswords.current ? 'text' : 'password'}
                label="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </MuiIconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Button 
                  size="small" 
                  onClick={() => {
                    setForgotPasswordMode(true);
                    setOtpData({ ...otpData, email: profile.email });
                  }}
                >
                  Forgot Password?
                </Button>
              </Box>
              <TextField
                fullWidth
                type={showPasswords.new ? 'text' : 'password'}
                label="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                margin="normal"
                helperText={
                  <Box component="div" sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" component="div">
                      Password must contain:
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ ml: 2 }}>
                      • At least 8 characters
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ ml: 2 }}>
                      • At least one uppercase letter (A-Z)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ ml: 2 }}>
                      • At least one number (0-9)
                    </Typography>
                  </Box>
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </MuiIconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth
                type={showPasswords.confirm ? 'text' : 'password'}
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </MuiIconButton>
                    </InputAdornment>
                  )
                }}
              />
            </>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                {!otpSent 
                  ? 'Enter your email address to receive an OTP for password reset'
                  : 'Check your email for the OTP code'}
              </Alert>
              
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={otpData.email}
                onChange={(e) => setOtpData({ ...otpData, email: e.target.value })}
                margin="normal"
                disabled={otpSent}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  )
                }}
              />

              {otpSent && (
                <>
                  <TextField
                    fullWidth
                    label="OTP Code"
                    value={otpData.otp}
                    onChange={(e) => setOtpData({ ...otpData, otp: e.target.value })}
                    margin="normal"
                    helperText="Enter the 6-digit code sent to your email"
                  />
                  
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={otpData.newPassword}
                    onChange={(e) => setOtpData({ ...otpData, newPassword: e.target.value })}
                    margin="normal"
                    helperText={
                      <Box component="div" sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" component="div">
                          Password must contain:
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="div" sx={{ ml: 2 }}>
                          • At least 8 characters
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="div" sx={{ ml: 2 }}>
                          • At least one uppercase letter (A-Z)
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="div" sx={{ ml: 2 }}>
                          • At least one number (0-9)
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    value={otpData.confirmPassword}
                    onChange={(e) => setOtpData({ ...otpData, confirmPassword: e.target.value })}
                    margin="normal"
                  />
                </>
              )}
              
              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Button 
                  size="small" 
                  onClick={handleCloseForgotPassword}
                >
                  Back to Password Change
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPasswordDialog(false);
            handleCloseForgotPassword();
          }}>
            Cancel
          </Button>
          {!forgotPasswordMode ? (
            <Button
              onClick={handleChangePassword}
              variant="contained"
              disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              Change Password
            </Button>
          ) : !otpSent ? (
            <Button
              onClick={handleSendOTP}
              variant="contained"
              disabled={loading || !otpData.email}
            >
              Send OTP
            </Button>
          ) : (
            <Button
              onClick={handleResetPasswordWithOTP}
              variant="contained"
              disabled={loading || !otpData.otp || !otpData.newPassword || !otpData.confirmPassword}
            >
              Reset Password
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PatientLayout>
  );
};

export default PatientSettings;
