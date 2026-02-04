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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FlagIcon from '@mui/icons-material/Flag';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type DoctorStatus = 'PENDING' | 'ACTIVE' | 'ON_HOLD' | 'BANNED' | 'REJECTED';

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

type AdminDoctorSummary = {
  id: number;
  firstName: string;
  lastName: string;
  clinicName?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  state?: string | null;
  zipcode?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  profilePicture?: string | null;
  consultationFee?: number | null;
  email?: string | null;
  phoneNumber?: string | null;
  specializations: string[];
  insuranceAccepted?: string[] | null;
  bio?: string | null;
  licenseNumber?: string | null;
  availableDays?: string[] | null;
  availableTimeStart?: string | null;
  availableTimeEnd?: string | null;
  adminFlagged?: boolean;
  adminFlagReason?: string | null;
  adminFlaggedAt?: string | null;
  accountStatus: DoctorStatus;
  educationHistories?: EducationHistorySummary[];
  workExperiences?: WorkExperienceSummary[];
};

type FilterState = {
  name: string;
  city: string;
  specialty: string;
  includeFlagged: boolean;
  status: '' | DoctorStatus;
};

const initialFilters: FilterState = {
  name: '',
  city: '',
  specialty: '',
  includeFlagged: false,
  status: '',
};

const SPECIALTIES = [
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
] as const;

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: FilterState['status'] }> = [
  { label: 'All statuses', value: '' },
  { label: 'Pending review', value: 'PENDING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On hold', value: 'ON_HOLD' },
  { label: 'Banned', value: 'BANNED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const AdminDoctors: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [doctors, setDoctors] = useState<AdminDoctorSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flaggingDoctor, setFlaggingDoctor] = useState<AdminDoctorSummary | null>(null);
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagActionDoctorId, setFlagActionDoctorId] = useState<number | null>(null);
  const [flagError, setFlagError] = useState<string | null>(null);

  const token = useMemo(() => user?.token?.trim() ?? '', [user?.token]);
  const getAuthHeader = useCallback(
    () => (token.startsWith('Bearer ') ? token : `Bearer ${token}`),
    [token],
  );

  useEffect(() => {
    if (!user?.token || user.type !== 'admin') {
      navigate('/admin/login', { replace: true });
    }
  }, [user, navigate]);

  const formatSpecialization = (spec: string) =>
    spec
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const resetState = useCallback(() => {
    setDoctors([]);
    setError(null);
    setInfoMessage(null);
    setHasSearched(false);
    setStatusUpdatingId(null);
    setFlagDialogOpen(false);
    setFlaggingDoctor(null);
    setFlagReason('');
    setFlagError(null);
    setFlagActionDoctorId(null);
    setFlagSubmitting(false);
  }, []);

  const fetchDoctors = useCallback(
    async (filterParams: FilterState) => {
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
        if (filterParams.name.trim()) {
          params.append('name', filterParams.name.trim());
        }
        if (filterParams.city.trim()) {
          params.append('city', filterParams.city.trim());
        }
        if (filterParams.specialty) {
          params.append('specialty', filterParams.specialty);
        }
        if (filterParams.status) {
          params.append('status', filterParams.status);
        }
        if (filterParams.includeFlagged) {
          params.append('includeFlagged', 'true');
        }

        const query = params.toString();
        const response = await fetch(`http://localhost:8080/admin/doctors${query ? `?${query}` : ''}`, {
          headers: {
            Authorization: getAuthHeader(),
          },
        });

        if (response.ok) {
          const payload = await response.json();
          const data: AdminDoctorSummary[] = Array.isArray(payload?.doctors)
            ? payload.doctors.map((doc: any) => ({
                ...doc,
                accountStatus: (doc.accountStatus as DoctorStatus | undefined) ?? 'ACTIVE',
                adminFlagged: Boolean(doc.adminFlagged),
                adminFlagReason: doc.adminFlagReason ?? null,
                adminFlaggedAt: doc.adminFlaggedAt ?? null,
                licenseNumber: doc.licenseNumber ?? null,
                bio: doc.bio ?? null,
                availableDays: Array.isArray(doc.availableDays) ? doc.availableDays : [],
                availableTimeStart: doc.availableTimeStart ?? null,
                availableTimeEnd: doc.availableTimeEnd ?? null,
                insuranceAccepted: Array.isArray(doc.insuranceAccepted) ? doc.insuranceAccepted : [],
                educationHistories: Array.isArray(doc.educationHistories)
                  ? doc.educationHistories
                  : [],
                workExperiences: Array.isArray(doc.workExperiences) ? doc.workExperiences : [],
              }))
            : [];
          setDoctors(data);
          setHasSearched(true);
          if (data.length === 0) {
            setInfoMessage('No doctors match the selected filters.');
          }
        } else if (response.status === 401 || response.status === 403) {
          setError('Your session expired. Please sign in again.');
          logout();
          navigate('/admin/login', { replace: true });
        } else {
          const message = await response.text();
          setError(message || 'Unable to load doctors. Try again later.');
        }
      } catch (err) {
        console.error('Failed to load doctors for admin', err);
        setError('Unable to load doctors. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeader, logout, navigate, token]
  );

  const handleSearch = useCallback(async () => {
    if (!user?.token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    const snapshot = { ...filters };
    setAppliedFilters(snapshot);
    await fetchDoctors(snapshot);
  }, [fetchDoctors, filters, navigate, user?.token]);

  const handleReset = useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    resetState();
  }, [resetState]);

  const handleRefresh = useCallback(async () => {
    if (!hasSearched) {
      setInfoMessage('Run a search before refreshing results.');
      return;
    }
    await fetchDoctors(appliedFilters);
  }, [appliedFilters, fetchDoctors, hasSearched]);

  const updateDoctorStatus = useCallback(
    async (doctorId: number, nextStatus: DoctorStatus) => {
      if (!token) {
        setError('Your session expired. Please sign in again.');
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }

      setStatusUpdatingId(doctorId);
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
              : 'Failed to update doctor status.';
          throw new Error(message);
        }

        setDoctors((prev) =>
          prev.map((doctor) =>
            doctor.id === doctorId
              ? {
                  ...doctor,
                  accountStatus: (payload?.accountStatus as DoctorStatus) ?? nextStatus,
                }
              : doctor,
          ),
        );

        const feedbackMessage =
          typeof payload?.message === 'string' && payload.message.trim().length > 0
            ? payload.message
            : `Doctor status updated to ${nextStatus.replace('_', ' ').toLowerCase()}.`;
        setInfoMessage(feedbackMessage);
      } catch (err) {
        console.error(`Failed to update doctor ${doctorId} status`, err);
        setError(err instanceof Error ? err.message : 'Failed to update doctor status.');
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [getAuthHeader, logout, navigate, token]
  );

  const handleHoldAccount = useCallback(
    (doctor: AdminDoctorSummary) => {
      updateDoctorStatus(doctor.id, 'ON_HOLD');
    },
    [updateDoctorStatus]
  );

  const handleResumeAccount = useCallback(
    (doctor: AdminDoctorSummary) => {
      updateDoctorStatus(doctor.id, 'ACTIVE');
    },
    [updateDoctorStatus]
  );

  const handleBanAccount = useCallback(
    (doctor: AdminDoctorSummary) => {
      const confirmed = window.confirm(
        `Ban Dr. ${doctor.firstName} ${doctor.lastName}? This action will prevent the doctor from logging in.`,
      );
      if (!confirmed) {
        return;
      }
      updateDoctorStatus(doctor.id, 'BANNED');
    },
    [updateDoctorStatus]
  );

  const openFlagDialog = useCallback((doctor: AdminDoctorSummary) => {
    setFlagDialogOpen(true);
    setFlaggingDoctor(doctor);
    setFlagReason(doctor.adminFlagReason ?? '');
    setFlagError(null);
  }, []);

  const closeFlagDialog = useCallback(() => {
    if (flagSubmitting) {
      return;
    }
    setFlagDialogOpen(false);
    setFlaggingDoctor(null);
    setFlagReason('');
    setFlagError(null);
  }, [flagSubmitting]);

  const submitFlag = useCallback(async () => {
    if (!flaggingDoctor) {
      return;
    }
    if (!token) {
      setError('Your session expired. Please sign in again.');
      logout();
      navigate('/admin/login', { replace: true });
      return;
    }

    const trimmed = flagReason.trim();
    if (!trimmed) {
      setFlagError('Please provide a reason for flagging this account.');
      return;
    }

    setFlagSubmitting(true);
    setFlagError(null);
    setFlagActionDoctorId(flaggingDoctor.id);

    try {
      const response = await fetch(`http://localhost:8080/admin/doctors/${flaggingDoctor.id}/flag`, {
        method: 'POST',
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: trimmed }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof payload?.message === 'string' && payload.message.trim().length > 0
            ? payload.message
            : 'Failed to flag doctor account.';
        throw new Error(message);
      }

      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor.id === flaggingDoctor.id
            ? {
                ...doctor,
                adminFlagged: true,
                adminFlagReason: trimmed,
                adminFlaggedAt:
                  (payload?.adminFlaggedAt as string | undefined) ?? new Date().toISOString(),
              }
            : doctor,
        ),
      );

      setInfoMessage(
        typeof payload?.message === 'string' && payload.message.trim().length > 0
          ? payload.message
          : 'Doctor account flagged for review.',
      );
      setFlagDialogOpen(false);
      setFlaggingDoctor(null);
      setFlagReason('');
    } catch (err) {
      console.error('Failed to flag doctor account', err);
      const message =
        err instanceof Error ? err.message : 'Failed to flag doctor account. Please try again.';
      setFlagError(message);
    } finally {
      setFlagSubmitting(false);
      setFlagActionDoctorId(null);
    }
  }, [flagReason, flaggingDoctor, getAuthHeader, logout, navigate, token]);

  const handleUnflagDoctor = useCallback(
    async (doctor: AdminDoctorSummary) => {
      if (!token) {
        setError('Your session expired. Please sign in again.');
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }

      setFlagSubmitting(true);
      setFlagActionDoctorId(doctor.id);
      setFlagError(null);

      try {
        const response = await fetch(`http://localhost:8080/admin/doctors/${doctor.id}/flag`, {
          method: 'DELETE',
          headers: {
            Authorization: getAuthHeader(),
          },
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message =
            typeof payload?.message === 'string' && payload.message.trim().length > 0
              ? payload.message
              : 'Failed to remove account flag.';
          throw new Error(message);
        }

        setDoctors((prev) =>
          prev.map((doc) =>
            doc.id === doctor.id
              ? {
                  ...doc,
                  adminFlagged: false,
                  adminFlagReason: null,
                  adminFlaggedAt: null,
                }
              : doc,
          ),
        );

        setInfoMessage(
          typeof payload?.message === 'string' && payload.message.trim().length > 0
            ? payload.message
            : 'Doctor account flag removed.',
        );
      } catch (err) {
        console.error('Failed to unflag doctor account', err);
        const message =
          err instanceof Error ? err.message : 'Failed to remove account flag. Please try again.';
        setError(message);
      } finally {
        setFlagSubmitting(false);
        setFlagActionDoctorId(null);
      }
    },
    [getAuthHeader, logout, navigate, token]
  );

  const showDoctorCount = hasSearched && !loading && doctors.length > 0;

  const formatStatusLabel = useCallback((status: DoctorStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending review';
      case 'ACTIVE':
        return 'Active';
      case 'ON_HOLD':
        return 'On hold';
      case 'BANNED':
        return 'Banned';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  }, []);

  const statusChipColor: Record<
    DoctorStatus,
    'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  > = {
    PENDING: 'info',
    ACTIVE: 'success',
    ON_HOLD: 'warning',
    BANNED: 'error',
    REJECTED: 'error',
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Doctor Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
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
          Filter doctors
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              label="Doctor or clinic name"
              fullWidth
              value={filters.name}
              onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              label="City"
              fullWidth
              value={filters.city}
              onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="admin-doctor-specialty-label">Specialty</InputLabel>
              <Select
                labelId="admin-doctor-specialty-label"
                label="Specialty"
                value={filters.specialty}
                onChange={(e) => setFilters((prev) => ({ ...prev, specialty: e.target.value }))}
                renderValue={(value) =>
                  value ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalHospitalIcon fontSize="small" color="primary" />
                      <span>{formatSpecialization(value as string)}</span>
                    </Box>
                  ) : (
                    'All specialties'
                  )
                }
              >
                <MenuItem value="">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalHospitalIcon fontSize="small" color="primary" />
                    <span>All specialties</span>
                  </Box>
                </MenuItem>
                {SPECIALTIES.map((specialty) => (
                  <MenuItem key={specialty} value={specialty}>
                    {formatSpecialization(specialty)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="admin-doctor-status-label">Account status</InputLabel>
              <Select
                labelId="admin-doctor-status-label"
                label="Account status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value as FilterState['status'] }))
                }
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.includeFlagged}
                  onChange={(e) => setFilters((prev) => ({ ...prev, includeFlagged: e.target.checked }))}
                  color="warning"
                />
              }
              label="Include flagged accounts"
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

      {showDoctorCount && (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Showing {doctors.length} doctor{doctors.length === 1 ? '' : 's'}.
        </Typography>
      )}

      {!loading && doctors.length > 0 && (
        <Grid container spacing={3}>
          {doctors.map((doctor) => (
            <Grid item xs={12} md={6} key={doctor.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
                  </Stack>

                  {doctor.specializations?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Specializations
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {doctor.specializations.map((spec) => (
                          <Chip key={spec} label={formatSpecialization(spec)} size="small" color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      {doctor.city || 'City not provided'}
                      {doctor.country ? ` · ${doctor.country}` : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MonetizationOnIcon fontSize="small" color="action" />
                      Consultation fee:{' '}
                      {doctor.consultationFee != null ? `$${doctor.consultationFee.toFixed(2)}` : 'Not provided'}
                    </Typography>
                    {doctor.email && (
                      <Typography variant="body2" color="text.secondary">
                        Email: {doctor.email}
                      </Typography>
                    )}
                    {doctor.phoneNumber && (
                      <Typography variant="body2" color="text.secondary">
                        Phone: {doctor.phoneNumber}
                      </Typography>
                    )}
                  </Stack>

                  {doctor.insuranceAccepted && doctor.insuranceAccepted.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Accepted insurance
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {doctor.insuranceAccepted.slice(0, 4).map((ins) => (
                          <Chip key={ins} label={ins} size="small" variant="outlined" />
                        ))}
                        {doctor.insuranceAccepted.length > 4 && (
                          <Chip
                            label={`+${doctor.insuranceAccepted.length - 4} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                  {doctor.adminFlagged && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'warning.light',
                        bgcolor: (theme) => theme.palette.warning.light,
                        color: (theme) => theme.palette.getContrastText(theme.palette.warning.light),
                      }}
                    >
                      <Typography variant="subtitle2">
                        Admin flag reason
                      </Typography>
                      <Typography variant="body2">
                        {doctor.adminFlagReason && doctor.adminFlagReason.trim().length > 0
                          ? doctor.adminFlagReason
                          : 'No details provided.'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    px: 2,
                    pb: 2,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip
                      label={formatStatusLabel(doctor.accountStatus)}
                      color={statusChipColor[doctor.accountStatus]}
                      variant={doctor.accountStatus === 'ACTIVE' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 600 }}
                    />
                    {doctor.adminFlagged && (
                      <Tooltip
                        title={
                          doctor.adminFlagReason && doctor.adminFlagReason.trim().length > 0
                            ? doctor.adminFlagReason
                            : 'Flagged for manual review'
                        }
                      >
                        <Chip
                          label="Flagged for review"
                          color="warning"
                          icon={<FlagIcon fontSize="small" />}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {doctor.adminFlagged ? (
                      <Button
                        variant="outlined"
                        color="inherit"
                        sx={{ textTransform: 'none' }}
                        startIcon={<OutlinedFlagIcon />}
                        disabled={(flagSubmitting && flagActionDoctorId === doctor.id) || statusUpdatingId === doctor.id}
                        onClick={() => handleUnflagDoctor(doctor)}
                      >
                        {flagSubmitting && flagActionDoctorId === doctor.id ? 'Updating…' : 'Remove flag'}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        color="warning"
                        sx={{ textTransform: 'none' }}
                        startIcon={<FlagIcon fontSize="small" />}
                        disabled={(flagSubmitting && flagActionDoctorId === doctor.id) || statusUpdatingId === doctor.id}
                        onClick={() => openFlagDialog(doctor)}
                      >
                        {flagSubmitting && flagActionDoctorId === doctor.id ? 'Updating…' : 'Flag account'}
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="warning"
                      sx={{ textTransform: 'none' }}
                      disabled={
                        statusUpdatingId === doctor.id ||
                        doctor.accountStatus !== 'ACTIVE' ||
                        (flagSubmitting && flagActionDoctorId === doctor.id)
                      }
                      onClick={() => handleHoldAccount(doctor)}
                    >
                      {statusUpdatingId === doctor.id && doctor.accountStatus === 'ACTIVE' ? 'Updating…' : 'Hold account'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="success"
                      sx={{ textTransform: 'none' }}
                      disabled={
                        statusUpdatingId === doctor.id ||
                        doctor.accountStatus !== 'ON_HOLD' ||
                        (flagSubmitting && flagActionDoctorId === doctor.id)
                      }
                      onClick={() => handleResumeAccount(doctor)}
                    >
                      {statusUpdatingId === doctor.id && doctor.accountStatus === 'ON_HOLD' ? 'Updating…' : 'Resume account'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      sx={{ textTransform: 'none' }}
                      disabled={
                        statusUpdatingId === doctor.id ||
                        doctor.accountStatus === 'BANNED' ||
                        (flagSubmitting && flagActionDoctorId === doctor.id)
                      }
                      onClick={() => handleBanAccount(doctor)}
                    >
                      {statusUpdatingId === doctor.id && doctor.accountStatus === 'BANNED' ? 'Updating…' : 'Ban account'}
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ textTransform: 'none' }}
                      onClick={() => navigate(`/doctor-public-profile/${doctor.id}`)}
                    >
                      View public profile
                    </Button>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog
        open={flagDialogOpen}
        onClose={closeFlagDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Flag doctor account</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a short note explaining why you are flagging this account. Flags do not block access but
            help the moderation team track profiles that need attention.
          </Typography>
          {flagError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {flagError}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Flag reason"
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Explain why this profile needs review…"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFlagDialog} disabled={flagSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={submitFlag}
            variant="contained"
            color="warning"
            disabled={flagSubmitting}
          >
            {flagSubmitting ? 'Saving…' : 'Flag account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDoctors;

