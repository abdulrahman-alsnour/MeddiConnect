import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';
import { SignupHPRequestDTO, EducationHistoryDTO, WorkExperienceDTO, SpecialtyDTO } from '../types/DoctorSignup';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: '40px auto',
  maxWidth: 800,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginLeft: theme.spacing(1),
}));

const StyledTextField = styled(TextField)({
  marginBottom: '20px',
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#e0e0e0',
    },
    '&:hover fieldset': {
      borderColor: '#2196f3',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2196f3',
    },
  },
});

const initialValidationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .test('username-available', 'Username already exists', async function(value) {
      if (!value || value.trim() === '') {
        return true; // Let required validation handle empty values
      }
      try {
        const response = await fetch(`http://localhost:8080/healthprovider/check-username?username=${encodeURIComponent(value)}`);
        const data = await response.json();
        if (data.status === 'success') {
          return data.available; // Returns true if available, false if exists
        }
        return true; // If API fails, allow the value (backend will catch it during registration)
      } catch (error) {
        console.error('Error checking username:', error);
        return true; // If API fails, allow the value (backend will catch it during registration)
      }
    }),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phoneNumber: Yup.string()
    .required('Phone number is required')
    .test('starts-with-07', 'Phone number must start with 07', (value) => {
      if (!value) return false;
      return value.startsWith('07');
    })
    .test('exact-length', 'Phone number must be exactly 10 digits', (value) => {
      if (!value) return false;
      return /^\d{10}$/.test(value);
    })
    .test('only-digits', 'Phone number must contain only digits', (value) => {
      if (!value) return false;
      return /^\d+$/.test(value);
    }),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  gender: Yup.string().required('Gender is required'),
  dateOfBirth: Yup.date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future'),
});

const verificationSchema = Yup.object({
  verificationCode: Yup.string()
    .nullable()
    .transform((value) => (value === '' ? null : value)),
});

const professionalInfoSchema = Yup.object({
  specializations: Yup.array().of(Yup.string()),
  education: Yup.array().of(
    Yup.object({
      university: Yup.string(),
      startDate: Yup.date(),
      endDate: Yup.date(),
      stillEnrolled: Yup.boolean(),
    })
  ),
  career: Yup.array().of(
    Yup.object({
      institution: Yup.string(),
      workType: Yup.string(),
      startDate: Yup.date(),
      endDate: Yup.string(),
      currentlyWorking: Yup.boolean(),
    })
  ),
  licenseNumber: Yup.string(),
  bio: Yup.string(),
});

const clinicInfoSchema = Yup.object({
  clinicName: Yup.string(),
  address: Yup.string(),
  city: Yup.string(),
  country: Yup.string(),
  consultationFee: Yup.number(),
  // availability is handled as an object, no validation needed
});

// Specialization types - exact enum names matching backend SpecializationType
const specialties = [
  'INTERNAL_MEDICINE',
  'GENERAL_SURGERY',
  'PEDIATRICS',
  'OBSTETRICS_GYNECOLOGY',
  'FAMILY_MEDICINE',
  'PSYCHIATRY',
  'EMERGENCY_MEDICINE',
  'ANESTHESIOLOGY',
  'RADIOLOGY',
  'PATHOLOGY',
  'ORTHOPEDIC_SURGERY',
  'NEUROSURGERY',
  'CARDIOLOGY',
  'DERMATOLOGY',
  'NEUROLOGY',
  'UROLOGY',
  'PLASTIC_SURGERY',
  'OPHTHALMOLOGY',
];

const steps = ['Basic Information', 'OTP Verification', 'Professional Information', 'Clinic Information'];

const DoctorRegister = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [formValues, setFormValues] = useState<Partial<SignupHPRequestDTO> & {
    confirmPassword?: string;
    verificationCode?: string;
    specializations?: string[];
    education?: { university: string; startDate: string; endDate: string; stillEnrolled: boolean }[];
    career?: { institution: string; workType: string; startDate: string; endDate: string; currentlyWorking: boolean }[];
    followUpFee?: number | string;
    availability?: any;
  }>({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    city: '',
    country: '',
    consultationFee: 0,
    licenseNumber: '',
    clinicName: '',
    bio: '',
    availableDays: [],
    availableTimeStart: '',
    availableTimeEnd: '',
    educationHistories: [],
    workExperiences: [],
    specializations: [],
    confirmPassword: '',
    verificationCode: '',
    education: [{ university: '', startDate: '', endDate: '', stillEnrolled: false }],
    career: [{ institution: '', workType: '', startDate: '', endDate: '', currentlyWorking: false }],
    followUpFee: '',
    availability: {
      monday: { startTime: '', endTime: '' },
      tuesday: { startTime: '', endTime: '' },
      wednesday: { startTime: '', endTime: '' },
      thursday: { startTime: '', endTime: '' },
      friday: { startTime: '', endTime: '' },
      saturday: { startTime: '', endTime: '' },
    },
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getInitialValues = (step: number) => {
    switch (step) {
      case 0:
        return {
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          username: formValues.username,
          email: formValues.email,
          phoneNumber: formValues.phoneNumber,
          password: formValues.password,
          // @ts-ignore: form-only field
          confirmPassword: (formValues as any).confirmPassword,
          gender: formValues.gender,
          dateOfBirth: formValues.dateOfBirth,
        };
      case 1:
        return {
          // @ts-ignore: form-only field
          verificationCode: (formValues as any).verificationCode,
        };
      case 2:
        return {
          specializations: Array.isArray(formValues.specializations)
            ? formValues.specializations
            : [],
          education: Array.isArray(formValues.education) && formValues.education.length > 0
            ? formValues.education
            : [{ university: '', startDate: '', endDate: '', stillEnrolled: false }],
          career: Array.isArray(formValues.career) && formValues.career.length > 0
            ? formValues.career
            : [{ institution: '', workType: '', startDate: '', endDate: '', currentlyWorking: false }],
          licenseNumber: formValues.licenseNumber || '',
          bio: formValues.bio || '',
        };
      case 3:
        return {
          clinicName: formValues.clinicName,
          address: formValues.address,
          city: formValues.city,
          country: formValues.country,
          consultationFee: formValues.consultationFee,
          // @ts-ignore: form-only field
          availability: (formValues as any).availability,
        };
      default:
        return {};
    }
  };

  const getValidationSchema = (step: number) => {
    switch (step) {
      case 0:
        return initialValidationSchema;
      case 1:
        return verificationSchema;
      case 2:
        return professionalInfoSchema;
      case 3:
        return clinicInfoSchema;
      default:
        return Yup.object({});
    }
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setFormValues(prev => ({
        ...prev,
        ...values,
        education: values.education !== undefined ? values.education : prev.education,
        career: values.career !== undefined ? values.career : prev.career,
      }));

      if (activeStep === 0) {
        // Send OTP to email
        setOtpError(null);
        setOtpSuccess(null);
        const response = await fetch('http://localhost:8080/otp/send-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email }),
        });
        const data = await response.json();
        if (data.status === 'success') {
          setOtpSent(true);
          setOtpSuccess('OTP sent to your email.');
          setActiveStep(1);
        } else {
          setOtpError(data.message || 'Failed to send OTP.');
        }
      } else if (activeStep === 1) {
        // Verify OTP
        setOtpError(null);
        setOtpSuccess(null);
        const response = await fetch('http://localhost:8080/otp/verify-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formValues.email, otp: values.otp }),
        });
        const data = await response.json();
        if (data.status === 'success') {
          setOtpSuccess('OTP verified successfully.');
          setActiveStep(2);
        } else {
          setOtpError(data.message || 'Invalid or expired OTP.');
        }
      } else if (activeStep === 2) {
        setActiveStep(3);
      } else {
        // Map education to backend DTOs
        const educationHistories = (formValues.education || []).map((edu: any) => ({
          institutionName: edu.university,
          startDate: edu.startDate || null,
          endDate: edu.endDate || null,
          stillEnrolled: !!edu.stillEnrolled
        }));
        // Map career to backend DTOs
        const workExperiences = (formValues.career || []).map((job: any) => ({
          organizationName: job.institution,
          roleTitle: job.workType,
          startDate: job.startDate || null,
          endDate: job.endDate || null,
          stillWorking: !!job.currentlyWorking
        }));
        // Map specialties to backend DTO format (array of enum values)
        const specializations = formValues.specializations || [];
        // Map availability to availableDays, availableTimeStart, availableTimeEnd
        // Use values from current step (step 3) if available, otherwise fall back to formValues
        const availability = values.availability || formValues.availability || {};
        const availableDays = Object.keys(availability).filter(day => availability[day].startTime && availability[day].endTime);
        // Find earliest start time and latest end time across all selected days
        let availableTimeStart = '';
        let availableTimeEnd = '';
        if (availableDays.length > 0) {
          const startTimes = availableDays.map(day => availability[day].startTime).sort();
          const endTimes = availableDays.map(day => availability[day].endTime).sort();
          availableTimeStart = startTimes[0];
          availableTimeEnd = endTimes[endTimes.length - 1];
        }
        // Use values from current step (step 3) for clinic info, fall back to formValues
        const dto = {
          username: formValues.username || '',
          password: formValues.password || '',
          email: formValues.email || '',
          firstName: formValues.firstName || '',
          lastName: formValues.lastName || '',
          gender: formValues.gender || '',
          dateOfBirth: formValues.dateOfBirth || null,
          phoneNumber: formValues.phoneNumber || '',
          // Use clinic info from current step (values) if available, otherwise from formValues
          address: values.address || formValues.address || '',
          city: values.city || formValues.city || '',
          country: values.country || formValues.country || '',
          consultationFee: Number(values.consultationFee || formValues.consultationFee) || 0,
          bio: formValues.bio || '',
          clinicName: values.clinicName || formValues.clinicName || '',
          licenseNumber: formValues.licenseNumber || '',
          availableDays,
          availableTimeStart,
          availableTimeEnd,
          specializations,
          educationHistories,
          workExperiences,
        };
        const response = await fetch('http://localhost:8080/healthprovider/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        });
        
        const data = await response.json();
        if (response.ok && data.status === 'success') {
          console.log('Registration successful:', data.message);
          navigate('/doctor-login');
        } else {
          console.error('Registration failed:', data.message);
          setError('Registration failed: ' + data.message);
        }
      }
    } catch (error) {
      setError('An error occurred during registration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpError(null);
    setOtpSuccess(null);
    const response = await fetch('http://localhost:8080/otp/resend-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formValues.email }),
    });
    const data = await response.json();
    if (data.status === 'success') {
      setOtpSuccess('OTP resent to your email.');
    } else {
      setOtpError(data.message || 'Failed to resend OTP.');
    }
  };

  const handleTimeChange = (formikProps: any, day: string, field: 'startTime' | 'endTime', value: string) => {
    formikProps.setFieldValue(`availability.${day}.${field}`, value);
  };

  const renderStepContent = (step: number, formikProps: any) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="firstName"
                label="First Name"
                value={formikProps.values.firstName}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.firstName && Boolean(formikProps.errors.firstName)}
                helperText={formikProps.touched.firstName && formikProps.errors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="lastName"
                label="Last Name"
                value={formikProps.values.lastName}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.lastName && Boolean(formikProps.errors.lastName)}
                helperText={formikProps.touched.lastName && formikProps.errors.lastName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="username"
                label="Username"
                value={formikProps.values.username}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.username && Boolean(formikProps.errors.username)}
                helperText={formikProps.touched.username && formikProps.errors.username}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="email"
                label="Email"
                type="email"
                value={formikProps.values.email}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.email && Boolean(formikProps.errors.email)}
                helperText={formikProps.touched.email && formikProps.errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="phoneNumber"
                label="Phone Number"
                type="tel"
                placeholder="07XXXXXXXX"
                value={formikProps.values.phoneNumber}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.phoneNumber && Boolean(formikProps.errors.phoneNumber)}
                helperText={
                  formikProps.touched.phoneNumber && formikProps.errors.phoneNumber
                    ? formikProps.errors.phoneNumber
                    : 'Must start with 07 and be exactly 10 digits'
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="password"
                label="Password"
                type="password"
                value={formikProps.values.password}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.password && Boolean(formikProps.errors.password)}
                helperText={formikProps.touched.password && formikProps.errors.password}
              />
              <Box sx={{ mt: 1, mb: 1 }}>
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formikProps.values.confirmPassword}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.confirmPassword && Boolean(formikProps.errors.confirmPassword)}
                helperText={formikProps.touched.confirmPassword && formikProps.errors.confirmPassword}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formikProps.values.gender}
                  onChange={formikProps.handleChange}
                  onBlur={formikProps.handleBlur}
                  error={formikProps.touched.gender && Boolean(formikProps.errors.gender)}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
                {formikProps.touched.gender && formikProps.errors.gender && (
                  <Typography color="error" variant="caption">
                    {formikProps.errors.gender}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={formikProps.values.dateOfBirth}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.dateOfBirth && Boolean(formikProps.errors.dateOfBirth)}
                helperText={formikProps.touched.dateOfBirth && formikProps.errors.dateOfBirth}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().split('T')[0] }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                Please enter the OTP sent to your email.
              </Typography>
              <TextField
                fullWidth
                name="otp"
                label="OTP"
                value={formikProps.values.otp}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.otp && Boolean(formikProps.errors.otp)}
                helperText={formikProps.touched.otp && formikProps.errors.otp}
              />
              {otpError && <Alert severity="error" sx={{ mt: 2 }}>{otpError}</Alert>}
              {otpSuccess && <Alert severity="success" sx={{ mt: 2 }}>{otpSuccess}</Alert>}
              <Button variant="outlined" onClick={handleResendOTP} sx={{ mt: 2 }}>
                Resend OTP
              </Button>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Specializations
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="specializations-label">Select Specializations</InputLabel>
                <Select
                  labelId="specializations-label"
                  multiple
                  name="specializations"
                  value={Array.isArray(formikProps.values.specializations) ? formikProps.values.specializations : []}
                  onChange={formikProps.handleChange}
                  renderValue={(selected) =>
                    Array.isArray(selected) ? selected.join(', ') : ''
                  }
                >
                  {specialties.map(specialty => (
                    <MenuItem key={specialty} value={specialty}>
                      {specialty}
                    </MenuItem>
                  ))}
                </Select>
                {formikProps.touched.specializations && formikProps.errors.specializations && (
                  <Typography color="error" variant="caption">
                    {formikProps.errors.specializations}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Education
              </Typography>
              <FieldArray name="education">
                {({ push, remove, form }: { push: (obj: any) => void; remove: (idx: number) => void; form: any }): React.ReactNode => {
                  const educationArr: any[] = Array.isArray(form.values.education) ? form.values.education : [];
                  return (
                    <div>
                      {educationArr.map((edu: any, idx: number) => (
                        <Grid container spacing={2} key={idx} sx={{ mb: 2, alignItems: 'center' }}>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              name={`education[${idx}].university`}
                              label="University Name"
                              value={edu.university}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              error={form.touched.university && Boolean(form.errors.university)}
                              helperText={form.touched.university && form.errors.university}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              name={`education[${idx}].startDate`}
                              label="Start Date"
                              type="date"
                              value={edu.startDate}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              InputLabelProps={{ shrink: true }}
                              error={form.touched.startDate && Boolean(form.errors.startDate)}
                              helperText={form.touched.startDate && form.errors.startDate}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              name={`education[${idx}].endDate`}
                              label="End Date"
                              type="date"
                              value={edu.endDate}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              InputLabelProps={{ shrink: true }}
                              disabled={edu.stillEnrolled}
                              error={form.touched.endDate && Boolean(form.errors.endDate)}
                              helperText={form.touched.endDate && form.errors.endDate}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Box display="flex" alignItems="center">
                              <input
                                type="checkbox"
                                id={`education[${idx}].stillEnrolled`}
                                name={`education[${idx}].stillEnrolled`}
                                checked={edu.stillEnrolled}
                                onChange={e => form.setFieldValue(`education[${idx}].stillEnrolled`, e.target.checked)}
                                style={{ marginRight: 8 }}
                              />
                              <label htmlFor={`education[${idx}].stillEnrolled`}>Still Enrolled</label>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            {educationArr.length > 1 && (
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => remove(idx)}
                                sx={{ mt: { xs: 2, sm: 0 } }}
                              >
                                Remove
                              </Button>
                            )}
                          </Grid>
                        </Grid>
                      ))}
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => push({ university: '', startDate: '', endDate: '', stillEnrolled: false })}
                      >
                        Add Education
                      </Button>
                    </div>
                  );
                }}
              </FieldArray>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Career History
              </Typography>
              <FieldArray name="career">
                {({ push, remove, form }: { push: (obj: any) => void; remove: (idx: number) => void; form: any }): React.ReactNode => {
                  const careerArr: any[] = Array.isArray(form.values.career) ? form.values.career : [];
                  return (
                    <div>
                      {careerArr.map((job: any, idx: number) => (
                        <Grid container spacing={2} key={idx} sx={{ mb: 2, alignItems: 'center' }}>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              name={`career[${idx}].institution`}
                              label="Institution Name"
                              value={job.institution}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              error={form.touched.institution && Boolean(form.errors.institution)}
                              helperText={form.touched.institution && form.errors.institution}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`career[${idx}].workType`}
                              label="Type of Work"
                              value={job.workType}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              error={form.touched.workType && Boolean(form.errors.workType)}
                              helperText={form.touched.workType && form.errors.workType}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`career[${idx}].startDate`}
                              label="Start Date"
                              type="date"
                              value={job.startDate}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              InputLabelProps={{ shrink: true }}
                              error={form.touched.startDate && Boolean(form.errors.startDate)}
                              helperText={form.touched.startDate && form.errors.startDate}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`career[${idx}].endDate`}
                              label="End Date"
                              type="date"
                              value={job.endDate}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              InputLabelProps={{ shrink: true }}
                              disabled={job.currentlyWorking}
                              error={form.touched.endDate && Boolean(form.errors.endDate)}
                              helperText={form.touched.endDate && form.errors.endDate}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Box display="flex" alignItems="center">
                              <input
                                type="checkbox"
                                id={`career[${idx}].currentlyWorking`}
                                name={`career[${idx}].currentlyWorking`}
                                checked={job.currentlyWorking}
                                onChange={e => form.setFieldValue(`career[${idx}].currentlyWorking`, e.target.checked)}
                                style={{ marginRight: 8 }}
                              />
                              <label htmlFor={`career[${idx}].currentlyWorking`}>Currently Working</label>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            {careerArr.length > 1 && (
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => remove(idx)}
                                sx={{ mt: { xs: 2, sm: 0 } }}
                              >
                                Remove
                              </Button>
                            )}
                          </Grid>
                        </Grid>
                      ))}
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => push({ institution: '', workType: '', startDate: '', endDate: '', currentlyWorking: false })}
                      >
                        Add Career
                      </Button>
                    </div>
                  );
                }}
              </FieldArray>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="licenseNumber"
                label="License Number"
                value={formikProps.values.licenseNumber}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.licenseNumber && Boolean(formikProps.errors.licenseNumber)}
                helperText={formikProps.touched.licenseNumber && formikProps.errors.licenseNumber}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="bio"
                label="Bio"
                value={formikProps.values.bio}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.bio && Boolean(formikProps.errors.bio)}
                helperText={formikProps.touched.bio && formikProps.errors.bio}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="clinicName"
                label="Clinic Name"
                value={formikProps.values.clinicName}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.clinicName && Boolean(formikProps.errors.clinicName)}
                helperText={formikProps.touched.clinicName && formikProps.errors.clinicName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="address"
                label="Street Address"
                value={formikProps.values.address}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.address && Boolean(formikProps.errors.address)}
                helperText={formikProps.touched.address && formikProps.errors.address}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="city"
                label="City"
                value={formikProps.values.city}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.city && Boolean(formikProps.errors.city)}
                helperText={formikProps.touched.city && formikProps.errors.city}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="country"
                label="Country"
                value={formikProps.values.country}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.country && Boolean(formikProps.errors.country)}
                helperText={formikProps.touched.country && formikProps.errors.country}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="consultationFee"
                label="Initial Consultation Fee ($)"
                type="number"
                value={formikProps.values.consultationFee}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.consultationFee && Boolean(formikProps.errors.consultationFee)}
                helperText={formikProps.touched.consultationFee && formikProps.errors.consultationFee}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Availability
              </Typography>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                <Box key={day} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, textTransform: 'capitalize' }}>
                    {day}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Start Time"
                        value={formikProps.values.availability?.[day]?.startTime || ''}
                        onChange={(e) => {
                          formikProps.setFieldValue(`availability.${day}.startTime`, e.target.value);
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        error={formikProps.touched.availability && formikProps.errors.availability && Boolean(formikProps.errors.availability[day]?.startTime)}
                        helperText={formikProps.touched.availability && formikProps.errors.availability && formikProps.errors.availability[day]?.startTime}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="End Time"
                        value={formikProps.values.availability?.[day]?.endTime || ''}
                        onChange={(e) => {
                          formikProps.setFieldValue(`availability.${day}.endTime`, e.target.value);
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        error={formikProps.touched.availability && formikProps.errors.availability && Boolean(formikProps.errors.availability[day]?.endTime)}
                        helperText={formikProps.touched.availability && formikProps.errors.availability && formikProps.errors.availability[day]?.endTime}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container>
      <StyledPaper>
        <Typography variant="h4" align="center" gutterBottom>
          Doctor Registration
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  icon: index < activeStep ? <CheckCircleIcon color="primary" /> : index + 1,
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Formik
          initialValues={getInitialValues(activeStep)}
          validationSchema={getValidationSchema(activeStep)}
          onSubmit={handleSubmit}
        >
          {(formikProps) => (
            <form onSubmit={formikProps.handleSubmit}>
              {renderStepContent(activeStep, formikProps)}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                {activeStep !== 0 && (
                  <StyledButton onClick={handleBack}>
                    Back
                  </StyledButton>
                )}
                <StyledButton
                  variant="contained"
                  color="primary"
                  type="submit"
                >
                  {activeStep === steps.length - 1 ? 'Complete Registration' : 'Next'}
                </StyledButton>
              </Box>
            </form>
          )}
        </Formik>
      </StyledPaper>
    </Container>
  );
};

export default DoctorRegister; 