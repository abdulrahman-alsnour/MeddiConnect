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
import { LoginHPRequestDTO } from '../types/DoctorLogin';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const handleSubmit = async (values: LoginHPRequestDTO) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting doctor login with:', values.username);
      
      const response = await fetch('http://localhost:8080/healthprovider/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      console.log('Login response:', data);
      
      // Check if 2FA is required
      if (data.status === '2fa_required') {
        console.log('2FA required, showing OTP input');
        setTwoFARequired(true);
        setUsername(values.username);
        setEmail(data.email);
        setError(null);
      } else if (response.ok && data.status === 'success') {
        console.log('Login successful, token received');
        
        // Use userId from login response, or fetch profile as fallback
        let userId = data.userId;
        
        if (!userId) {
          // Fallback: Fetch user profile to get user ID
          try {
            const profileResponse = await fetch('http://localhost:8080/healthprovider/profile', {
              headers: {
                'Authorization': `Bearer ${data.token}`,
              },
            });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              userId = profileData.data?.id;
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
          }
        }
        
        login('doctor', data.token, values.username, userId);
        navigate('/doctor-dashboard');
      } else {
        console.error('Login failed:', data.message);
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
      const response = await fetch('http://localhost:8080/healthprovider/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Use userId from login response, or fetch profile as fallback
          let userId = data.userId;
          
          if (!userId) {
            // Fallback: Fetch user profile to get user ID
            try {
              const profileResponse = await fetch('http://localhost:8080/healthprovider/profile', {
                headers: {
                  'Authorization': `Bearer ${data.token}`,
                },
              });
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                userId = profileData.data?.id;
              }
            } catch (err) {
              console.error('Error fetching profile:', err);
            }
          }
          
          login('doctor', data.token, username, userId);
          navigate('/doctor-dashboard');
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
          Doctor Login
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Access your healthcare provider portal
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
                    {loading ? 'Logging in...' : 'Login as Doctor'}
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2">
                      Don't have an account?{' '}
                      <Link href="/doctor-register" underline="hover">
                        Register as Doctor
                      </Link>
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2">
                      Are you a patient?{' '}
                      <Link href="/patient-login" underline="hover">
                        Login as Patient
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

export default DoctorLogin;
