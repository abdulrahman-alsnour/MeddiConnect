import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type AdminPostSummary = {
  id: number;
  content?: string;
  mediaUrl?: string | null;
  mediaUrls?: string | null;
  doctorName?: string;
  doctorId?: number;
  doctorSpecialty?: string;
  createdAt?: string;
  likes?: number;
  comments?: number;
  adminFlagged?: boolean;
  adminFlagReason?: string | null;
  adminFlaggedAt?: string | null;
  reportCount?: number;
};

type AdminComment = {
  id: number;
  commenterName: string;
  commenterSpecialty: string;
  content: string;
  createdAt: string;
  likes: number;
};

type AdminLiker = {
  userId: number;
  name: string;
  specialty: string;
  userType: string;
  likedAt: string;
};

type AdminPostReport = {
  id: number;
  reason: string;
  reporterType: string;
  reporterId: number;
  reporterName?: string;
  reporterSpecialty?: string;
  otherReason?: string | null;
  details?: string | null;
  createdAt: string;
  reviewed: boolean;
};

type FilterState = {
  doctorName: string;
  reportedOnly: boolean;
  flaggedOnly: boolean;
  startDate: string;
  endDate: string;
};

const initialFilters: FilterState = {
  doctorName: '',
  reportedOnly: false,
  flaggedOnly: false,
  startDate: '',
  endDate: '',
};

const AdminPosts: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<AdminPostSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [expandedLikers, setExpandedLikers] = useState<Set<number>>(new Set());
  const [commentState, setCommentState] = useState<
    Record<number, { loading: boolean; error: string | null; data: AdminComment[] }>
  >({});
  const [likerState, setLikerState] = useState<
    Record<number, { loading: boolean; error: string | null; data: AdminLiker[] }>
  >({});
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flaggingPost, setFlaggingPost] = useState<AdminPostSummary | null>(null);
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [activeReportPostId, setActiveReportPostId] = useState<number | null>(null);
  const [reportState, setReportState] = useState<
    Record<number, { loading: boolean; error: string | null; data: AdminPostReport[] }>
  >({});
  const [pendingFocusPostId, setPendingFocusPostId] = useState<number | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<number | null>(null);

  const token = useMemo(() => user?.token?.trim() ?? '', [user?.token]);
  const getAuthHeader = useCallback(
    () => (token.startsWith('Bearer ') ? token : `Bearer ${token}`),
    [token],
  );

  const fetchPosts = useCallback(
    async (filterParams: FilterState) => {
      if (!token) {
        setError('Your session expired. Please sign in again.');
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      const authHeader = getAuthHeader();

      setLoading(true);
      setError(null);
      setActionMessage(null);
      setCommentState({});
      setLikerState({});
      setReportState({});
      setExpandedComments(new Set());
      setExpandedLikers(new Set());
      setDeletingPostId(null);
      setDeletingCommentId(null);

      try {
        const params = new URLSearchParams();
        const trimmedDoctor = filterParams.doctorName.trim();
        if (trimmedDoctor) {
          params.append('doctorName', trimmedDoctor);
        }
        if (filterParams.reportedOnly) {
          params.append('reportedOnly', 'true');
        }
        if (filterParams.flaggedOnly) {
          params.append('flaggedOnly', 'true');
        }
        if (filterParams.startDate) {
          const start = new Date(`${filterParams.startDate}T00:00:00`);
          if (!Number.isNaN(start.getTime())) {
            params.append('startDate', start.toISOString());
          }
        }
        if (filterParams.endDate) {
          const end = new Date(`${filterParams.endDate}T23:59:59`);
          if (!Number.isNaN(end.getTime())) {
            params.append('endDate', end.toISOString());
          }
        }

        const query = params.toString();
        const response = await fetch(`http://localhost:8080/admin/posts/all${query ? `?${query}` : ''}`, {
          headers: {
            Authorization: authHeader,
          },
        });

        if (response.ok) {
          const payload = await response.json();
          // Handle paginated response format: { posts: [...], pagination: {...} }
          // The backend now returns posts in payload.posts (which is the data array)
          const data: AdminPostSummary[] = Array.isArray(payload?.posts) ? payload.posts : [];
          setPosts(data);
          setHasSearched(true);
        } else if (response.status === 401 || response.status === 403) {
          setError('Your session expired. Please sign in again.');
          logout();
          navigate('/admin/login', { replace: true });
        } else {
          const text = await response.text();
          setError(text || 'Unable to load posts for review.');
        }
      } catch (err) {
        console.error('Failed to fetch posts for admin:', err);
        setError('Unable to load posts. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [token, logout, navigate, getAuthHeader]
  );

  const handleSearch = useCallback(async () => {
    if (!user?.token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    if (filters.startDate && filters.endDate) {
      const start = new Date(`${filters.startDate}T00:00:00`);
      const end = new Date(`${filters.endDate}T23:59:59`);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
        setActionMessage({ text: 'End date must be after start date.', severity: 'error' });
        return;
      }
    }

    const snapshot = { ...filters };
    setAppliedFilters(snapshot);
    await fetchPosts(snapshot);
  }, [filters, fetchPosts, navigate, user?.token]);

  const handleReset = useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPosts([]);
    setHasSearched(false);
    setError(null);
    setActionMessage(null);
    setCommentState({});
    setLikerState({});
    setReportState({});
    setExpandedComments(new Set());
    setExpandedLikers(new Set());
    setDeletingPostId(null);
    setDeletingCommentId(null);
    setReportDialogOpen(false);
    setActiveReportPostId(null);
    setPendingFocusPostId(null);
    setHighlightedPostId(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!hasSearched) {
      setActionMessage({ text: 'Apply filters to load posts before refreshing.', severity: 'info' });
      return;
    }
    await fetchPosts(appliedFilters);
  }, [appliedFilters, fetchPosts, hasSearched]);

  const handleViewReports = useCallback(
    async (postId: number) => {
      if (!token) {
        setError('Your session expired. Please sign in again.');
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }

      setActiveReportPostId(postId);
      setReportDialogOpen(true);
      setReportState((prev) => ({
        ...prev,
        [postId]: { loading: true, error: null, data: [] },
      }));

      try {
        const authHeader = getAuthHeader();
        const response = await fetch(`http://localhost:8080/admin/posts/${postId}/reports`, {
          headers: {
            Authorization: authHeader,
          },
        });

        if (response.ok) {
          const payload = await response.json();
          const reports: AdminPostReport[] = Array.isArray(payload?.reports) ? payload.reports : [];
          setReportState((prev) => ({
            ...prev,
            [postId]: { loading: false, error: null, data: reports },
          }));
        } else if (response.status === 401 || response.status === 403) {
          setReportDialogOpen(false);
          setActiveReportPostId(null);
          setError('Your session expired. Please sign in again.');
          logout();
          navigate('/admin/login', { replace: true });
        } else {
          const text = await response.text();
          setReportState((prev) => ({
            ...prev,
            [postId]: { loading: false, error: text || 'Failed to load reports.', data: [] },
          }));
        }
      } catch (err) {
        console.error('Failed to fetch reports for post', postId, err);
        setReportState((prev) => ({
          ...prev,
          [postId]: { loading: false, error: 'Failed to load reports. Try again later.', data: [] },
        }));
      }
    },
    [logout, navigate, token, getAuthHeader]
  );

// Redirects admins to login when their session expires or role mismatches.
useEffect(() => {
    if (!user?.token || user.type !== 'admin') {
      navigate('/admin/login', { replace: true });
    }
  }, [user, navigate]);

// When we arrive from a notification, focus the reported post automatically.
useEffect(() => {
  const state = location.state as { focusPostId?: number | null } | null;
  if (state?.focusPostId) {
    const targetFilters: FilterState = { ...initialFilters, reportedOnly: true };
    setFilters(targetFilters);
    setAppliedFilters(targetFilters);
    setPendingFocusPostId(state.focusPostId);
    setHighlightedPostId(null);
    fetchPosts(targetFilters);
    navigate(location.pathname, { replace: true, state: undefined });
  }
}, [fetchPosts, location.pathname, location.state, navigate]);

// Once the posts are fetched, highlight the target post (or show a friendly message).
useEffect(() => {
  if (!pendingFocusPostId) {
    return;
  }
  const exists = posts.some((post) => post.id === pendingFocusPostId);
  if (exists) {
    setHighlightedPostId(pendingFocusPostId);
    setPendingFocusPostId(null);
  } else if (hasSearched && !loading) {
    setActionMessage({
      text: 'The reported post could not be found. It may have been removed.',
      severity: 'info',
    });
    setPendingFocusPostId(null);
    setHighlightedPostId(null);
  }
}, [hasSearched, loading, pendingFocusPostId, posts]);

// Smoothly scroll the highlighted post into view.
useEffect(() => {
  if (!highlightedPostId) {
    return;
  }
  const element = document.getElementById(`admin-post-${highlightedPostId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [highlightedPostId, posts]);

  const parseMediaCount = (mediaUrls?: string | null, fallback?: string | null) => {
    if (!mediaUrls) {
      return fallback ? 1 : 0;
    }

    try {
      const parsed = JSON.parse(mediaUrls);
      if (Array.isArray(parsed)) {
        return parsed.length;
      }
    } catch (err) {
      console.warn('Failed to parse mediaUrls for admin post', err);
    }

    return fallback ? 1 : 0;
  };

  const parseMediaUrls = (mediaUrls?: string | null, fallback?: string | null) => {
    if (mediaUrls) {
      try {
        const parsed = JSON.parse(mediaUrls);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse mediaUrls for admin post', err);
      }
    }

    if (fallback) {
      return [fallback];
    }

    return [];
  };

  const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const toggleComments = async (postId: number) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    if (!commentState[postId]) {
      setCommentState((prev) => ({
        ...prev,
        [postId]: { loading: true, error: null, data: [] },
      }));

      try {
        const response = await fetch(`http://localhost:8080/posts/comments/${postId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = (await response.json()) as AdminComment[];
          setCommentState((prev) => ({
            ...prev,
            [postId]: { loading: false, error: null, data },
          }));
        } else {
          const message = await response.text();
          setCommentState((prev) => ({
            ...prev,
            [postId]: { loading: false, error: message || 'Failed to load comments.', data: [] },
          }));
        }
      } catch (err) {
        console.error('Failed to load comments for post', postId, err);
        setCommentState((prev) => ({
          ...prev,
          [postId]: { loading: false, error: 'Failed to load comments. Try again later.', data: [] },
        }));
      }
    }
  };

  const toggleLikers = async (postId: number) => {
    setExpandedLikers((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    if (!likerState[postId]) {
      setLikerState((prev) => ({
        ...prev,
        [postId]: { loading: true, error: null, data: [] },
      }));

      try {
        const response = await fetch(`http://localhost:8080/posts/${postId}/likers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = (await response.json()) as AdminLiker[];
          setLikerState((prev) => ({
            ...prev,
            [postId]: { loading: false, error: null, data },
          }));
        } else {
          const message = await response.text();
          setLikerState((prev) => ({
            ...prev,
            [postId]: { loading: false, error: message || 'Failed to load likes.', data: [] },
          }));
        }
      } catch (err) {
        console.error('Failed to load likers for post', postId, err);
        setLikerState((prev) => ({
          ...prev,
          [postId]: { loading: false, error: 'Failed to load likes. Try again later.', data: [] },
        }));
      }
    }
  };

  const openFlagDialog = (post: AdminPostSummary) => {
    setFlaggingPost(post);
    setFlagReason('');
    setFlagDialogOpen(true);
  };

  const closeFlagDialog = () => {
    if (!flagSubmitting) {
      setFlagDialogOpen(false);
      setFlaggingPost(null);
      setFlagReason('');
    }
  };

  const submitFlag = async () => {
    if (!flaggingPost) return;
    setFlagSubmitting(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`http://localhost:8080/admin/posts/${flaggingPost.id}/flag`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: flagReason.trim() }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to flag post');
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === flaggingPost.id
            ? {
                ...post,
                adminFlagged: true,
                adminFlagReason: flagReason.trim() || null,
                adminFlaggedAt: new Date().toISOString(),
              }
            : post,
        ),
      );
      setActionMessage({ text: 'Post flagged for review.', severity: 'success' });
      closeFlagDialog();
    } catch (err) {
      console.error('Failed to flag post', err);
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to flag post. Try again later.',
        severity: 'error',
      });
    } finally {
      setFlagSubmitting(false);
    }
  };

  const handleUnflag = async (post: AdminPostSummary) => {
    const confirmed = window.confirm('Remove admin flag from this post?');
    if (!confirmed) {
      return;
    }

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`http://localhost:8080/admin/posts/${post.id}/flag`, {
        method: 'DELETE',
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to unflag post');
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                adminFlagged: false,
                adminFlagReason: null,
                adminFlaggedAt: null,
              }
            : p,
        ),
      );
      setActionMessage({ text: 'Post unflagged.', severity: 'success' });
    } catch (err) {
      console.error('Failed to unflag post', err);
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to unflag post. Try again later.',
        severity: 'error',
      });
    }
  };

  const handleDelete = async (post: AdminPostSummary) => {
    const confirmed = window.confirm('Delete this post permanently? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeletingPostId(post.id);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`http://localhost:8080/admin/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to delete post');
      }

      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      setExpandedComments((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
      setExpandedLikers((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
      setActionMessage({ text: 'Post deleted permanently.', severity: 'success' });
    } catch (err) {
      console.error('Failed to delete post', err);
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to delete post. Try again later.',
        severity: 'error',
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    const confirmed = window.confirm('Delete this comment? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`http://localhost:8080/admin/posts/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to delete comment');
      }

      setCommentState((prev) => {
        const current = prev[postId];
        if (!current) {
          return prev;
        }
        const updatedData = current.data.filter((comment) => comment.id !== commentId);
        return {
          ...prev,
          [postId]: {
            ...current,
            data: updatedData,
          },
        };
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: Math.max(0, (p.comments ?? 0) - 1),
              }
            : p,
        ),
      );
      setActionMessage({ text: 'Comment deleted successfully.', severity: 'success' });
    } catch (err) {
      console.error('Failed to delete comment', err);
      setActionMessage({
        text: err instanceof Error ? err.message : 'Failed to delete comment. Try again later.',
        severity: 'error',
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Filter posts
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              label="Doctor name"
              fullWidth
              value={filters.doctorName}
              onChange={(e) => setFilters((prev) => ({ ...prev, doctorName: e.target.value }))}
              placeholder="e.g. Dr. Smith"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              label="Start date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              label="End date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.reportedOnly}
                  onChange={(e) => setFilters((prev) => ({ ...prev, reportedOnly: e.target.checked }))}
                  color="warning"
                />
              }
              label="Show reported posts only"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.flaggedOnly}
                  onChange={(e) => setFilters((prev) => ({ ...prev, flaggedOnly: e.target.checked }))}
                  color="error"
                />
              }
              label="Show admin-flagged posts only"
            />
          </Box>
        </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Post Moderation
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <IconButton color="primary" onClick={handleRefresh} aria-label="Refresh posts">
            <RefreshIcon />
          </IconButton>
          <Button variant="outlined" onClick={() => navigate('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </Box>
      </Box>

      {actionMessage && (
        <Alert severity={actionMessage.severity} sx={{ mb: 3 }} onClose={() => setActionMessage(null)}>
          {actionMessage.text}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!hasSearched ? (
        <Alert severity="info" sx={{ mb: 3 }}>Use the filters above to load posts.</Alert>
      ) : posts.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>No posts match the selected filters.</Alert>
      ) : (
        <Grid container spacing={3}>
          {posts.map((post) => {
            const isHighlighted = post.id === highlightedPostId;
            const borderColor = isHighlighted
              ? 'secondary.main'
              : post.adminFlagged
              ? 'warning.main'
              : 'primary.main';
            const mediaCount = parseMediaCount(post.mediaUrls, post.mediaUrl);
            const mediaUrls = parseMediaUrls(post.mediaUrls, post.mediaUrl);
            const commentsData = commentState[post.id];
            const likersData = likerState[post.id];
            const commentsOpen = expandedComments.has(post.id);
            const likersOpen = expandedLikers.has(post.id);

            return (
              <Grid item xs={12} md={6} key={post.id} id={`admin-post-${post.id}`}>
                <Card
                  sx={{
                    height: '100%',
                    borderTop: '4px solid',
                    borderColor,
                    boxShadow: isHighlighted ? '0px 12px 24px rgba(56, 101, 255, 0.25)' : undefined,
                    transform: isHighlighted ? 'translateY(-4px)' : 'none',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" color="text.secondary">
                        #{post.id} · {formatDateTime(post.createdAt)}
                      </Typography>
                      <Typography variant="body1">{post.content || '—'}</Typography>
                      {mediaUrls.length > 0 && (
                        <Grid container spacing={1}>
                          {mediaUrls.map((url, index) => (
                            <Grid item xs={12} key={index}>
                              {isVideo(url) ? (
                                <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
                                  <video src={url} controls style={{ width: '100%', maxHeight: 320, borderRadius: 8 }} />
                                </Box>
                              ) : (
                                <Box
                                  component="img"
                                  src={url}
                                  alt={`Post media ${index + 1}`}
                                  sx={{
                                    width: '100%',
                                    maxHeight: 320,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                  }}
                                  loading="lazy"
                                />
                              )}
                            </Grid>
                          ))}
                        </Grid>
                      )}
                      <Stack direction="row" spacing={1}>
                        <Chip label={`${post.likes ?? 0} likes`} size="small" />
                        <Chip label={`${post.comments ?? 0} comments`} size="small" />
                        <Chip label={`${mediaCount} media`} size="small" />
                        {typeof post.reportCount === 'number' && (
                          <Chip
                            label={`${post.reportCount} report${post.reportCount === 1 ? '' : 's'}`}
                            size="small"
                            color={post.reportCount > 0 ? 'error' : 'default'}
                            icon={<FlagIcon fontSize="small" />}
                          />
                        )}
                        {post.adminFlagged && (
                          <Chip
                            label="Flagged"
                            color="warning"
                            size="small"
                            icon={<FlagIcon fontSize="small" />}
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </Stack>
                      <Box>
                        <Typography variant="subtitle2">Doctor</Typography>
                        <Typography variant="body2">
                          {post.doctorName || 'Unknown'} · {post.doctorSpecialty || 'Specialty unavailable'}
                        </Typography>
                        {post.doctorId && (
                          <Button
                            size="small"
                            sx={{ mt: 1, textTransform: 'none' }}
                            onClick={() => navigate(`/doctor/${post.doctorId}`)}
                          >
                            View public profile
                          </Button>
                        )}
                        {post.adminFlagged && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Flagged {post.adminFlaggedAt ? `on ${formatDateTime(post.adminFlaggedAt)}` : 'for review'}
                            {post.adminFlagReason ? ` · Reason: ${post.adminFlagReason}` : ''}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          variant="text"
                          startIcon={<ChatBubbleOutlineIcon />}
                          onClick={() => toggleComments(post.id)}
                          sx={{ textTransform: 'none' }}
                        >
                          {commentsOpen ? 'Hide comments' : 'View comments'}
                        </Button>
                        <Button
                          variant="text"
                          startIcon={<FavoriteBorderIcon />}
                          onClick={() => toggleLikers(post.id)}
                          sx={{ textTransform: 'none' }}
                        >
                          {likersOpen ? 'Hide likes' : 'View likes'}
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(post)}
                          sx={{ textTransform: 'none' }}
                          disabled={deletingPostId === post.id}
                        >
                          {deletingPostId === post.id ? 'Deleting…' : 'Delete post'}
                        </Button>
                        <Button
                          variant="outlined"
                          color={post.adminFlagged ? 'warning' : 'primary'}
                          startIcon={post.adminFlagged ? <FlagIcon /> : <OutlinedFlagIcon />}
                          onClick={() => (post.adminFlagged ? handleUnflag(post) : openFlagDialog(post))}
                          sx={{ textTransform: 'none' }}
                        >
                          {post.adminFlagged ? 'Unflag post' : 'Flag for review'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="inherit"
                          startIcon={<OutlinedFlagIcon />}
                          onClick={() => handleViewReports(post.id)}
                          sx={{ textTransform: 'none' }}
                          disabled={(post.reportCount ?? 0) === 0}
                        >
                          View reports
                        </Button>
                      </Stack>
                      <Collapse in={commentsOpen} unmountOnExit>
                        <Box sx={{ mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                          {commentsData?.loading ? (
                            <Stack alignItems="center" py={2}>
                              <CircularProgress size={24} />
                            </Stack>
                          ) : commentsData?.error ? (
                            <Alert severity="error">{commentsData.error}</Alert>
                          ) : commentsData?.data?.length ? (
                            <List dense>
                              {commentsData.data.map((comment) => (
                                <ListItem key={comment.id} alignItems="flex-start">
                                  <ListItemAvatar>
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 14,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {comment.commenterName ? comment.commenterName.charAt(0) : 'U'}
                                    </Box>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="subtitle2">{comment.commenterName || 'Unknown User'}</Typography>
                                        <Chip size="small" label={comment.commenterSpecialty || 'User'} />
                                      </Stack>
                                    }
                                    secondary={
                                      <Stack spacing={0.5}>
                                        <Typography variant="body2" color="text.primary">
                                          {comment.content}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {formatDateTime(comment.createdAt)} · {comment.likes} like(s)
                                        </Typography>
                                        <Button
                                          variant="text"
                                          color="error"
                                          size="small"
                                          startIcon={<DeleteIcon fontSize="small" />}
                                          onClick={() => handleDeleteComment(post.id, comment.id)}
                                          disabled={deletingCommentId === comment.id}
                                          sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                                        >
                                          {deletingCommentId === comment.id ? 'Deleting…' : 'Delete comment'}
                                        </Button>
                                      </Stack>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No comments yet.
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                      <Collapse in={likersOpen} unmountOnExit>
                        <Box sx={{ mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                          {likersData?.loading ? (
                            <Stack alignItems="center" py={2}>
                              <CircularProgress size={24} />
                            </Stack>
                          ) : likersData?.error ? (
                            <Alert severity="error">{likersData.error}</Alert>
                          ) : likersData?.data?.length ? (
                            <List dense>
                              {likersData.data.map((liker) => (
                                <ListItem key={`${liker.userId}-${liker.likedAt}`} alignItems="flex-start">
                                  <ListItemAvatar>
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: 'secondary.light',
                                        color: 'secondary.contrastText',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <PersonIcon fontSize="small" />
                                    </Box>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="subtitle2">{liker.name || 'Unknown User'}</Typography>
                                        <Chip size="small" label={liker.userType || 'User'} />
                                      </Stack>
                                    }
                                    secondary={
                                      <Typography variant="caption" color="text.secondary">
                                        {liker.specialty || 'General'} · {formatDateTime(liker.likedAt)}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No likes recorded.
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      </Container>

      <Dialog open={flagDialogOpen} onClose={closeFlagDialog} fullWidth maxWidth="sm">
        <DialogTitle>Flag Post for Review</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ mb: 2 }}>
            Add an optional note to describe why this post needs follow-up. Notes are visible to administrators only.
          </DialogContentText>
          <TextField
            autoFocus
            multiline
            minRows={3}
            fullWidth
            label="Reason (optional)"
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Describe why this post should be reviewed later..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFlagDialog} disabled={flagSubmitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitFlag} disabled={flagSubmitting} startIcon={<FlagIcon />}>
            {flagSubmitting ? 'Flagging...' : 'Flag Post'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={reportDialogOpen}
        onClose={() => {
          setReportDialogOpen(false);
          setActiveReportPostId(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Post Reports</DialogTitle>
        <DialogContent dividers>
          {activeReportPostId === null ? (
            <Typography variant="body2" color="text.secondary">
              Select a post to view reports.
            </Typography>
          ) : reportState[activeReportPostId]?.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : reportState[activeReportPostId]?.error ? (
            <Alert severity="error">{reportState[activeReportPostId]?.error}</Alert>
          ) : reportState[activeReportPostId]?.data?.length ? (
            <Stack spacing={2}>
              {reportState[activeReportPostId].data.map((report) => (
                <Box
                  key={report.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Chip
                      label={report.reason.replace(/_/g, ' ')}
                      color="warning"
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(report.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Reporter: {report.reporterName || 'Unknown'} ({report.reporterType.toLowerCase()})
                  </Typography>
                  {report.reporterSpecialty && (
                    <Typography variant="caption" color="text.secondary">
                      {report.reporterSpecialty}
                    </Typography>
                  )}
                  {report.otherReason && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Other reason:
                      </Typography>
                      <Typography variant="body2">{report.otherReason}</Typography>
                    </Box>
                  )}
                  {report.details && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Additional details:
                      </Typography>
                      <Typography variant="body2">{report.details}</Typography>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Reviewed: {report.reviewed ? 'Yes' : 'No'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No reports found for this post.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setReportDialogOpen(false);
              setActiveReportPostId(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminPosts;

