import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Lock as LockIcon, Person as PersonIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

interface AdminLoginFormValues {
  username: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.type === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (values: AdminLoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        login('admin', data.token, data.username);
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      let message = 'Invalid username or password';
      try {
        const errorData = await response.json();
        if (errorData?.message) {
          message = errorData.message;
        }
      } catch (parseError) {
        // response body might be empty or plain text
        const text = await response.text();
        if (text) {
          message = text;
        }
      }

      if (response.status === 403) {
        message = 'Access denied. Administrator account required.';
      }

      setError(message);
    } catch (err) {
      console.error('Admin login failed:', err);
      setError('Unable to sign in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={4} sx={{ p: { xs: 3, md: 5 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Portal
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Sign in with your administrator credentials to manage MeddieConnect.
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur }) => (
            <Form>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  label="Username"
                  value={values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.username && Boolean(errors.username)}
                  helperText={
                    (touched.username && errors.username) ||
                    'Enter your administrator username'
                  }
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />

                <TextField
                  fullWidth
                  id="password"
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

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign in as Admin'
                  )}
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate('/')}
                  sx={{ textTransform: 'none' }}
                >
                  Back to Landing Page
                </Button>

                <Typography variant="body2" color="text.secondary" align="center">
                  Need assistance? Contact the MeddieConnect support team to reset or create administrator access.
                </Typography>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default AdminLogin;

