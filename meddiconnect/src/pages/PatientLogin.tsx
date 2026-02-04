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
  Alert,
  Link,
} from '@mui/material';
import { Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { LoginPatientRequestDTO } from '../types/PatientLogin';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const PatientLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const handleSubmit = async (values: LoginPatientRequestDTO) => {
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
        console.log('Login response:', data);
        
        // Check if 2FA is required
        if (data.status === '2fa_required') {
          console.log('2FA required, showing OTP input');
          setTwoFARequired(true);
          setUsername(values.username);
          setEmail(data.email);
          setError(null);
        } else if (data.status === 'success') {
          console.log('Login successful without 2FA');
          // Fetch user profile to get user ID
          try {
            const profileResponse = await fetch('http://localhost:8080/patient/profile', {
              headers: {
                'Authorization': `Bearer ${data.token}`,
              },
            });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              const userId = profileData.data?.id;
              login('patient', data.token, values.username, userId);
            } else {
              login('patient', data.token, values.username);
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
            login('patient', data.token, values.username);
          }
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

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/patient/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Fetch user profile to get user ID
          try {
            const profileResponse = await fetch('http://localhost:8080/patient/profile', {
              headers: {
                'Authorization': `Bearer ${data.token}`,
              },
            });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              const userId = profileData.data?.id;
              login('patient', data.token, username, userId);
            } else {
              login('patient', data.token, username);
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
            login('patient', data.token, username);
          }
          navigate('/patient-dashboard');
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
          Patient Login
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Access your patient portal
        </Typography>

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
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
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
                    {loading ? 'Logging in...' : 'Login as Patient'}
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2">
                      Don't have an account?{' '}
                      <Link href="/register" underline="hover">
                        Register as Patient
                      </Link>
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2">
                      Are you a doctor?{' '}
                      <Link href="/doctor-login" underline="hover">
                        Login as Doctor
                      </Link>
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
        )}
      </Paper>
    </Container>
  );
};

export default PatientLogin;
