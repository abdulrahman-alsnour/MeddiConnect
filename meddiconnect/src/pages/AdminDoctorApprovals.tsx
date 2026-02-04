import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type EducationHistorySummary = {
  institutionName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  stillEnrolled?: boolean;
};

type WorkExperienceSummary = {
  organizationName?: string | null;
  roleTitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  stillWorking?: boolean;
};

type PendingDoctor = {
  id: number;
  firstName: string;
  lastName: string;
  clinicName?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  profilePicture?: string | null;
  registrationDate?: string | null;
  licenseNumber?: string | null;
  bio?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  consultationFee?: number | null;
  insuranceAccepted?: string[] | null;
  availableDays?: string[] | null;
  availableTimeStart?: string | null;
  availableTimeEnd?: string | null;
  specializations?: string[];
  educationHistories?: EducationHistorySummary[];
  workExperiences?: WorkExperienceSummary[];
  accountStatus: 'PENDING' | 'ACTIVE' | 'ON_HOLD' | 'BANNED' | 'REJECTED';
};

type FilterState = {
  name: string;
  city: string;
};

const defaultFilters: FilterState = {
  name: '',
  city: '',
};

/**
 * Admin Function 4 · Doctor Approvals
 *
 * Dedicated screen where administrators review newly submitted doctor registrations.
 * Doctors appear here in the `PENDING` state until an admin accepts or rejects them.
 */
const AdminDoctorApprovals: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [decisionDoctorId, setDecisionDoctorId] = useState<number | null>(null);
  const [pendingFocusDoctorId, setPendingFocusDoctorId] = useState<number | null>(null);
  const [highlightedDoctorId, setHighlightedDoctorId] = useState<number | null>(null);

  const token = useMemo(() => user?.token?.trim() ?? '', [user?.token]);
  const getAuthHeader = useCallback(
    () => (token.startsWith('Bearer ') ? token : `Bearer ${token}`),
    [token],
  );

  const formatSpecialization = useCallback((input: string) => {
    return input
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

// Ensure only administrators can access the approvals screen.
useEffect(() => {
    if (!user?.token || user.type !== 'admin') {
      navigate('/admin/login', { replace: true });
    }
  }, [user, navigate]);

  const fetchPendingDoctors = useCallback(
    async (activeFilters: FilterState) => {
      if (!token) {
        setError('Your session expired. Please sign in again.');
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }

      setLoading(true);
      setError(null);
      setInfoMessage(null);

      try {
        const params = new URLSearchParams();
        params.append('status', 'PENDING');
        if (activeFilters.name.trim()) {
          params.append('name', activeFilters.name.trim());
        }
        if (activeFilters.city.trim()) {
          params.append('city', activeFilters.city.trim());
        }

        const response = await fetch(
          `http://localhost:8080/admin/doctors?${params.toString()}`,
          {
            headers: { Authorization: getAuthHeader() },
          },
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError('Your session expired. Please sign in again.');
            logout();
            navigate('/admin/login', { replace: true });
            return;
          }
          const message = await response.text();
          throw new Error(message || 'Unable to load pending registrations.');
        }

        const payload = await response.json();
        const entries: PendingDoctor[] = Array.isArray(payload?.doctors)
          ? payload.doctors.map((doc: any) => ({
              ...doc,
              accountStatus: (doc.accountStatus as PendingDoctor['accountStatus']) ?? 'PENDING',
              licenseNumber: doc.licenseNumber ?? null,
              bio: doc.bio ?? null,
              consultationFee: doc.consultationFee ?? null,
              insuranceAccepted: Array.isArray(doc.insuranceAccepted) ? doc.insuranceAccepted : [],
              specializations: Array.isArray(doc.specializations) ? doc.specializations : [],
              availableDays: Array.isArray(doc.availableDays) ? doc.availableDays : [],
              availableTimeStart: doc.availableTimeStart ?? null,
              availableTimeEnd: doc.availableTimeEnd ?? null,
              educationHistories: Array.isArray(doc.educationHistories)
                ? doc.educationHistories
                : [],
              workExperiences: Array.isArray(doc.workExperiences) ? doc.workExperiences : [],
            }))
          : [];

        setPendingDoctors(entries);
        if (entries.length === 0) {
          setInfoMessage('No doctor registrations require approval right now.');
        }
      } catch (err) {
        console.error('Failed to load pending doctors', err);
        setError(
          err instanceof Error ? err.message : 'Unable to load pending registrations. Try again later.',
        );
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeader, logout, navigate, token],
  );

  useEffect(() => {
    fetchPendingDoctors(filters);
  }, [fetchPendingDoctors]);

  const handleSearch = useCallback(async () => {
    await fetchPendingDoctors(filters);
  }, [fetchPendingDoctors, filters]);

  const handleReset = useCallback(async () => {
    setFilters(defaultFilters);
    setPendingFocusDoctorId(null);
    setHighlightedDoctorId(null);
    await fetchPendingDoctors(defaultFilters);
  }, [fetchPendingDoctors]);

// Maintain focus when navigated from dashboard notifications.
useEffect(() => {
  const state = location.state as { focusDoctorId?: number | null } | null;
  if (state?.focusDoctorId) {
    setFilters(defaultFilters);
    setPendingFocusDoctorId(state.focusDoctorId);
    setHighlightedDoctorId(null);
    fetchPendingDoctors(defaultFilters);
    navigate(location.pathname, { replace: true, state: undefined });
  }
}, [defaultFilters, fetchPendingDoctors, location.pathname, location.state, navigate]);

// Highlight the targeted doctor card once data is loaded.
useEffect(() => {
  if (!pendingFocusDoctorId) {
    return;
  }
  const exists = pendingDoctors.some((doctor) => doctor.id === pendingFocusDoctorId);
  if (exists) {
    setHighlightedDoctorId(pendingFocusDoctorId);
    setPendingFocusDoctorId(null);
  } else if (!loading) {
    setInfoMessage('This doctor is no longer pending approval.');
    setPendingFocusDoctorId(null);
    setHighlightedDoctorId(null);
  }
}, [loading, pendingDoctors, pendingFocusDoctorId]);

// Smooth scroll the highlighted doctor into view.
useEffect(() => {
  if (!highlightedDoctorId) {
    return;
  }
  const element = document.getElementById(`pending-doctor-${highlightedDoctorId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [highlightedDoctorId, pendingDoctors]);

  const updateDoctorStatus = useCallback(
    async (doctorId: number, nextStatus: 'ACTIVE' | 'REJECTED') => {
      if (!token) {
        setError('Your session expired. Please sign in again.');
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }

      setDecisionDoctorId(doctorId);
      setError(null);
      setInfoMessage(null);

      try {
        const response = await fetch(`http://localhost:8080/admin/doctors/${doctorId}/status`, {
          method: 'PATCH',
          headers: {
            Authorization: getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: nextStatus }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message =
            typeof payload?.message === 'string' && payload.message.trim().length > 0
              ? payload.message
              : 'Unable to update doctor status.';
          throw new Error(message);
        }

        setPendingDoctors((prev) => prev.filter((doctor) => doctor.id !== doctorId));
        const feedback =
          typeof payload?.message === 'string' && payload.message.trim().length > 0
            ? payload.message
            : nextStatus === 'ACTIVE'
            ? 'Doctor account approved and activated.'
            : 'Doctor registration rejected.';
        setInfoMessage(feedback);
      } catch (err) {
        console.error('Failed to update doctor status', err);
        setError(err instanceof Error ? err.message : 'Unable to update doctor status.');
      } finally {
        setDecisionDoctorId(null);
      }
    },
    [getAuthHeader, logout, navigate, token],
  );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Doctor Approvals
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchPendingDoctors(filters)}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
          <Button variant="outlined" onClick={() => navigate('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Filter pending registrations
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              label="Doctor or clinic name"
              fullWidth
              value={filters.name}
              onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              label="City"
              fullWidth
              value={filters.city}
              onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={handleReset} disabled={loading}>
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {infoMessage && !error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {infoMessage}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && pendingDoctors.length > 0 && (
        <Grid container spacing={3}>
          {pendingDoctors.map((doctor) => {
            const isHighlighted = doctor.id === highlightedDoctorId;
            const isBusy = decisionDoctorId === doctor.id;
            return (
              <Grid item xs={12} md={6} key={doctor.id} id={`pending-doctor-${doctor.id}`}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderTop: '4px solid',
                    borderColor: isHighlighted ? 'secondary.main' : 'primary.main',
                    boxShadow: isHighlighted ? '0px 12px 24px rgba(56, 101, 255, 0.25)' : undefined,
                    transform: isHighlighted ? 'translateY(-4px)' : 'none',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        src={doctor.profilePicture || undefined}
                        sx={{ width: 64, height: 64, bgcolor: 'primary.main', color: 'primary.contrastText' }}
                      >
                        {doctor.firstName?.charAt(0)}
                        {doctor.lastName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {doctor.clinicName || 'Clinic name unavailable'}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label="Pending verification"
                      color="info"
                      sx={{ fontWeight: 600, mb: 2, alignSelf: 'flex-start' }}
                    />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        Registered on:{' '}
                        {doctor.registrationDate
                          ? new Date(doctor.registrationDate).toLocaleString()
                          : 'Unknown'}
                      </Typography>
                      <Typography variant="body2">
                        Email: {doctor.email || 'Not provided'}
                      </Typography>
                      <Typography variant="body2">
                        Phone: {doctor.phoneNumber || 'Not provided'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <LocationOnIcon fontSize="small" color="action" />
                        {doctor.city || 'City not provided'}
                        {doctor.country ? ` · ${doctor.country}` : ''}
                      </Typography>
                      <Typography variant="body2">
                        Gender: {doctor.gender || 'Not provided'}
                      </Typography>
                      <Typography variant="body2">
                        Date of birth:{' '}
                        {doctor.dateOfBirth
                          ? new Date(doctor.dateOfBirth).toLocaleDateString()
                          : 'Not provided'}
                      </Typography>
                      <Typography variant="body2">
                        License number: {doctor.licenseNumber || 'Not provided'}
                      </Typography>
                      <Typography variant="body2">
                        Address:{' '}
                        {doctor.address
                          ? doctor.address
                          : 'Not provided'}
                      </Typography>
                    </Box>

                    {doctor.bio && doctor.bio.trim().length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Biography
                        </Typography>
                        <Typography variant="body2">{doctor.bio}</Typography>
                      </Box>
                    )}

                    {doctor.specializations && doctor.specializations.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Specializations
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {doctor.specializations.map((spec) => (
                            <Chip key={spec} label={formatSpecialization(spec)} size="small" color="primary" />
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        Consultation fee:{' '}
                        {doctor.consultationFee != null
                          ? `$${doctor.consultationFee.toFixed(2)}`
                          : 'Not provided'}
                      </Typography>
                      {doctor.insuranceAccepted && doctor.insuranceAccepted.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Accepted insurance
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {doctor.insuranceAccepted.map((ins) => (
                              <Chip key={ins} label={ins} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {doctor.availableDays && doctor.availableDays.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Availability
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {doctor.availableDays.map((day) => (
                              <Chip key={day} label={day} size="small" color="info" variant="outlined" />
                            ))}
                          </Box>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Time:{' '}
                            {doctor.availableTimeStart && doctor.availableTimeEnd
                              ? `${doctor.availableTimeStart} – ${doctor.availableTimeEnd}`
                              : 'Not specified'}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {doctor.educationHistories && doctor.educationHistories.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Education history
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                          {doctor.educationHistories.map((education, idx) => (
                            <Typography variant="body2" key={`${education.institutionName}-${idx}`}>
                              {education.institutionName || 'Institution not provided'} (
                              {education.startDate
                                ? new Date(education.startDate).toLocaleDateString()
                                : 'Start unknown'}{' '}
                              —{' '}
                              {education.stillEnrolled
                                ? 'Present'
                                : education.endDate
                                ? new Date(education.endDate).toLocaleDateString()
                                : 'End unknown'}
                              )
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {doctor.workExperiences && doctor.workExperiences.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Work experience
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                          {doctor.workExperiences.map((experience, idx) => (
                            <Typography variant="body2" key={`${experience.organizationName}-${idx}`}>
                              {(experience.roleTitle || 'Role not provided') + ' · ' + (experience.organizationName || 'Organization not provided')} (
                              {experience.startDate
                                ? new Date(experience.startDate).toLocaleDateString()
                                : 'Start unknown'}{' '}
                              —{' '}
                              {experience.stillWorking
                                ? 'Present'
                                : experience.endDate
                                ? new Date(experience.endDate).toLocaleDateString()
                                : 'End unknown'}
                              )
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions
                    sx={{
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                      px: 2,
                      pb: 2,
                    }}
                  >
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      sx={{ textTransform: 'none' }}
                      disabled={isBusy}
                      onClick={() => updateDoctorStatus(doctor.id, 'ACTIVE')}
                    >
                      {isBusy ? 'Approving…' : 'Approve'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      sx={{ textTransform: 'none' }}
                      disabled={isBusy}
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Reject the application for Dr. ${doctor.firstName} ${doctor.lastName}?`,
                        );
                        if (confirmed) {
                          updateDoctorStatus(doctor.id, 'REJECTED');
                        }
                      }}
                    >
                      {isBusy ? 'Rejecting…' : 'Reject'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default AdminDoctorApprovals;


