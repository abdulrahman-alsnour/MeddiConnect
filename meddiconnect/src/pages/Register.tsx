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
} from '@mui/material';
import { SignupPatientRequestDTO, MentalHealthMedicationDTO } from '../types/PatientSignup';
import { INSURANCE_PROVIDERS } from '../constants/insuranceProviders';

const dietaryHabitsMap: Record<string, string> = {
  'Balanced Diet (Includes all food groups)': 'BALANCED_DIET',
  'Vegetarian': 'VEGETARIAN',
  'Vegan': 'VEGAN',
  'Pescatarian': 'PEDESTRIAN',
  'Keto / Low Carb': 'KETO_LOW_CARB',
  'Gluten-Free': 'GLUTEN_FREE',
  'High Protein': 'HIGH_PROTEIN',
  'Other': 'Other',
  'Prefer Not to Say': 'Prefer_Not_To_Say'
};
const alcoholConsumptionMap: Record<string, string> = {
  'Never Drinks': 'Never_Drinks',
  'Occasionally Drinks (social drinking)': 'Occasionally_Drinks',
  'Regularly Drinks (weekly)': 'Regularly_Drinks',
  'Heavy Drinker': 'Heavy_Drinker',
  'Former Drinker': 'Former_Drinker'
};
const physicalActivityMap: Record<string, string> = {
  'Sedentary (Little to no exercise)': 'Sedentary',
  'Lightly Active (Light exercise 1-3 days/week)': 'Lightly_Active',
  'Moderately Active (Moderate exercise 3-5 days/week)': 'Moderately_Active',
  'Very Active (Intense exercise 6-7 days/week)': 'Very_Active',
  'Athlete / High-Performance Training': 'Athlete'
};
const smokingStatusMap: Record<string, string> = {
  'Never Smoked': 'Never_Smoked',
  'Former Smoker': 'Former_Smoker',
  'Occasional Smoker': 'Occasional_Smoker',
  'Regular Smoker': 'Regular_Smoker',
  'Heavy Smoker': 'Heavy_Smoker',
  'Prefer Not to Say': 'Prefer_Not_To_Say'
};
const bloodTypeMap: Record<string, string> = {
  'A+': 'A_POSITIVE',
  'A-': 'A_NEGATIVE',
  'B+': 'B_POSITIVE',
  'B-': 'B_NEGATIVE',
  'AB+': 'AB_POSITIVE',
  'AB-': 'AB_NEGATIVE',
  'O+': 'O_POSITIVE',
  'O-': 'O_NEGATIVE'
};

const mentalHealthConditionMap: Record<string, string> = {
  'No Known Mental Health Conditions': 'NO_KNOWN_MENTAL_HEALTH_CONDITIONS',
  'Depression': 'DEPRESSION',
  'Anxiety Disorder (Generalized Anxiety Disorder)': 'ANXIETY_DISORDER_GENERALIZED_ANXIETY_DISORDER',
  'Bipolar Disorder': 'BIPOLAR_DISORDER',
  'Post-Traumatic Stress Disorder (PTSD)': 'POST_TRAUMATIC_STRESS_DISORDER_PTSD',
  'Obsessive-Compulsive Disorder (OCD)': 'OBSESSIVE_COMPULSIVE_DISORDER_OCD',
  'Schizophrenia': 'SCHIZOPHRENIA',
  'Schizoaffective Disorder': 'SCHIZOAFFECTIVE_DISORDER',
  'Attention Deficit Hyperactivity Disorder (ADHD)': 'ATTENTION_DEFICIT_HYPERACTIVITY_DISORDER_ADHD',
  'Autism Spectrum Disorder (ASD)': 'AUTISM_SPECTRUM_DISORDER_ASD',
  'Panic Disorder': 'PANIC_DISORDER',
  'Social Anxiety Disorder': 'SOCIAL_ANXIETY_DISORDER',
  'Eating Disorder (e.g., Anorexia, Bulimia)': 'EATING_DISORDER_E_G_ANOREXIA_BULIMIA',
  'Personality Disorder (e.g., Borderline Personality Disorder)': 'PERSONALITY_DISORDER_E_G_BORDERLINE_PERSONALITY_DISORDER',
  'Substance Use Disorder (Alcohol or Drugs)': 'SUBSTANCE_USE_DISORDER_ALCOHOL_OR_DRUGS',
  'Insomnia / Chronic Sleep Disorder': 'INSOMNIA_CHRONIC_SLEEP_DISORDER',
  'Dementia / Cognitive Decline': 'DEMENTIA_COGNITIVE_DECLINE',
  "Alzheimer's Disease": 'ALZHEIMER_DISEASE',
  'Adjustment Disorder': 'ADJUSTMENT_DISORDER',
  'Psychotic Disorder (Other than Schizophrenia)': 'PSYCHOTIC_DISORDER_OTHER_THAN_SCHIZOPHRENIA',
  'Other': 'OTHER',
  'Prefer Not to Say': 'PREFER_NOT_TO_SAY'
};

const initialValidationSchema = Yup.object({
  username: Yup.string()
    .required('Username is required')
    .test('username-available', 'Username already exists', async function(value) {
      if (!value || value.trim() === '') {
        return true; // Let required validation handle empty values
      }
      try {
        const response = await fetch(`http://localhost:8080/patient/check-username?username=${encodeURIComponent(value)}`);
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
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  gender: Yup.string().required('Gender is required'),
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
  dateOfBirth: Yup.date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  insuranceProvider: Yup.string().nullable(),
  insuranceNumber: Yup.string().nullable(),
});

const verificationSchema = Yup.object({
  verificationCode: Yup.string()
    .nullable()
    .transform((value) => (value === '' ? null : value)),
});

const lifestyleOptions = {
  smokingStatus: [
    'Never Smoked',
    'Former Smoker',
    'Occasional Smoker',
    'Regular Smoker',
    'Heavy Smoker',
    'Prefer Not to Say',
  ],
  alcoholConsumption: [
    'Never Drinks',
    'Occasionally Drinks (social drinking)',
    'Regularly Drinks (weekly)',
    'Heavy Drinker',
    'Former Drinker',
    'Prefer Not to Say',
  ],
  physicalActivity: [
    'Sedentary (Little to no exercise)',
    'Lightly Active (Light exercise 1-3 days/week)',
    'Moderately Active (Moderate exercise 3-5 days/week)',
    'Very Active (Intense exercise 6-7 days/week)',
    'Athlete / High-Performance Training',
    'Prefer Not to Say',
  ],
  dietaryHabits: [
    'Balanced Diet (Includes all food groups)',
    'Vegetarian',
    'Vegan',
    'Pescatarian',
    'Keto / Low Carb',
    'Gluten-Free',
    'High Protein',
    'Other',
    'Prefer Not to Say',
  ],
};

const mentalHealthConditions = [
  'No Known Mental Health Conditions',
  'Depression',
  'Anxiety Disorder (Generalized Anxiety Disorder)',
  'Bipolar Disorder',
  'Post-Traumatic Stress Disorder (PTSD)',
  'Obsessive-Compulsive Disorder (OCD)',
  'Schizophrenia',
  'Schizoaffective Disorder',
  'Attention Deficit Hyperactivity Disorder (ADHD)',
  'Autism Spectrum Disorder (ASD)',
  'Panic Disorder',
  'Social Anxiety Disorder',
  'Eating Disorder (e.g., Anorexia, Bulimia)',
  'Personality Disorder (e.g., Borderline Personality Disorder)',
  'Substance Use Disorder (Alcohol or Drugs)',
  'Insomnia / Chronic Sleep Disorder',
  'Dementia / Cognitive Decline',
  "Alzheimer's Disease",
  'Adjustment Disorder',
  'Psychotic Disorder (Other than Schizophrenia)',
  'Other',
  'Prefer Not to Say',
];

const optionalInfoSchema = Yup.object({
  age: Yup.number()
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  bloodType: Yup.string().nullable(),
  height: Yup.number()
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  weight: Yup.number()
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  allergies: Yup.string().nullable(),
  medicalConditions: Yup.string().nullable(),
  previousSurgeries: Yup.string().nullable(),
  familyMedicalHistory: Yup.string().nullable(),
  mentalHealthCondition: Yup.string().nullable(),
  mentalHealthConditionOther: Yup.string().when('mentalHealthCondition', {
    is: 'Other',
    then: (schema) => schema.required('Please specify your mental health condition'),
    otherwise: (schema) => schema.notRequired(),
  }),
  mentalHealthMedications: Yup.array().of(
    Yup.object({
      name: Yup.string().nullable(),
      dosage: Yup.string().nullable(),
      frequency: Yup.string().nullable(),
      startDate: Yup.string().nullable(),
      endDate: Yup.string().nullable(),
      stillInUse: Yup.boolean().nullable(),
    })
  ),
  currentMedications: Yup.array().of(
    Yup.object({
      name: Yup.string().nullable(),
      dosage: Yup.string().nullable(),
      frequency: Yup.string().nullable(),
      startDate: Yup.string().nullable(),
      endDate: Yup.string().nullable(),
      stillInUse: Yup.boolean().nullable(),
    })
  ),
  laboratoryResults: Yup.array().of(
    Yup.object({
      testType: Yup.string().nullable(),
      files: Yup.mixed().nullable(),
    })
  ),
  smokingStatus: Yup.string().nullable(),
  alcoholConsumption: Yup.string().nullable(),
  physicalActivity: Yup.string().nullable(),
  dietaryHabits: Yup.string().nullable(),
  dietaryHabitsOther: Yup.string().when('dietaryHabits', {
    is: 'Other',
    then: (schema) => schema.required('Please specify your dietary habits'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const steps = ['Basic Information', 'OTP Verification', 'Optional Information'];

const Register = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [formValues, setFormValues] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInitialSubmit = async (values: any) => {
    try {
      // TODO: Implement API call to send verification code
      console.log('Sending verification code to:', values.email);
      setOtpSent(true);
      handleNext();
    } catch (error) {
      setError('Failed to send verification code. Please try again.');
    }
  };

  const handleVerificationSubmit = async (values: any) => {
    try {
      // Accept any verification code for now
      handleNext();
    } catch (error) {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleFinalSubmit = async (values: any) => {
    try {
      // Map form values to DTO
      const dto: SignupPatientRequestDTO = {
        username: values.username,
        password: values.password,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
        phoneNumber: values.phoneNumber,
        bloodType: values.bloodType ? bloodTypeMap[values.bloodType as string] : undefined,
        height: Number(values.height),
        weight: Number(values.weight),
        allergies: values.allergies || '',
        medicalConditions: values.medicalConditions || '',
        previousSurgeries: values.previousSurgeries || '',
        familyMedicalHistory: values.familyMedicalHistory || '',
        dietaryHabits: values.dietaryHabits ? dietaryHabitsMap[values.dietaryHabits as string] : undefined,
        alcoholConsumption: values.alcoholConsumption ? alcoholConsumptionMap[values.alcoholConsumption as string] : undefined,
        physicalActivity: values.physicalActivity ? physicalActivityMap[values.physicalActivity as string] : undefined,
        smokingStatus: values.smokingStatus ? smokingStatusMap[values.smokingStatus as string] : undefined,
        mentalHealthCondition: values.mentalHealthCondition ? mentalHealthConditionMap[values.mentalHealthCondition as string] : undefined,
        medications: (values.currentMedications || []).map((med: any) => ({
          medicationName: med.medicationName,
          medicationDosage: med.medicationDosage,
          medicationFrequency: med.medicationFrequency,
          medicationStartDate: med.medicationStartDate,
          medicationEndDate: med.medicationEndDate,
          inUse: med.inUse,
        })),
        mentalHealthMedications: (values.mentalHealthMedications || []).map((med: any) => ({
          medicationName: med.medicationName,
          medicationDosage: med.medicationDosage,
          medicationFrequency: med.medicationFrequency,
          medicationStartDate: med.medicationStartDate,
          medicationEndDate: med.medicationEndDate,
          inUse: med.inUse,
        })) as MentalHealthMedicationDTO[],
        // Laboratory Results - only include testType (description), files will be uploaded later via profile
        laboratoryResults: (values.laboratoryResults || [])
          .filter((lab: any) => lab.testType && lab.testType.trim() !== '') // Only include labs with testType
          .map((lab: any) => ({
            testType: lab.testType.trim(), // This will be mapped to description in the backend
            resultUrl: null, // No URL during registration, files uploaded later
          })),
        // Insurance Information
        insuranceProvider: values.insuranceProvider || '',
        insuranceNumber: values.insuranceNumber || '',
      };
      const response = await fetch('http://localhost:8080/patient/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data.message);
        navigate('/patient-login');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Registration failed. Please try again.');
        return;
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    }
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setFormValues((prev: any) => ({ ...prev, ...values }));
    if (activeStep === 0) {
      // Send OTP to email
      setOtpError(null);
      setOtpSuccess(null);
      try {
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
      } catch (error) {
        setOtpError('Failed to send OTP.');
      }
      setSubmitting(false);
      return;
    }
    if (activeStep === 1) {
      // Verify OTP
      setOtpError(null);
      setOtpSuccess(null);
      try {
        const response = await fetch('http://localhost:8080/otp/verify-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formValues.email, otp }),
        });
        const data = await response.json();
        if (data.status === 'success') {
          setOtpSuccess('OTP verified successfully.');
          setActiveStep(2);
        } else {
          setOtpError(data.message || 'Invalid or expired OTP.');
        }
      } catch (error) {
        setOtpError('Failed to verify OTP.');
      }
      setSubmitting(false);
      return;
    }
    // Final step: submit registration
    handleFinalSubmit(values);
  };

  const handleResendOTP = async () => {
    setOtpError(null);
    setOtpSuccess(null);
    try {
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
    } catch (error) {
      setOtpError('Failed to resend OTP.');
    }
  };

  const renderStepContent = (step: number, formikProps: any) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
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
            <Grid item xs={12}>
              <Grid container spacing={2}>
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
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Insurance Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Insurance Provider</InputLabel>
                <Select
                  name="insuranceProvider"
                  value={formikProps.values.insuranceProvider || ''}
                  onChange={formikProps.handleChange}
                  onBlur={formikProps.handleBlur}
                  label="Insurance Provider"
                  error={formikProps.touched.insuranceProvider && Boolean(formikProps.errors.insuranceProvider)}
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="insuranceNumber"
                label="Insurance Number"
                value={formikProps.values.insuranceNumber}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.insuranceNumber && Boolean(formikProps.errors.insuranceNumber)}
                helperText={formikProps.touched.insuranceNumber && formikProps.errors.insuranceNumber}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                Please enter the verification code sent to your email.
              </Typography>
              <TextField
                fullWidth
                name="verificationCode"
                label="Verification Code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="age"
                label="Age"
                type="number"
                value={formikProps.values.age}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.age && Boolean(formikProps.errors.age)}
                helperText={formikProps.touched.age && formikProps.errors.age}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                name="bloodType"
                label="Blood Type"
                value={formikProps.values.bloodType}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.bloodType && Boolean(formikProps.errors.bloodType)}
                helperText={formikProps.touched.bloodType && formikProps.errors.bloodType}
              >
                <MenuItem value="">None</MenuItem>
                {bloodTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="height"
                label="Height (cm)"
                type="number"
                value={formikProps.values.height}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.height && Boolean(formikProps.errors.height)}
                helperText={formikProps.touched.height && formikProps.errors.height}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="weight"
                label="Weight (kg)"
                type="number"
                value={formikProps.values.weight}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.weight && Boolean(formikProps.errors.weight)}
                helperText={formikProps.touched.weight && formikProps.errors.weight}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="allergies"
                label="Allergies"
                multiline
                rows={2}
                value={formikProps.values.allergies}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.allergies && Boolean(formikProps.errors.allergies)}
                helperText={formikProps.touched.allergies && formikProps.errors.allergies}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="medicalConditions"
                label="Medical Conditions"
                multiline
                rows={2}
                value={formikProps.values.medicalConditions}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={formikProps.touched.medicalConditions && Boolean(formikProps.errors.medicalConditions)}
                helperText={formikProps.touched.medicalConditions && formikProps.errors.medicalConditions}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="previousSurgeries"
                label="Previous Surgeries"
                multiline
                rows={2}
                value={formikProps.values.previousSurgeries}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="familyMedicalHistory"
                label="Family Medical History"
                multiline
                rows={2}
                value={formikProps.values.familyMedicalHistory}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Lifestyle
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="smokingStatus"
                label="Smoking Status"
                value={formikProps.values.smokingStatus}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
              >
                <MenuItem value="">Select...</MenuItem>
                {lifestyleOptions.smokingStatus.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="alcoholConsumption"
                label="Alcohol Consumption"
                value={formikProps.values.alcoholConsumption}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
              >
                <MenuItem value="">Select...</MenuItem>
                {lifestyleOptions.alcoholConsumption.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="physicalActivity"
                label="Physical Activity Level"
                value={formikProps.values.physicalActivity}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
              >
                <MenuItem value="">Select...</MenuItem>
                {lifestyleOptions.physicalActivity.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="dietaryHabits"
                label="Dietary Habits"
                value={formikProps.values.dietaryHabits}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
              >
                <MenuItem value="">Select...</MenuItem>
                {lifestyleOptions.dietaryHabits.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {formikProps.values.dietaryHabits === 'Other' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="dietaryHabitsOther"
                  label="Please specify your dietary habits"
                  value={formikProps.values.dietaryHabitsOther}
                  onChange={formikProps.handleChange}
                  onBlur={formikProps.handleBlur}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Laboratory Results
              </Typography>
              <FieldArray name="laboratoryResults">
                {({ push, remove, form }: { push: (obj: any) => void; remove: (idx: number) => void; form: any }): React.ReactNode => {
                  const labArr: any[] = Array.isArray(form.values.laboratoryResults) ? form.values.laboratoryResults : [];
                  return (
                    <div>
                      {labArr.map((lab: any, idx: number) => (
                        <Grid container spacing={2} key={idx} sx={{ mb: 2, alignItems: 'center' }}>
                          <Grid item xs={12} sm={10}>
                            <TextField
                              fullWidth
                              name={`laboratoryResults[${idx}].testType`}
                              label="Test Type / Description"
                              value={lab.testType || ''}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              placeholder="e.g., Blood Test - Complete Blood Count"
                              helperText="You can upload PDF files later in your profile"
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => remove(idx)}
                              sx={{ mt: { xs: 2, sm: 0 } }}
                            >
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      ))}
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => push({ testType: '' })}
                      >
                        Add Laboratory Result
                      </Button>
                    </div>
                  );
                }}
              </FieldArray>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Mental Health
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                name="mentalHealthCondition"
                label="Mental Health Condition"
                value={formikProps.values.mentalHealthCondition}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
              >
                <MenuItem value="">Select...</MenuItem>
                {mentalHealthConditions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {formikProps.values.mentalHealthCondition === 'Other' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="mentalHealthConditionOther"
                  label="Please specify your mental health condition"
                  value={formikProps.values.mentalHealthConditionOther}
                  onChange={formikProps.handleChange}
                  onBlur={formikProps.handleBlur}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Current Mental Health Medications
              </Typography>
              <FieldArray name="mentalHealthMedications">
                {({ push, remove, form }: { push: (obj: any) => void; remove: (idx: number) => void; form: any }): React.ReactNode => {
                  const medsArr: any[] = Array.isArray(form.values.mentalHealthMedications) ? form.values.mentalHealthMedications : [];
                  return (
                    <div>
                      {medsArr.map((med: any, idx: number) => (
                        <Grid container spacing={2} key={idx} sx={{ mb: 2, alignItems: 'center' }}>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`mentalHealthMedications[${idx}].medicationName`}
                              label="Medication Name"
                              value={med.medicationName}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`mentalHealthMedications[${idx}].medicationDosage`}
                              label="Dosage"
                              value={med.medicationDosage}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`mentalHealthMedications[${idx}].medicationFrequency`}
                              label="Frequency"
                              value={med.medicationFrequency}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`mentalHealthMedications[${idx}].medicationStartDate`}
                              label="Start Date"
                              type="date"
                              value={med.medicationStartDate}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`mentalHealthMedications[${idx}].medicationEndDate`}
                              label="End Date"
                              type="date"
                              value={med.medicationEndDate}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box display="flex" alignItems="center">
                              <input
                                type="checkbox"
                                id={`mentalHealthMedications[${idx}].inUse`}
                                name={`mentalHealthMedications[${idx}].inUse`}
                                checked={med.inUse}
                                onChange={e => form.setFieldValue(`mentalHealthMedications[${idx}].inUse`, e.target.checked)}
                                style={{ marginRight: 8 }}
                              />
                              <label htmlFor={`mentalHealthMedications[${idx}].inUse`}>Still in use</label>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => remove(idx)}
                              sx={{ width: '100%', minWidth: 0, p: 0.5 }}
                            >
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      ))}
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => push({ medicationName: '', medicationDosage: '', medicationFrequency: '', medicationStartDate: '', medicationEndDate: '', inUse: false })}
                      >
                        Add Medication
                      </Button>
                    </div>
                  );
                }}
              </FieldArray>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Current Medications
              </Typography>
              <FieldArray name="currentMedications">
                {({ push, remove, form }: { push: (obj: any) => void; remove: (idx: number) => void; form: any }): React.ReactNode => {
                  const medsArr: any[] = Array.isArray(form.values.currentMedications) ? form.values.currentMedications : [];
                  return (
                    <div>
                      {medsArr.map((med: any, idx: number) => (
                        <Grid container spacing={2} key={idx} sx={{ mb: 2, alignItems: 'center' }}>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`currentMedications[${idx}].medicationName`}
                              label="Medication Name"
                              value={med.medicationName}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`currentMedications[${idx}].medicationDosage`}
                              label="Dosage"
                              value={med.medicationDosage}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`currentMedications[${idx}].medicationFrequency`}
                              label="Frequency"
                              value={med.medicationFrequency}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`currentMedications[${idx}].medicationStartDate`}
                              label="Start Date"
                              type="date"
                              value={med.medicationStartDate}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              name={`currentMedications[${idx}].medicationEndDate`}
                              label="End Date"
                              type="date"
                              value={med.medicationEndDate}
                              onChange={form.handleChange}
                              onBlur={form.handleBlur}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box display="flex" alignItems="center">
                              <input
                                type="checkbox"
                                id={`currentMedications[${idx}].inUse`}
                                name={`currentMedications[${idx}].inUse`}
                                checked={med.inUse}
                                onChange={e => form.setFieldValue(`currentMedications[${idx}].inUse`, e.target.checked)}
                                style={{ marginRight: 8 }}
                              />
                              <label htmlFor={`currentMedications[${idx}].inUse`}>Still in use</label>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => remove(idx)}
                              sx={{ width: '100%', minWidth: 0, p: 0.5 }}
                            >
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      ))}
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => push({ medicationName: '', medicationDosage: '', medicationFrequency: '', medicationStartDate: '', medicationEndDate: '', inUse: false })}
                      >
                        Add Medication
                      </Button>
                    </div>
                  );
                }}
              </FieldArray>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  const getValidationSchema = (step: number) => {
    switch (step) {
      case 0:
        return initialValidationSchema;
      case 1:
        return verificationSchema;
      case 2:
        return optionalInfoSchema;
      default:
        return Yup.object();
    }
  };

  const getInitialValues = (step: number) => {
    switch (step) {
      case 0:
        return {
          username: '',
          firstName: '',
          lastName: '',
          email: '',
          gender: '',
          phoneNumber: '',
          dateOfBirth: '',
          password: '',
          confirmPassword: '',
          insuranceProvider: '',
          insuranceNumber: '',
        };
      case 1:
        return {
          verificationCode: '',
        };
      case 2:
        return {
          age: '',
          bloodType: '',
          height: '',
          weight: '',
          allergies: '',
          medicalConditions: '',
          previousSurgeries: '',
          familyMedicalHistory: '',
          mentalHealthCondition: '',
          mentalHealthConditionOther: '',
          mentalHealthMedications: [],
          currentMedications: [],
          laboratoryResults: [],
          smokingStatus: '',
          alcoholConsumption: '',
          physicalActivity: '',
          dietaryHabits: '',
          dietaryHabitsOther: '',
        };
      default:
        return {};
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Patient Registration
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
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
            <Form>
              {renderStepContent(activeStep, formikProps)}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                >
                  Back
                </Button>
                <Box>
                  {activeStep === 2 && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleFinalSubmit({})}
                      sx={{ mr: 2 }}
                    >
                      Skip for now
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={activeStep === 1 ? false : !formikProps.isValid || formikProps.isSubmitting}
                  >
                    {activeStep === steps.length - 1 ? 'Complete Registration' : 'Next'}
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default Register; 