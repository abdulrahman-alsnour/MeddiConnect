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
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import FlagIcon from '@mui/icons-material/Flag';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type AccountStatus = 'ACTIVE' | 'ON_HOLD' | 'BANNED';

type AdminPatientSummary = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phoneNumber?: string | null;
  city?: string | null;
  country?: string | null;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
  registrationDate?: string | null;
  accountStatus: AccountStatus;
  adminFlagged?: boolean;
  adminFlagReason?: string | null;
  adminFlaggedAt?: string | null;
};

type FilterState = {
  name: string;
  city: string;
  status: '' | AccountStatus;
  includeFlagged: boolean;
};

const initialFilters: FilterState = {
  name: '',
  city: '',
  status: '',
  includeFlagged: false,
};

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: FilterState['status'] }> = [
  { label: 'All statuses', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On hold', value: 'ON_HOLD' },
  { label: 'Banned', value: 'BANNED' },
];

const statusChipColor: Record<AccountStatus, 'default' | 'success' | 'warning' | 'error'> = {
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  BANNED: 'error',
};

const AdminPatients: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [patients, setPatients] = useState<AdminPatientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flaggingPatient, setFlaggingPatient] = useState<AdminPatientSummary | null>(null);
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagActionPatientId, setFlagActionPatientId] = useState<number | null>(null);
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

  const resetState = useCallback(() => {
    setPatients([]);
    setError(null);
    setInfoMessage(null);
    setHasSearched(false);
    setStatusUpdatingId(null);
    setFlagDialogOpen(false);
    setFlaggingPatient(null);
    setFlagReason('');
    setFlagError(null);
    setFlagActionPatientId(null);
    setFlagSubmitting(false);
  }, []);

  const fetchPatients = useCallback(
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
        if (filterParams.status) {
          params.append('status', filterParams.status);
        }
        if (filterParams.includeFlagged) {
          params.append('includeFlagged', 'true');
        }

        const query = params.toString();
        const response = await fetch(`http://localhost:8080/admin/patients${query ? `?${query}` : ''}`, {
          headers: {
            Authorization: getAuthHeader(),
          },
        });

        if (response.ok) {
          const payload = await response.json();
          const data: AdminPatientSummary[] = Array.isArray(payload?.patients)
            ? payload.patients.map((patient: any) => ({
                ...patient,
                accountStatus: (patient.accountStatus as AccountStatus | undefined) ?? 'ACTIVE',
                adminFlagged: Boolean(patient.adminFlagged),
                adminFlagReason: patient.adminFlagReason ?? null,
                adminFlaggedAt: patient.adminFlaggedAt ?? null,
              }))
            : [];
          setPatients(data);
          setHasSearched(true);
          if (data.length === 0) {
            setInfoMessage('No patients match the selected filters.');
          }
        } else if (response.status === 401 || response.status === 403) {
          setError('Your session expired. Please sign in again.');
          logout();
          navigate('/admin/login', { replace: true });
        } else {
          const message = await response.text();
          setError(message || 'Unable to load patients. Try again later.');
        }
      } catch (err) {
        console.error('Failed to load patients for admin', err);
        setError('Unable to load patients. Check your connection and try again.');
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
    await fetchPatients(snapshot);
  }, [fetchPatients, filters, navigate, user?.token]);

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
    await fetchPatients(appliedFilters);
  }, [appliedFilters, fetchPatients, hasSearched]);

  const updatePatientStatus = useCallback(
    async (patientId: number, nextStatus: AccountStatus) => {
      if (!token) {
        setError('Your session expired. Please sign in again.');
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }

      setStatusUpdatingId(patientId);
      setError(null);
      setInfoMessage(null);

      try {
        const response = await fetch(`http://localhost:8080/admin/patients/${patientId}/status`, {
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
              : 'Failed to update patient status.';
          throw new Error(message);
        }

        setPatients((prev) =>
          prev.map((patient) =>
            patient.id === patientId
              ? {
                  ...patient,
                  accountStatus: (payload?.accountStatus as AccountStatus) ?? nextStatus,
                }
              : patient,
          ),
        );

        const feedbackMessage =
          typeof payload?.message === 'string' && payload.message.trim().length > 0
            ? payload.message
            : `Patient status updated to ${nextStatus.replace('_', ' ').toLowerCase()}.`;
        setInfoMessage(feedbackMessage);
      } catch (err) {
        console.error(`Failed to update patient ${patientId} status`, err);
        setError(err instanceof Error ? err.message : 'Failed to update patient status.');
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [getAuthHeader, logout, navigate, token]
  );

  const handleHoldAccount = useCallback(
    (patient: AdminPatientSummary) => {
      updatePatientStatus(patient.id, 'ON_HOLD');
    },
    [updatePatientStatus]
  );

  const handleResumeAccount = useCallback(
    (patient: AdminPatientSummary) => {
      updatePatientStatus(patient.id, 'ACTIVE');
    },
    [updatePatientStatus]
  );

  const handleBanAccount = useCallback(
    (patient: AdminPatientSummary) => {
      const confirmed = window.confirm(
        `Ban ${patient.firstName} ${patient.lastName}? This action will prevent the patient from logging in.`,
      );
      if (!confirmed) {
        return;
      }
      updatePatientStatus(patient.id, 'BANNED');
    },
    [updatePatientStatus]
  );

  const openFlagDialog = useCallback((patient: AdminPatientSummary) => {
    setFlagDialogOpen(true);
    setFlaggingPatient(patient);
    setFlagReason(patient.adminFlagReason ?? '');
    setFlagError(null);
  }, []);

  const closeFlagDialog = useCallback(() => {
    if (flagSubmitting) {
      return;
    }
    setFlagDialogOpen(false);
    setFlaggingPatient(null);
    setFlagReason('');
    setFlagError(null);
  }, [flagSubmitting]);

  const submitFlag = useCallback(async () => {
    if (!flaggingPatient) {
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
    setFlagActionPatientId(flaggingPatient.id);

    try {
      const response = await fetch(`http://localhost:8080/admin/patients/${flaggingPatient.id}/flag`, {
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
            : 'Failed to flag patient account.';
        throw new Error(message);
      }

      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === flaggingPatient.id
            ? {
                ...patient,
                adminFlagged: true,
                adminFlagReason: trimmed,
                adminFlaggedAt:
                  (payload?.adminFlaggedAt as string | undefined) ?? new Date().toISOString(),
              }
            : patient,
        ),
      );

      setInfoMessage(
        typeof payload?.message === 'string' && payload.message.trim().length > 0
          ? payload.message
          : 'Patient account flagged for review.',
      );
      setFlagDialogOpen(false);
      setFlaggingPatient(null);
      setFlagReason('');
    } catch (err) {
      console.error('Failed to flag patient account', err);
      const message =
        err instanceof Error ? err.message : 'Failed to flag patient account. Please try again.';
      setFlagError(message);
    } finally {
      setFlagSubmitting(false);
      setFlagActionPatientId(null);
    }
  }, [flagReason, flaggingPatient, getAuthHeader, logout, navigate, token]);

  const handleUnflagPatient = useCallback(
    async (patient: AdminPatientSummary) => {
      if (!token) {
        setError('Your session expired. Please sign in again.');
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }

      setFlagSubmitting(true);
      setFlagActionPatientId(patient.id);
      setFlagError(null);

      try {
        const response = await fetch(`http://localhost:8080/admin/patients/${patient.id}/flag`, {
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

        setPatients((prev) =>
          prev.map((existing) =>
            existing.id === patient.id
              ? {
                  ...existing,
                  adminFlagged: false,
                  adminFlagReason: null,
                  adminFlaggedAt: null,
                }
              : existing,
          ),
        );

        setInfoMessage(
          typeof payload?.message === 'string' && payload.message.trim().length > 0
            ? payload.message
            : 'Patient account flag removed.',
        );
      } catch (err) {
        console.error('Failed to unflag patient account', err);
        const message =
          err instanceof Error ? err.message : 'Failed to remove account flag. Please try again.';
        setError(message);
      } finally {
        setFlagSubmitting(false);
        setFlagActionPatientId(null);
      }
    },
    [getAuthHeader, logout, navigate, token]
  );

  const showPatientCount = hasSearched && !loading && patients.length > 0;

  const formatDate = useCallback((value?: string | null) => {
    if (!value) {
      return '—';
    }
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(value));
    } catch (err) {
      return value;
    }
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Patient Management
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
          Filter patients
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              label="Patient name"
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
              <InputLabel id="admin-patient-status-label">Account status</InputLabel>
              <Select
                labelId="admin-patient-status-label"
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

      {showPatientCount && (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Showing {patients.length} patient{patients.length === 1 ? '' : 's'}.
        </Typography>
      )}

      {!loading && patients.length > 0 && (
        <Grid container spacing={3}>
          {patients.map((patient) => (
            <Grid item xs={12} md={6} key={patient.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar
                      sx={{ width: 64, height: 64, bgcolor: 'primary.main', color: 'primary.contrastText' }}
                    >
                      <PeopleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {patient.firstName} {patient.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Joined {formatDate(patient.registrationDate)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={1.5}>
                    {patient.email && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{patient.email}</Typography>
                      </Stack>
                    )}
                    {patient.phoneNumber && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{patient.phoneNumber}</Typography>
                      </Stack>
                    )}
                    {(patient.city || patient.country) && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {patient.city || 'City not provided'}
                          {patient.country ? ` · ${patient.country}` : ''}
                        </Typography>
                      </Stack>
                    )}
                    {patient.insuranceProvider && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AssignmentIndIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Insurance: {patient.insuranceProvider}
                          {patient.insuranceNumber ? ` – ${patient.insuranceNumber}` : ''}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  {patient.adminFlagged && (
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
                      <Typography variant="subtitle2">Admin flag reason</Typography>
                      <Typography variant="body2">
                        {patient.adminFlagReason && patient.adminFlagReason.trim().length > 0
                          ? patient.adminFlagReason
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
                      label={patient.accountStatus === 'ON_HOLD' ? 'On hold' : patient.accountStatus === 'BANNED' ? 'Banned' : 'Active'}
                      color={statusChipColor[patient.accountStatus]}
                      variant={patient.accountStatus === 'ACTIVE' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 600 }}
                    />
                    {patient.adminFlagged && (
                      <Tooltip
                        title={
                          patient.adminFlagReason && patient.adminFlagReason.trim().length > 0
                            ? patient.adminFlagReason
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
                    {patient.adminFlagged ? (
                      <Button
                        variant="outlined"
                        color="inherit"
                        sx={{ textTransform: 'none' }}
                        startIcon={<OutlinedFlagIcon />}
                        disabled={(flagSubmitting && flagActionPatientId === patient.id) || statusUpdatingId === patient.id}
                        onClick={() => handleUnflagPatient(patient)}
                      >
                        {flagSubmitting && flagActionPatientId === patient.id ? 'Updating…' : 'Remove flag'}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        color="warning"
                        sx={{ textTransform: 'none' }}
                        startIcon={<FlagIcon fontSize="small" />}
                        disabled={(flagSubmitting && flagActionPatientId === patient.id) || statusUpdatingId === patient.id}
                        onClick={() => openFlagDialog(patient)}
                      >
                        {flagSubmitting && flagActionPatientId === patient.id ? 'Updating…' : 'Flag account'}
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="warning"
                      sx={{ textTransform: 'none' }}
                      disabled={
                        statusUpdatingId === patient.id ||
                        patient.accountStatus !== 'ACTIVE' ||
                        (flagSubmitting && flagActionPatientId === patient.id)
                      }
                      onClick={() => handleHoldAccount(patient)}
                    >
                      {statusUpdatingId === patient.id && patient.accountStatus === 'ACTIVE' ? 'Updating…' : 'Hold account'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="success"
                      sx={{ textTransform: 'none' }}
                      disabled={
                        statusUpdatingId === patient.id ||
                        patient.accountStatus !== 'ON_HOLD' ||
                        (flagSubmitting && flagActionPatientId === patient.id)
                      }
                      onClick={() => handleResumeAccount(patient)}
                    >
                      {statusUpdatingId === patient.id && patient.accountStatus === 'ON_HOLD' ? 'Updating…' : 'Resume account'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      sx={{ textTransform: 'none' }}
                      disabled={
                        statusUpdatingId === patient.id ||
                        patient.accountStatus === 'BANNED' ||
                        (flagSubmitting && flagActionPatientId === patient.id)
                      }
                      onClick={() => handleBanAccount(patient)}
                    >
                      {statusUpdatingId === patient.id && patient.accountStatus === 'BANNED' ? 'Updating…' : 'Ban account'}
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
        <DialogTitle>Flag patient account</DialogTitle>
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

export default AdminPatients;

