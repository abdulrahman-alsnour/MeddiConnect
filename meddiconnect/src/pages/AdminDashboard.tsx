import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Security as SecurityIcon,
  NotificationsNone as NotificationsIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface AdminProfile {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AdminNotification {
  id: number;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: string;
  relatedEntityId?: number | null;
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const token = useMemo(() => user?.token?.trim() ?? '', [user?.token]);
  const getAuthHeader = useCallback(
    () => (token.startsWith('Bearer ') ? token : `Bearer ${token}`),
    [token],
  );

  const adminFunctionCards = [
    {
      id: 'post-moderation',
      title: 'Post Moderation',
      description: 'Review and manage medical posts shared across MeddieConnect.',
      actionLabel: 'View Posts',
      actionTo: '/admin/posts',
      disabled: false,
    },
    {
      id: 'doctor-management',
      title: 'Doctor Management',
      description: 'Explore doctor profiles and manage account status and flags.',
      actionLabel: 'Manage Doctors',
      actionTo: '/admin/doctors',
      disabled: false,
    },
    {
      id: 'patient-management',
      title: 'Patient Management',
      description: 'Manage patient accounts, review reports, and moderate access.',
      actionLabel: 'Manage Patients',
      actionTo: '/admin/patients',
      disabled: false,
    },
    {
      id: 'doctor-approvals',
      title: 'Doctor Approvals',
      description: 'Approve or reject newly registered doctors before they access the platform.',
      actionLabel: 'Review Pending Doctors',
      actionTo: '/admin/doctor-approvals',
      disabled: false,
    },
  ];

  useEffect(() => {
    if (!user?.token || user.type !== 'admin') {
      navigate('/admin/login', { replace: true });
      return;
    }

    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:8080/admin/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user.token.trim()}`,
          },
          signal: controller.signal,
        });

        if (response.ok) {
          const data: AdminProfile = await response.json();
          setProfile(data);
          setLoading(false);
          return;
        }

        if (response.status === 401 || response.status === 403) {
          setError('Your session expired. Please sign in again.');
          logout();
          navigate('/admin/login', { replace: true });
          return;
        }

        const message = await response.text();
        setError(message || 'Unable to load admin profile.');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to fetch admin profile:', err);
          setError('Unable to load admin profile. Check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => controller.abort();
  }, [user, logout, navigate]);

  /** Fetch the unread notification count for the badge on the icon. */
  const fetchUnreadNotifications = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/notifications/unread-count', {
        headers: { Authorization: getAuthHeader() },
      });
      if (response.status === 401 || response.status === 403) {
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      const count = Number(payload?.count ?? 0);
      setUnreadCount(Number.isNaN(count) ? 0 : count);
    } catch (err) {
      console.error('Failed to fetch unread notifications', err);
    }
  }, [getAuthHeader, logout, navigate, token]);

  /** Fetch the full list of notifications displayed in the menu. */
  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const response = await fetch('http://localhost:8080/notifications', {
        headers: { Authorization: getAuthHeader() },
      });
      if (response.status === 401 || response.status === 403) {
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!response.ok) {
        setNotificationsError('Unable to load notifications.');
        return;
      }
      const payload = await response.json();
      const rawList = Array.isArray(payload?.data) ? payload.data : [];
      const mapped: AdminNotification[] = rawList.map((item: any) => ({
        id: Number(item?.id),
        message: item?.message ?? 'Notification',
        createdAt: item?.createdAt ?? new Date().toISOString(),
        isRead: Boolean(item?.isRead),
        type: item?.type ?? 'GENERAL',
        relatedEntityId:
          item?.relatedEntityId !== undefined && item?.relatedEntityId !== null
            ? Number(item.relatedEntityId)
            : null,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to load notifications', err);
      setNotificationsError('Unable to load notifications.');
    } finally {
      setNotificationsLoading(false);
    }
  }, [getAuthHeader, logout, navigate, token]);

  useEffect(() => {
    fetchUnreadNotifications();
  }, [fetchUnreadNotifications]);

  const openNotifications = useCallback(
    async (event: React.MouseEvent<HTMLElement>) => {
      setNotificationsAnchorEl(event.currentTarget);
      await fetchNotifications();
      await fetchUnreadNotifications();
    },
    [fetchNotifications, fetchUnreadNotifications],
  );

  const closeNotifications = useCallback(() => {
    setNotificationsAnchorEl(null);
  }, []);

  /** Mark a notification as read and navigate to the relevant admin screen. */
  const handleNotificationClick = useCallback(
    async (notification: AdminNotification) => {
      try {
        if (!notification.isRead) {
          await fetch(`http://localhost:8080/notifications/${notification.id}/read`, {
            method: 'PUT',
            headers: { Authorization: getAuthHeader() },
          });
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === notification.id ? { ...item, isRead: true } : item,
            ),
          );
          fetchUnreadNotifications();
        }
      } catch (err) {
        console.error('Failed to mark notification as read', err);
      } finally {
        closeNotifications();
      }

      let destination: string | null = null;
      let navigationState: Record<string, unknown> | undefined;

      if (notification.type === 'ADMIN_POST_REPORTED' && notification.relatedEntityId) {
        destination = '/admin/posts';
        navigationState = { focusPostId: notification.relatedEntityId };
      } else if (
        notification.type === 'ADMIN_DOCTOR_REGISTRATION' &&
        notification.relatedEntityId
      ) {
        destination = '/admin/doctor-approvals';
        navigationState = { focusDoctorId: notification.relatedEntityId };
      }

      if (destination) {
        navigate(destination, { state: navigationState });
      }
    },
    [closeNotifications, fetchUnreadNotifications, getAuthHeader, navigate],
  );

  /** Mark every notification as read using the bulk action in the menu header. */
  const handleMarkAllRead = useCallback(async () => {
    try {
      await fetch('http://localhost:8080/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: getAuthHeader() },
      });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  }, [getAuthHeader]);

  const formatTimestamp = useCallback((isoString: string) => {
    try {
      return new Date(isoString).toLocaleString();
    } catch (error) {
      return isoString;
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Notifications">
            <IconButton color="primary" onClick={openNotifications}>
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={closeNotifications}
        PaperProps={{ sx: { width: 360, maxWidth: '100%' } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          <Tooltip title="Mark all as read">
            <span>
              <IconButton
                size="small"
                onClick={handleMarkAllRead}
                disabled={
                  notifications.length === 0 || notifications.every((item) => item.isRead)
                }
              >
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Divider />
        {notificationsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notificationsError ? (
          <Typography variant="body2" color="error" sx={{ px: 2, py: 2 }}>
            {notificationsError}
          </Typography>
        ) : notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
            You are all caught up.
          </Typography>
        ) : (
          <List dense disablePadding>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItemButton
                  onClick={() => handleNotificationClick(notification)}
                  selected={!notification.isRead}
                  sx={{ alignItems: 'flex-start', px: 2, py: 1.5 }}
                >
                  <ListItemText
                    primary={notification.message}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { fontWeight: notification.isRead ? 400 : 600 },
                    }}
                    secondary={formatTimestamp(notification.createdAt)}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItemButton>
                {index < notifications.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">Administrator Profile</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Secure access to MeddieConnect management tools.
                  </Typography>
                </Box>
              </Box>

              {profile ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      First Name
                    </Typography>
                    <Typography variant="body1">{profile.firstName || '—'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Name
                    </Typography>
                    <Typography variant="body1">{profile.lastName || '—'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Username
                    </Typography>
                    <Typography variant="body1">{profile.username}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{profile.email}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Role
                    </Typography>
                    <Typography variant="body1">{profile.role}</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body1">
                  Administrator information unavailable.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Grid container spacing={3}>
            {adminFunctionCards.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.id}>
                <Card
                  sx={{
                    height: '100%',
                    borderTop: '4px solid',
                    borderColor: 'secondary.main',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      disabled={card.disabled}
                      sx={{ textTransform: 'none' }}
                      onClick={() => {
                        if (!card.disabled && card.actionTo) {
                          navigate(card.actionTo);
                        }
                      }}
                    >
                      {card.actionLabel}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;

