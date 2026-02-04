import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Grid,
  Avatar,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Security,
  LocationOn,
  DeviceHub,
  CheckCircle,
  Warning,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import PatientLayout from '../components/PatientLayout';
import DoctorLayout from '../components/DoctorLayout';

interface LoginSession {
  id: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  device: string;
  browser: string;
  isActive: boolean;
  isCurrentSession: boolean;
}

interface AccountActivity {
  id: string;
  type: 'login' | 'logout' | 'password_change' | '2fa_enabled' | '2fa_disabled' | 'profile_update';
  description: string;
  timestamp: string;
  ipAddress: string;
  location: string;
  device: string;
}

const UserActivity: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sessions' | 'activity'>('sessions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data - will be replaced with API calls
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([
    {
      id: '1',
      loginTime: '2024-01-15T10:30:00Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: 'New York, NY, USA',
      device: 'Desktop',
      browser: 'Chrome 120.0',
      isActive: true,
      isCurrentSession: true
    },
    {
      id: '2',
      loginTime: '2024-01-14T15:45:00Z',
      logoutTime: '2024-01-14T18:20:00Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: 'New York, NY, USA',
      device: 'Desktop',
      browser: 'Chrome 120.0',
      isActive: false,
      isCurrentSession: false
    },
    {
      id: '3',
      loginTime: '2024-01-13T09:15:00Z',
      logoutTime: '2024-01-13T12:30:00Z',
      ipAddress: '10.0.0.50',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      location: 'San Francisco, CA, USA',
      device: 'Mobile',
      browser: 'Safari Mobile',
      isActive: false,
      isCurrentSession: false
    }
  ]);

  const [accountActivity, setAccountActivity] = useState<AccountActivity[]>([
    {
      id: '1',
      type: 'login',
      description: 'Successful login from Chrome on Desktop',
      timestamp: '2024-01-15T10:30:00Z',
      ipAddress: '192.168.1.100',
      location: 'New York, NY, USA',
      device: 'Desktop'
    },
    {
      id: '2',
      type: '2fa_enabled',
      description: 'Two-factor authentication enabled',
      timestamp: '2024-01-15T09:15:00Z',
      ipAddress: '192.168.1.100',
      location: 'New York, NY, USA',
      device: 'Desktop'
    },
    {
      id: '3',
      type: 'password_change',
      description: 'Password changed successfully',
      timestamp: '2024-01-14T14:20:00Z',
      ipAddress: '192.168.1.100',
      location: 'New York, NY, USA',
      device: 'Desktop'
    },
    {
      id: '4',
      type: 'logout',
      description: 'Logged out from Chrome on Desktop',
      timestamp: '2024-01-14T18:20:00Z',
      ipAddress: '192.168.1.100',
      location: 'New York, NY, USA',
      device: 'Desktop'
    },
    {
      id: '5',
      type: 'profile_update',
      description: 'Profile information updated',
      timestamp: '2024-01-13T16:45:00Z',
      ipAddress: '10.0.0.50',
      location: 'San Francisco, CA, USA',
      device: 'Mobile'
    }
  ]);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = user?.type === 'patient' 
        ? 'http://localhost:8080/patient/activity'
        : 'http://localhost:8080/healthprovider/activity';
        
      const response = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Activity data loaded:', data);
        
        if (data.status === 'success') {
          // Convert backend data to frontend format
          const sessions = data.sessions.map((session: any) => ({
            id: session.id.toString(),
            loginTime: session.loginTime,
            logoutTime: session.logoutTime,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            location: session.location || 'Unknown Location',
            device: session.device || 'Unknown Device',
            browser: session.browser || 'Unknown Browser',
            isActive: session.isActive,
            isCurrentSession: session.isCurrentSession || false
          }));
          
          const activities = data.activities.map((activity: any) => ({
            id: activity.id.toString(),
            type: activity.type.toLowerCase(),
            description: activity.description,
            timestamp: activity.timestamp,
            ipAddress: activity.ipAddress,
            location: activity.location || 'Unknown Location',
            device: activity.device || 'Unknown Device'
          }));
          
          setLoginSessions(sessions);
          setAccountActivity(activities);
        } else {
          setError(data.message || 'Failed to load activity data');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load activity data');
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
      setError('Failed to load activity data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <LoginIcon color="success" />;
      case 'logout':
        return <LogoutIcon color="action" />;
      case 'password_change':
        return <Security color="primary" />;
      case '2fa_enabled':
        return <CheckCircle color="success" />;
      case '2fa_disabled':
        return <Warning color="warning" />;
      case 'profile_update':
        return <Security color="info" />;
      default:
        return <Security />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'success';
      case 'logout':
        return 'default';
      case 'password_change':
        return 'primary';
      case '2fa_enabled':
        return 'success';
      case '2fa_disabled':
        return 'warning';
      case 'profile_update':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderSessionsTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Active Sessions</Typography>
          <IconButton onClick={fetchActivityData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Monitor your account's login sessions. If you see any suspicious activity, 
          consider changing your password and enabling two-factor authentication.
        </Alert>

        {loginSessions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No login sessions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Login sessions will appear here once you log in to your account.
            </Typography>
          </Box>
        ) : (
        <List>
          {loginSessions.map((session, index) => (
            <React.Fragment key={session.id}>
              <ListItem>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: session.isCurrentSession ? 'success.main' : 'grey.400' }}>
                    <DeviceHub />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1">
                        {session.device} - {session.browser}
                      </Typography>
                      {session.isCurrentSession && (
                        <Chip label="Current Session" color="success" size="small" />
                      )}
                      {session.isActive && !session.isCurrentSession && (
                        <Chip label="Active" color="warning" size="small" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        <LocationOn fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {session.location}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        IP: {session.ipAddress}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {session.isActive ? 'Logged in' : 'Logged out'}: {formatDate(session.loginTime)}
                        {session.logoutTime && ` - ${formatDate(session.logoutTime)}`}
                      </Typography>
                    </Box>
                  }
                />
                {session.isCurrentSession && (
                  <Chip
                    label="This Device"
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                )}
              </ListItem>
              {index < loginSessions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        )}
      </CardContent>
    </Card>
  );

  const renderActivityTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Account Activity</Typography>
          <IconButton onClick={fetchActivityData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          View recent account activity including logins, security changes, and profile updates.
        </Alert>

        {accountActivity.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No account activity found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Account activities will appear here as you use your account.
            </Typography>
          </Box>
        ) : (
        <List>
          {accountActivity.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem>
                <ListItemIcon>
                  {getActivityIcon(activity.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1">
                        {activity.description}
                      </Typography>
                      <Chip
                        label={activity.type.replace('_', ' ')}
                        color={getActivityColor(activity.type) as any}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        <LocationOn fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {activity.location}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        IP: {activity.ipAddress} • {activity.device}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < accountActivity.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        )}
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      );
    }

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
            variant="outlined"
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Account Activity
          </Typography>
        </Box>

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex' }}>
          <Button
            onClick={() => setActiveTab('sessions')}
            sx={{
              flex: 1,
              py: 2,
              borderRadius: 0,
              borderBottom: activeTab === 'sessions' ? 2 : 0,
              borderColor: activeTab === 'sessions' ? 'primary.main' : 'transparent',
              color: activeTab === 'sessions' ? 'primary.main' : 'text.secondary',
              fontWeight: activeTab === 'sessions' ? 'bold' : 'normal',
            }}
          >
            Login Sessions
          </Button>
          <Button
            onClick={() => setActiveTab('activity')}
            sx={{
              flex: 1,
              py: 2,
              borderRadius: 0,
              borderBottom: activeTab === 'activity' ? 2 : 0,
              borderColor: activeTab === 'activity' ? 'primary.main' : 'transparent',
              color: activeTab === 'activity' ? 'primary.main' : 'text.secondary',
              fontWeight: activeTab === 'activity' ? 'bold' : 'normal',
            }}
          >
            Account Activity
          </Button>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

        {/* Tab Content */}
        {activeTab === 'sessions' && renderSessionsTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </Container>
    );
  };

  // Return with appropriate layout
  if (user?.type === 'patient') {
    return (
      <PatientLayout
        title="Account Activity"
        subtitle="Monitor your account security and login sessions"
      >
        {renderContent()}
      </PatientLayout>
    );
  } else {
    return (
      <DoctorLayout
        title="Account Activity"
        subtitle="Monitor your account security and login sessions"
      >
        {renderContent()}
      </DoctorLayout>
    );
  }
};

export default UserActivity;
