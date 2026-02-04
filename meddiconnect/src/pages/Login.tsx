import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { LoginHPRequestDTO } from '../types/DoctorLogin';
import { LoginPatientRequestDTO } from '../types/PatientLogin';

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
      id={`login-tabpanel-${index}`}
      aria-labelledby={`login-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const userValidationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const doctorValidationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [showSecureCode, setShowSecureCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setShowSecureCode(false);
    setError(null);
    setTwoFARequired(false);
    setOtp('');
  };

  const handleUserSubmit = async (values: LoginPatientRequestDTO) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8080/patient/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Patient login response:', data);
        
        // Check if 2FA is required
        if (data.status === '2fa_required') {
          console.log('2FA required for patient, showing OTP input');
          setTwoFARequired(true);
          setUsername(values.username);
          setEmail(data.email);
          setError(null);
        } else if (data.status === 'success') {
          console.log('Patient login successful without 2FA');
          login('patient', data.token, values.username);
          navigate('/patient-dashboard');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSubmit = async (values: LoginHPRequestDTO) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting doctor login with:', values.username);
      
      const response = await fetch('http://localhost:8080/healthprovider/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      console.log('Doctor login response:', data);
      
      // Check if 2FA is required
      if (data.status === '2fa_required') {
        console.log('2FA required for doctor, showing OTP input');
        setTwoFARequired(true);
        setUsername(values.username);
        setEmail(data.email);
        setError(null);
      } else if (response.ok && data.status === 'success') {
        console.log('Doctor login successful without 2FA');
        login('doctor', data.token, values.username);
        navigate('/doctor-dashboard');
      } else {
        console.error('Doctor login failed:', data.message);
        setError('Login failed: ' + data.message);
      }
    } catch (error) {
      console.error('Network error during login:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = tabValue === 0 
        ? 'http://localhost:8080/patient/verify-login-otp'
        : 'http://localhost:8080/healthprovider/verify-login-otp';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          const userType = tabValue === 0 ? 'patient' : 'doctor';
          const dashboardPath = tabValue === 0 ? '/patient-dashboard' : '/doctor-dashboard';
          login(userType, data.token, username);
          navigate(dashboardPath);
        } else {
          setError(data.message || 'Invalid OTP');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid or expired OTP');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login to MeddieConnect
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Patient Login" />
            <Tab label="Doctor Login" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {twoFARequired && (
          <Alert severity="info" sx={{ mb: 2 }}>
            An OTP has been sent to {email}. Please enter it below to complete login.
          </Alert>
        )}

        <TabPanel value={tabValue} index={0}>
          {twoFARequired ? (
            <Box>
              <TextField
                fullWidth
                label="Enter OTP Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                helperText="Enter the 6-digit code sent to your email"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleVerifyOTP}
                disabled={loading || !otp}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  setTwoFARequired(false);
                  setOtp('');
                  setError(null);
                }}
                sx={{ mt: 1 }}
              >
                Back to Login
              </Button>
            </Box>
          ) : (
            <Formik
              initialValues={{ username: '', password: '' }}
              validationSchema={userValidationSchema}
              onSubmit={handleUserSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="username"
                        label="Username"
                        value={values.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.username && Boolean(errors.username)}
                        helperText={(touched.username && errors.username) || "Enter the username you used during registration"}
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.password && Boolean(errors.password)}
                        helperText={touched.password && errors.password}
                        InputProps={{
                          startAdornment: <LockIcon sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        disabled={loading}
                      >
                        {loading ? 'Logging in...' : 'Login'}
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {twoFARequired ? (
            <Box>
              <TextField
                fullWidth
                label="Enter OTP Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                helperText="Enter the 6-digit code sent to your email"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleVerifyOTP}
                disabled={loading || !otp}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  setTwoFARequired(false);
                  setOtp('');
                  setError(null);
                }}
                sx={{ mt: 1 }}
              >
                Back to Login
              </Button>
            </Box>
          ) : (
            <Formik
              initialValues={{ username: '', password: '' }}
              validationSchema={doctorValidationSchema}
              onSubmit={handleDoctorSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="username"
                        label="Username"
                        value={values.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.username && Boolean(errors.username)}
                        helperText={touched.username && errors.username}
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.password && Boolean(errors.password)}
                        helperText={touched.password && errors.password}
                        InputProps={{
                          startAdornment: <LockIcon sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        disabled={loading}
                      >
                        {loading ? 'Logging in...' : 'Login'}
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Login; 