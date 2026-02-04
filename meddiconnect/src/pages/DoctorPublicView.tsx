import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Rating,
  useMediaQuery,
  useTheme,
  Container,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { keyframes } from '@mui/system';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  LocalHospital as HospitalIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as ArrowBackIcon,
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  Send,
  Close,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
  ExpandMore,
  ExpandLess,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import FlagIcon from '@mui/icons-material/Flag';
import { SelectChangeEvent } from '@mui/material/Select';
import { useAuth } from '../context/AuthContext';
import DoctorNameLink from '../components/DoctorNameLink';
import PatientLayout from '../components/PatientLayout';
import DoctorLayout from '../components/DoctorLayout';

interface EducationHistory {
  id: number;
  institutionName: string;
  startDate: string;
  endDate: string;
  stillEnrolled: boolean;
}

interface WorkExperience {
  id: number;
  organizationName: string;
  roleTitle: string;
  startDate: string;
  endDate: string;
  stillWorking: boolean;
}

interface DayAvailabilityData {
  dayOfWeek: string;
  enabled: boolean;
  startTime?: string;
  endTime?: string;
}

interface DoctorPublicData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  city?: string;
  country?: string;
  profilePicture?: string;
  bannerPicture?: string;
  bio?: string;
  specializations: string[];
  clinicName?: string;
  licenseNumber?: string;
  consultationFee?: number;
  availableDays?: string[];
  availableTimeStart?: string;
  availableTimeEnd?: string;
  dayAvailabilities?: DayAvailabilityData[];
  appointmentDurationMinutes?: number;
  insuranceAccepted?: string[];
  educationHistories?: EducationHistory[];
  workExperiences?: WorkExperience[];
}

interface Post {
  id: number;
  doctorName: string;
  doctorSpecialty: string;
  doctorId: number;
  content: string;
  mediaUrl?: string;
  mediaUrls?: string; // JSON array string
  likes: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
  adminFlagged?: boolean;
  adminFlagReason?: string | null;
  adminFlaggedAt?: string | null;
  reportCount?: number;
}

interface Comment {
  id: number;
  commenterName: string;
  commenterSpecialty: string;
  commenterId: number;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replyCount: number;
  replies: Reply[];
  commenterProfilePicture?: string;
}

interface Reply {
  id: number;
  replierName: string;
  replierSpecialty: string;
  replierId: number;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replierProfilePicture?: string;
}

// Heart animation keyframes
const heartPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const heartFill = keyframes`
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const numberBounce = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const DoctorPublicView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [doctorData, setDoctorData] = useState<DoctorPublicData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  // Interactive features state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [animatingPosts, setAnimatingPosts] = useState<Set<number>>(new Set());
  const [animatingComments, setAnimatingComments] = useState<Set<number>>(new Set());
  const [animatingReplies, setAnimatingReplies] = useState<Set<number>>(new Set());
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [expandedImageIndex, setExpandedImageIndex] = useState(0);
  const [expandedImageList, setExpandedImageList] = useState<string[]>([]);
  const [postMediaIndices, setPostMediaIndices] = useState<Map<number, number>>(new Map());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set()); // Track failed image URLs
  const viewTrackedRef = React.useRef(false); // Track if we've already recorded a view for this page load
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState<string>('INAPPROPRIATE_CONTENT');
  const [reportOtherReason, setReportOtherReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [adminFlagDialogOpen, setAdminFlagDialogOpen] = useState(false);
  const [adminFlaggingPost, setAdminFlaggingPost] = useState<Post | null>(null);
  const [adminFlagReason, setAdminFlagReason] = useState('');
  const [adminFlagSubmitting, setAdminFlagSubmitting] = useState(false);
  const [adminDeletingPostId, setAdminDeletingPostId] = useState<number | null>(null);

  const isAdmin = user?.type === 'admin';
  const isDoctor = user?.type === 'doctor';
  const canInteractWithPosts = Boolean(user?.token) && !isAdmin && !isDoctor;

  const PublicLayout = ({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) => (
    <Box>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom>
            {title || 'Doctor Profile'}
          </Typography>
          {subtitle && (
            <Typography variant="body1">
              {subtitle}
            </Typography>
          )}
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );

  const reportReasonOptions = [
    { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
    { value: 'MISINFORMATION', label: 'Misinformation' },
    { value: 'HARASSMENT_OR_ABUSE', label: 'Harassment or abuse' },
    { value: 'SPAM_OR_SCAM', label: 'Spam or scam' },
    { value: 'PRIVACY_CONCERN', label: 'Privacy concern' },
    { value: 'OTHER', label: 'Other' },
  ];

  const openAdminFlagDialog = (post: Post) => {
    setAdminFlaggingPost(post);
    setAdminFlagReason(post.adminFlagReason ?? '');
    setAdminFlagDialogOpen(true);
  };

  const closeAdminFlagDialog = () => {
    if (adminFlagSubmitting) {
      return;
    }
    setAdminFlagDialogOpen(false);
    setAdminFlaggingPost(null);
    setAdminFlagReason('');
  };

  const submitAdminFlag = async () => {
    if (!adminFlaggingPost || !user?.token) {
      return;
    }

    setAdminFlagSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8080/admin/posts/${adminFlaggingPost.id}/flag`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: adminFlagReason.trim() }),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => null);
        throw new Error(message || 'Failed to flag post.');
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === adminFlaggingPost.id
            ? {
                ...post,
                adminFlagged: true,
                adminFlagReason: adminFlagReason.trim() || null,
                adminFlaggedAt: new Date().toISOString(),
              }
            : post,
        ),
      );
      setToast({ open: true, message: 'Post flagged for review.', severity: 'success' });
      closeAdminFlagDialog();
    } catch (err) {
      setToast({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to flag post. Try again later.',
        severity: 'error',
      });
    } finally {
      setAdminFlagSubmitting(false);
    }
  };

  const handleAdminUnflag = async (post: Post) => {
    if (!user?.token) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/admin/posts/${post.id}/flag`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text().catch(() => null);
        throw new Error(message || 'Failed to unflag post.');
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
      setToast({ open: true, message: 'Post unflagged.', severity: 'success' });
    } catch (err) {
      setToast({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to unflag post. Try again later.',
        severity: 'error',
      });
    }
  };

  const handleAdminDeletePost = async (post: Post) => {
    if (!user?.token) {
      return;
    }

    const confirmed = window.confirm('Delete this post permanently? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setAdminDeletingPostId(post.id);
    try {
      const response = await fetch(`http://localhost:8080/admin/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text().catch(() => null);
        throw new Error(message || 'Failed to delete post.');
      }

      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      if (selectedPost?.id === post.id) {
        setCommentDialogOpen(false);
        setSelectedPost(null);
        setComments([]);
      }
      setToast({ open: true, message: 'Post deleted.', severity: 'success' });
    } catch (err) {
      setToast({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to delete post. Try again later.',
        severity: 'error',
      });
    } finally {
      setAdminDeletingPostId(null);
    }
  };

  // Helper function to parse media URLs from post
  const getMediaUrls = (post: Post): string[] => {
    const urls: string[] = [];
    
    if (post.mediaUrls) {
      try {
        const parsed = JSON.parse(post.mediaUrls);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out null, undefined, or empty strings
          parsed.forEach((url: any) => {
            if (url && typeof url === 'string' && url.trim() !== '') {
              urls.push(url.trim());
            }
          });
        }
      } catch (e) {
        console.error('Error parsing mediaUrls:', e);
      }
    }
    
    // Fallback to single mediaUrl for backward compatibility
    if (urls.length === 0 && post.mediaUrl && post.mediaUrl.trim() !== '') {
      urls.push(post.mediaUrl.trim());
    }
    
    return urls;
  };

  // Helper function to check if URL is a video
  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const videoMimeTypes = ['/video/upload/', '/video/'];
    return videoExtensions.some(ext => lowerUrl.endsWith(ext)) || 
           videoMimeTypes.some(type => lowerUrl.includes(type));
  };

  // Helper functions
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const formatDateLong = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value ?? '';
  }
};

  const formatWorkingHours = (start?: string, end?: string) => {
    if (!start || !end) return 'Not specified';
    return `${start} - ${end}`;
  };

  const calculateYearsOfExperience = (workExperiences?: WorkExperience[]) => {
    if (!workExperiences || workExperiences.length === 0) return 0;
    
    const totalMonths = workExperiences.reduce((total, work) => {
      const startDate = new Date(work.startDate);
      const endDate = work.stillWorking ? new Date() : new Date(work.endDate);
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth());
      return total + months;
    }, 0);
    
    return Math.floor(totalMonths / 12);
  };

  // Interactive functions
  const handleLike = async (postId: number) => {
    // Redirect to sign up if user is not logged in
    if (!user?.token) {
      navigate('/register');
      return;
    }
    if (isAdmin) {
      setToast({ open: true, message: 'Admins can review posts without interacting.', severity: 'info' });
      return;
    }

    setAnimatingPosts(prev => new Set(prev).add(postId));
    
    // Optimistic update
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
          : post
      )
    );

    try {
      const response = await fetch(`http://localhost:8080/posts/like/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        // Revert on failure
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, likes: post.isLiked ? post.likes + 1 : post.likes - 1, isLiked: !post.isLiked }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likes: post.isLiked ? post.likes + 1 : post.likes - 1, isLiked: !post.isLiked }
            : post
        )
      );
    } finally {
      setTimeout(() => {
        setAnimatingPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }, 600);
    }
  };

  const handleShare = async (post: Post) => {
    const url = `${window.location.origin}/doctor-public-profile/${post.doctorId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.doctorName}`,
          text: post.content,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleOpenReportDialog = (post: Post) => {
    if (!user?.token) {
      navigate('/register');
      return;
    }

    if (user.type !== 'doctor' && user.type !== 'patient') {
      setToast({ open: true, message: 'Only patients and doctors can report posts.', severity: 'info' });
      return;
    }

    setReportingPost(post);
    setReportReason('INAPPROPRIATE_CONTENT');
    setReportOtherReason('');
    setReportDetails('');
    setReportDialogOpen(true);
  };

  const handleCloseReportDialog = () => {
    if (reportSubmitting) return;
    setReportDialogOpen(false);
    setReportingPost(null);
    setReportReason('INAPPROPRIATE_CONTENT');
    setReportOtherReason('');
    setReportDetails('');
  };

  const handleReportReasonChange = (event: SelectChangeEvent<string>) => {
    setReportReason(event.target.value);
    if (event.target.value !== 'OTHER') {
      setReportOtherReason('');
    }
  };

  const handleSubmitReport = async () => {
    if (!reportingPost || !user?.token) {
      return;
    }

    setReportSubmitting(true);

    try {
      const response = await fetch(`http://localhost:8080/posts/${reportingPost.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          reason: reportReason,
          otherReason: reportReason === 'OTHER' ? reportOtherReason : null,
          details: reportDetails,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.status === 'success') {
        setToast({ open: true, message: 'Report submitted. Thank you.', severity: 'success' });
        handleCloseReportDialog();
      } else {
        const message = data?.message || 'Failed to submit report. Please try again.';
        setToast({ open: true, message, severity: 'error' });
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setToast({ open: true, message: 'Unable to submit report. Check your connection.', severity: 'error' });
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOpenComments = async (post: Post) => {
    // Allow viewing comments for non-logged-in users, but they can't add comments
    setSelectedPost(post);
    setCommentDialogOpen(true);
    
    try {
      // Build headers - comments can be viewed publicly
      const headers: HeadersInit = {};
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      const response = await fetch(`http://localhost:8080/posts/comments/${post.id}`, {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    }
  };

  const handleAddComment = async () => {
    // Redirect to sign up if user is not logged in
    if (!user?.token) {
      navigate('/register');
      return;
    }
    if (isAdmin) {
      setToast({ open: true, message: 'Admins cannot add comments while reviewing.', severity: 'info' });
      return;
    }
    
    if (!selectedPost || !newComment.trim()) return;

    try {
      setCommentLoading(true);
      const response = await fetch('http://localhost:8080/posts/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          postId: selectedPost.id,
          commenterId: user?.id || 1,
          commentText: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setNewComment('');
          // Refresh comments
          const commentsResponse = await fetch(`http://localhost:8080/posts/comments/${selectedPost.id}`, {
            headers: {
              'Authorization': `Bearer ${user?.token}`,
            },
          });
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            setComments(commentsData);
          }
          // Update post comment count
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === selectedPost.id 
                ? { ...post, comments: post.comments + 1 }
                : post
            )
          );
        }
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    // Redirect to sign up if user is not logged in
    if (!user?.token) {
      navigate('/register');
      return;
    }
    if (isAdmin) {
      setToast({ open: true, message: 'Admins can review reactions only.', severity: 'info' });
      return;
    }
    
    setAnimatingComments(prev => new Set(prev).add(commentId));
    
    // Optimistic update
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId
          ? { ...comment, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1, isLiked: !comment.isLiked }
          : comment
      )
    );

    try {
      const response = await fetch(`http://localhost:8080/posts/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        // Revert on failure
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === commentId
              ? { ...comment, likes: comment.isLiked ? comment.likes + 1 : comment.likes - 1, isLiked: !comment.isLiked }
              : comment
          )
        );
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      // Revert on error
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId
            ? { ...comment, likes: comment.isLiked ? comment.likes + 1 : comment.likes - 1, isLiked: !comment.isLiked }
            : comment
        )
      );
    } finally {
      setTimeout(() => {
        setAnimatingComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
      }, 600);
    }
  };

  const toggleReplies = (commentId: number) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleAddReply = async (commentId: number) => {
    // Redirect to sign up if user is not logged in
    if (!user?.token) {
      navigate('/register');
      return;
    }
    if (isAdmin) {
      setToast({ open: true, message: 'Admins cannot reply while reviewing.', severity: 'info' });
      return;
    }
    
    if (!replyText.trim()) return;

    try {
      const response = await fetch('http://localhost:8080/posts/comment/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          commentId: commentId,
          replierId: user?.id || 1,
          replyText: replyText.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setReplyText('');
          setReplyingTo(null);
          // Refresh comments to get updated replies
          if (selectedPost) {
            const commentsResponse = await fetch(`http://localhost:8080/posts/comments/${selectedPost.id}`, {
              headers: {
                'Authorization': `Bearer ${user?.token}`,
              },
            });
            if (commentsResponse.ok) {
              const commentsData = await commentsResponse.json();
              setComments(commentsData);
              // Ensure the comment remains expanded
              setExpandedComments(prev => new Set(prev).add(commentId));
            }
          }
        }
      }
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleLikeReply = async (replyId: number, commentId: number) => {
    if (!user?.token) {
      navigate('/register');
      return;
    }
    if (isAdmin) {
      setToast({ open: true, message: 'Admins can review reactions only.', severity: 'info' });
      return;
    }
    setAnimatingReplies(prev => new Set(prev).add(replyId));
    
    // Optimistic update
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId
          ? {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === replyId
                  ? { ...reply, likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1, isLiked: !reply.isLiked }
                  : reply
              )
            }
          : comment
      )
    );

    try {
      const response = await fetch(`http://localhost:8080/posts/reply/like/${replyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        // Revert on failure
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === commentId
              ? {
                  ...comment,
                  replies: comment.replies.map(reply =>
                    reply.id === replyId
                      ? { ...reply, likes: reply.isLiked ? reply.likes + 1 : reply.likes - 1, isLiked: !reply.isLiked }
                      : reply
                  )
                }
              : comment
          )
        );
      }
    } catch (err) {
      console.error('Error liking reply:', err);
      // Revert on error
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === replyId
                    ? { ...reply, likes: reply.isLiked ? reply.likes + 1 : reply.likes - 1, isLiked: !reply.isLiked }
                    : reply
                )
              }
            : comment
        )
      );
    } finally {
      setTimeout(() => {
        setAnimatingReplies(prev => {
          const newSet = new Set(prev);
          newSet.delete(replyId);
          return newSet;
        });
      }, 600);
    }
  };

  // Track profile view for analytics
  // This is called once per page load to record that someone viewed the doctor's profile
  const trackProfileView = async () => {
    // Only track once per page load
    if (viewTrackedRef.current || !id) {
      return;
    }
    
    try {
      // Call the track-view endpoint (public, no auth required)
      await fetch(`http://localhost:8080/healthprovider/track-view/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Mark as tracked so we don't call it again
      viewTrackedRef.current = true;
    } catch (error) {
      // Silently fail - tracking shouldn't break the page
      console.error('Error tracking profile view:', error);
    }
  };

  // Fetch doctor data (public endpoint - works without authentication)
  const fetchDoctorData = async () => {
    try {
      // Build headers - public profile can be viewed without auth
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      const response = await fetch(`http://localhost:8080/healthprovider/public-profile/${id}`, {
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          if (data.isPrivate) {
            // Profile is private
            setError('This profile is private');
            setDoctorData(data.data); // Set basic info (name and profile picture)
          } else {
            // Profile is public - track the view
            setDoctorData(data.data);
            // Track profile view (only for public profiles)
            trackProfileView();
          }
        } else {
          setError('Doctor profile not found');
        }
      } else {
        setError('Failed to load doctor profile');
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      setError('Failed to load doctor profile');
    }
  };

  // Fetch doctor's posts (public endpoint - works without authentication)
  // Updated to handle paginated response format
  const fetchPosts = async () => {
    try {
      // Build headers - posts can be viewed publicly
      const headers: HeadersInit = {};
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      const response = await fetch(`http://localhost:8080/posts/doctor/${id}?page=0&size=20`, {
        headers,
      });
      if (response.ok) {
        const responseData = await response.json();
        // Handle paginated response format: { data: [...], totalElements, hasNext, ... }
        // Or backward compatible format: array of posts
        let postsData: any[] = [];
        if (Array.isArray(responseData)) {
          // Backward compatible: direct array response
          postsData = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          // New paginated format
          postsData = responseData.data;
        }
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // Fetch doctor's rating
  const fetchRating = async () => {
    if (!id) return;
    try {
      console.log('Fetching rating for doctor ID:', id);
      const response = await fetch(`http://localhost:8080/reviews/doctor/${id}/rating`);
      console.log('Rating API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Rating API data:', data);
        if (data.status === 'success') {
          console.log('Setting averageRating to:', data.averageRating, 'totalReviews:', data.totalReviews);
          setAverageRating(data.averageRating || 0);
          setTotalReviews(data.totalReviews || 0);
        } else {
          // If no reviews yet, set to 0
          console.log('No reviews found, setting to 0');
          setAverageRating(0);
          setTotalReviews(0);
        }
      } else {
        // If endpoint fails, set to 0
        const errorText = await response.text();
        console.error('Rating API error response:', errorText);
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
      // Set to 0 on error
      setAverageRating(0);
      setTotalReviews(0);
    }
  };

  useEffect(() => {
    // Reset view tracking when ID changes (new profile loaded)
    viewTrackedRef.current = false;
    
    const loadData = async () => {
      setLoading(true);
      await fetchDoctorData();
      await fetchPosts();
      await fetchRating();
      setLoading(false);
    };
    
    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !doctorData) {
    const isPrivateProfile = error === 'This profile is private';
    
    if (isPrivateProfile) {
      // Only use layout if user is logged in, otherwise render without sidebar
      const Layout = user?.token
        ? user?.type === 'doctor'
          ? DoctorLayout
          : user?.type === 'patient'
          ? PatientLayout
          : PublicLayout
        : PublicLayout;
      
      return (
        <Layout title="Doctor Profile" subtitle="View doctor information and posts">
          <Box sx={{ 
            minHeight: 'calc(100vh - 200px)', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}>
            {/* Blurred Profile Background */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: doctorData?.profilePicture 
                ? `url(${doctorData.profilePicture})` 
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(15px) brightness(0.4)',
              transform: 'scale(1.1)',
              zIndex: 1
            }} />
            
            {/* Content Overlay */}
            <Box sx={{
              position: 'relative',
              zIndex: 2,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              textAlign: 'center'
            }}>
              {/* Profile Picture */}
              <Box sx={{ mb: 4 }}>
                <Avatar
                  src={doctorData?.profilePicture}
                  sx={{
                    width: 140,
                    height: 140,
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                    bgcolor: 'primary.main'
                  }}
                >
                  {doctorData && getInitials(`${doctorData.firstName} ${doctorData.lastName}`)}
                </Avatar>
              </Box>
              
              {/* Private Message */}
              <Paper sx={{
                p: 5,
                maxWidth: 500,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" sx={{ 
                    color: 'primary.main', 
                    mb: 1, 
                    fontWeight: 700,
                    fontSize: '2.5rem'
                  }}>
                    🔒
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: 'text.primary', 
                    mb: 2, 
                    fontWeight: 600
                  }}>
                    Private Profile
                  </Typography>
                </Box>
                
                <Typography variant="h6" sx={{ 
                  color: 'text.secondary', 
                  mb: 3,
                  fontWeight: 500,
                  lineHeight: 1.6
                }}>
                  <strong>{doctorData ? `${doctorData.firstName} ${doctorData.lastName}` : 'This doctor'}</strong> has chosen to keep their profile private.
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  color: 'text.secondary', 
                  mb: 4,
                  lineHeight: 1.6
                }}>
                  You can still connect with them through other features of the platform, such as messaging or booking appointments.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Go Back
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/find-doctor')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.50',
                        borderColor: 'primary.dark',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Find Other Doctors
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Layout>
      );
    }
    
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Doctor profile not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  const Layout = user?.token
    ? user?.type === 'doctor'
      ? DoctorLayout
      : user?.type === 'patient'
      ? PatientLayout
      : PublicLayout
    : PublicLayout;

  return (
    <Layout
      title={`Dr. ${doctorData?.firstName} ${doctorData?.lastName}`}
      subtitle="Healthcare Professional Profile"
    >
      <Box>
        {/* Back Button */}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Go Back
        </Button>

      {/* LinkedIn-style Profile Header */}
      <Paper sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
        {/* Cover Photo Area */}
        <Box sx={{ 
          height: 200, 
          background: doctorData?.bannerPicture 
            ? `url(${doctorData.bannerPicture}) center/cover`
            : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
          position: 'relative'
        }}>
          <Box sx={{
            position: 'absolute',
            bottom: { xs: -50, sm: -75 },
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={doctorData?.profilePicture}
                sx={{ 
                  width: { xs: 100, sm: 150 }, 
                  height: { xs: 100, sm: 150 },
                  border: '4px solid white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  fontSize: { xs: '2rem', sm: '3rem' }
                }}
              >
                {(!doctorData?.profilePicture && doctorData) && 
                  `${doctorData.firstName?.[0] || ''}${doctorData.lastName?.[0] || ''}`.toUpperCase()
                }
              </Avatar>
            </Box>
          </Box>
        </Box>

        {/* Profile Info Section */}
        <Box sx={{ pt: { xs: 6, sm: 8 }, pb: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 }, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: 'text.primary', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Dr. {doctorData?.firstName} {doctorData?.lastName}
          </Typography>
          
          {/* Specializations */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
            {doctorData?.specializations?.map((spec, index) => (
              <Chip 
                key={index} 
                label={spec}
                variant="outlined"
                color="primary"
                sx={{ 
                  borderRadius: 2,
                  fontWeight: 500,
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  height: { xs: 24, sm: 32 }
                }} 
              />
            ))}
          </Box>

          {/* Rating Display */}
          {totalReviews > 0 && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Rating value={averageRating} readOnly precision={0.1} size={window.innerWidth < 600 ? 'medium' : 'large'} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {averageRating.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
              </Typography>
            </Box>
          )}

          {/* Bio */}
          {doctorData?.bio && (
            <Typography variant="body1" sx={{ mb: { xs: 2, sm: 3 }, color: 'text.secondary', maxWidth: 600, mx: 'auto', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              {doctorData.bio}
            </Typography>
          )}

          {/* Key Info Cards */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            gap: { xs: 1, sm: 2 }, 
            mb: { xs: 2, sm: 3 },
            maxWidth: 800,
            mx: 'auto',
            px: { xs: 2, sm: 0 }
          }}>
            <Box sx={{ 
              flex: { xs: '0 0 calc(50% - 8px)', sm: '0 0 calc(20% - 16px)' },
              minWidth: { xs: 'calc(50% - 8px)', sm: '140px' },
              p: { xs: 1.5, sm: 2 }, 
              borderRadius: 2, 
              backgroundColor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.100'
            }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {calculateYearsOfExperience(doctorData?.workExperiences)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Years Experience
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: { xs: '0 0 calc(50% - 8px)', sm: '0 0 calc(20% - 16px)' },
              minWidth: { xs: 'calc(50% - 8px)', sm: '140px' },
              p: { xs: 1.5, sm: 2 }, 
              borderRadius: 2, 
              backgroundColor: 'success.50',
              border: '1px solid',
              borderColor: 'success.100'
            }}>
              <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {doctorData?.specializations?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Specializations
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: { xs: '0 0 calc(50% - 8px)', sm: '0 0 calc(20% - 16px)' },
              minWidth: { xs: 'calc(50% - 8px)', sm: '140px' },
              p: { xs: 1.5, sm: 2 }, 
              borderRadius: 2, 
              backgroundColor: 'warning.50',
              border: '1px solid',
              borderColor: 'warning.100'
            }}>
              <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {doctorData?.consultationFee ? `$${doctorData.consultationFee}` : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Consultation Fee
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: { xs: '0 0 calc(50% - 8px)', sm: '0 0 calc(20% - 16px)' },
              minWidth: { xs: 'calc(50% - 8px)', sm: '140px' },
              p: { xs: 1.5, sm: 2 }, 
              borderRadius: 2, 
              backgroundColor: 'info.50',
              border: '1px solid',
              borderColor: 'info.100'
            }}>
              <Typography variant="h6" sx={{ color: 'info.main', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {doctorData?.availableDays?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Available Days
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: { xs: '0 0 calc(50% - 8px)', sm: '0 0 calc(20% - 16px)' },
              minWidth: { xs: 'calc(50% - 8px)', sm: '140px' },
              p: { xs: 1.5, sm: 2 }, 
              borderRadius: 2, 
              backgroundColor: 'warning.50',
              border: '1px solid',
              borderColor: 'warning.100'
            }}>
              <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {totalReviews > 0 ? averageRating.toFixed(1) : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                {totalReviews > 0 ? `Rating (${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})` : 'No Reviews Yet'}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', px: { xs: 2, sm: 0 } }}>
            {/* Show disabled button for doctors and admins, enabled for patients, or sign up for non-logged-in users */}
            {user?.token && (isDoctor || isAdmin) ? (
              <Button
                variant="contained"
                startIcon={<CalendarIcon />}
                disabled
                fullWidth={isMobile}
                sx={{ 
                  borderRadius: 3,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1.5, sm: 1 },
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  cursor: 'not-allowed',
                }}
              >
                Book Appointment
              </Button>
            ) : canInteractWithPosts ? (
              <Button
                variant="contained"
                startIcon={<CalendarIcon />}
                onClick={() => navigate(`/book-appointment/${id}`)}
                fullWidth={isMobile}
                sx={{ 
                  borderRadius: 3,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1.5, sm: 1 },
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 2,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Book Appointment
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<CalendarIcon />}
                onClick={() => navigate('/register')}
                fullWidth={isMobile}
                sx={{ 
                  borderRadius: 3,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1.5, sm: 1 },
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 2,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Sign Up to Book Appointment
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Main Content Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Left Column - Professional Info */}
        <Grid item xs={12} lg={8}>
          {/* Contact Information */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 2, sm: 3 }, color: 'text.primary', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
              Contact Information
            </Typography>
            
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 2, 
                    backgroundColor: 'primary.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <PhoneIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {doctorData?.phoneNumber || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 2, 
                    backgroundColor: 'success.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <EmailIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {doctorData?.email || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Clinic Information */}
          {doctorData?.clinicName && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                Clinic Information
              </Typography>
              
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                backgroundColor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.200',
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HospitalIcon sx={{ color: 'primary.main', mr: 2, fontSize: 24 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {doctorData.clinicName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      License: {doctorData.licenseNumber || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Available Days, Working Hours, and Location */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                      Available Days
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(() => {
                        // Use new dayAvailabilities system if available
                        if (doctorData?.dayAvailabilities && doctorData.dayAvailabilities.length > 0) {
                          const availableDays = doctorData.dayAvailabilities
                            .filter((av: DayAvailabilityData) => av.enabled === true)
                            .map((av: DayAvailabilityData) => av.dayOfWeek);
                          if (availableDays.length > 0) {
                            return availableDays.map((day, index) => (
                              <Chip 
                                key={index} 
                                label={day} 
                                size="small" 
                                variant="outlined"
                                color="primary"
                              />
                            ));
                          }
                          return <Typography variant="body2" color="text.secondary">No available days</Typography>;
                        }
                        // Fallback to old availableDays system
                        if (doctorData?.availableDays && doctorData.availableDays.length > 0) {
                          return doctorData.availableDays.map((day, index) => (
                            <Chip 
                              key={index} 
                              label={day} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                            />
                          ));
                        }
                        return <Typography variant="body2" color="text.secondary">Not specified</Typography>;
                      })()}
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                      Working Hours
                    </Typography>
                    {(() => {
                      // Use new dayAvailabilities system if available
                      if (doctorData?.dayAvailabilities && doctorData.dayAvailabilities.length > 0) {
                        const enabledDays = doctorData.dayAvailabilities.filter((av: DayAvailabilityData) => av.enabled === true);
                        if (enabledDays.length > 0) {
                          // Show schedule per day if different times, or overall if same
                          const times = enabledDays.map((av: DayAvailabilityData) => `${av.startTime || 'N/A'} - ${av.endTime || 'N/A'}`);
                          const uniqueTimes = Array.from(new Set(times));
                          if (uniqueTimes.length === 1) {
                            // All days have same hours
                            return <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatWorkingHours(enabledDays[0].startTime, enabledDays[0].endTime)}</Typography>;
                          } else {
                            // Different hours per day - show schedule
                            return (
                              <Box>
                                {enabledDays.map((av: DayAvailabilityData, index: number) => (
                                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>{av.dayOfWeek}:</strong> {formatWorkingHours(av.startTime, av.endTime)}
                                  </Typography>
                                ))}
                              </Box>
                            );
                          }
                        }
                      }
                      // Fallback to old system
                      return <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatWorkingHours(doctorData?.availableTimeStart, doctorData?.availableTimeEnd)}</Typography>;
                    })()}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                      Location
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {doctorData?.address ? 
                        `${doctorData.address}${doctorData.city ? `, ${doctorData.city}` : ''}${doctorData.country ? `, ${doctorData.country}` : ''}` 
                        : 'Not provided'
                      }
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Accepted Insurances */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Accepted Insurances
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {doctorData?.insuranceAccepted && doctorData.insuranceAccepted.length > 0 ? (
                    doctorData.insuranceAccepted.map((insurance, index) => (
                      <Chip 
                        key={index} 
                        label={insurance} 
                        size="small" 
                        variant="outlined"
                        color="secondary"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No insurance information provided</Typography>
                  )}
                </Box>
              </Box>

            </Paper>
          )}
        </Grid>

        {/* Right Column - Professional Summary */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
              Professional Summary
            </Typography>
            
            {/* Key Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'primary.50' }}>
                  <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {calculateYearsOfExperience(doctorData?.workExperiences)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Years Experience
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'success.50' }}>
                  <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {doctorData?.specializations?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Specializations
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Education */}
            {doctorData?.educationHistories && doctorData.educationHistories.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Education
                </Typography>
                {doctorData.educationHistories.map((education) => (
                  <Box key={education.id} sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {education.institutionName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateLong(education.startDate)} - {education.stillEnrolled ? 'Present' : formatDateLong(education.endDate)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Work Experience */}
            {doctorData?.workExperiences && doctorData.workExperiences.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Work Experience
                </Typography>
                {doctorData.workExperiences.map((work) => (
                  <Box key={work.id} sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {work.roleTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {work.organizationName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateLong(work.startDate)} - {work.stillWorking ? 'Present' : formatDateLong(work.endDate)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Posts Section */}
      <Grid item xs={12}>
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Posts by Dr. {doctorData?.firstName} {doctorData?.lastName}
          </Typography>
          
          <Divider sx={{ mb: 3 }} />

          {posts.length === 0 ? (
            <Alert severity="info">
              No posts yet from this doctor.
            </Alert>
          ) : (
            <Box>
              {posts.map((post) => (
                <Card key={post.id} sx={{ mb: 3, borderRadius: 2 }}>
                  <CardContent sx={{ pb: 1 }}>
                    {/* Doctor Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {getInitials(post.doctorName)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {post.doctorName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={post.doctorSpecialty}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(post.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Post Content */}
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </Typography>
                    {isAdmin && post.adminFlagged && (
                      <Typography
                        variant="caption"
                        color="warning.main"
                        sx={{ display: 'block', mb: 2, fontWeight: 600 }}
                      >
                        Flagged{post.adminFlaggedAt ? ` on ${formatDateTime(post.adminFlaggedAt)}` : ''}{post.adminFlagReason ? ` • ${post.adminFlagReason}` : ''}
                      </Typography>
                    )}

                    {/* Media Carousel */}
                    {(() => {
                      const mediaUrls = getMediaUrls(post);
                      if (mediaUrls.length === 0) return null;
                      
                      const currentIndex = postMediaIndices.get(post.id) || 0;
                      const currentMedia = mediaUrls[currentIndex];
                      
                      const handlePrevious = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        const newIndex = currentIndex > 0 ? currentIndex - 1 : mediaUrls.length - 1;
                        setPostMediaIndices(new Map(postMediaIndices.set(post.id, newIndex)));
                      };
                      
                      const handleNext = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        const newIndex = currentIndex < mediaUrls.length - 1 ? currentIndex + 1 : 0;
                        setPostMediaIndices(new Map(postMediaIndices.set(post.id, newIndex)));
                      };
                      
                      return (
                        <Box sx={{ mb: 2 }}>
                          <Box 
                            sx={{ 
                              cursor: 'pointer',
                              position: 'relative',
                              overflow: 'hidden',
                              borderRadius: '8px',
                              backgroundColor: 'grey.100',
                              '&:hover': {
                                opacity: 0.9,
                              }
                            }}
                            onClick={() => {
                              setExpandedImageList(mediaUrls);
                              setExpandedImageIndex(currentIndex);
                              setExpandedImage(mediaUrls[currentIndex]);
                            }}
                          >
                            {/* Navigation Arrows (only show if multiple images) */}
                            {mediaUrls.length > 1 && (
                              <>
                                <IconButton
                                  onClick={handlePrevious}
                                  sx={{
                                    position: 'absolute',
                                    left: 8,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                                    color: 'white',
                                    zIndex: 2,
                                    '&:hover': {
                                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                                    }
                                  }}
                                  size="small"
                                >
                                  <NavigateBefore />
                                </IconButton>
                                <IconButton
                                  onClick={handleNext}
                                  sx={{
                                    position: 'absolute',
                                    right: 8,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                                    color: 'white',
                                    zIndex: 2,
                                    '&:hover': {
                                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                                    }
                                  }}
                                  size="small"
                                >
                                  <NavigateNext />
                                </IconButton>
                                {/* Image Counter */}
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 8,
                                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                                    color: 'white',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    zIndex: 2,
                                  }}
                                >
                                  {currentIndex + 1} / {mediaUrls.length}
                                </Box>
                              </>
                            )}
                            
                            {failedImages.has(currentMedia) ? (
                              <Box
                                sx={{
                                  width: '100%',
                                  minHeight: '300px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'grey.200',
                                  borderRadius: '8px',
                                  p: 3,
                                }}
                              >
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {isVideoUrl(currentMedia) ? 'Video failed to load' : 'Image failed to load'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {currentIndex + 1} / {mediaUrls.length}
                                </Typography>
                              </Box>
                            ) : isVideoUrl(currentMedia) ? (
                              <video
                                src={currentMedia}
                                controls
                                style={{
                                  width: '100%',
                                  maxHeight: '600px',
                                  borderRadius: '8px',
                                  display: 'block',
                                }}
                                onError={(e) => {
                                  console.error('Failed to load video:', currentMedia);
                                  setFailedImages(prev => new Set(prev).add(currentMedia));
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <img
                                src={currentMedia}
                                alt={`Post media ${currentIndex + 1}`}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  maxHeight: '600px',
                                  objectFit: 'contain',
                                  display: 'block',
                                  borderRadius: '8px',
                                }}
                                loading="lazy"
                                onError={(e) => {
                                  console.error('Failed to load image:', currentMedia);
                                  setFailedImages(prev => new Set(prev).add(currentMedia));
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      );
                    })()}
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ px: 2, py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <IconButton
                        onClick={() => handleLike(post.id)}
                        color={post.isLiked ? 'error' : 'default'}
                        sx={{
                          padding: 0.5,
                          animation: animatingPosts.has(post.id) ? `${heartPulse} 0.6s ease-in-out` : 'none',
                        }}
                        disabled={!canInteractWithPosts}
                      >
                        {post.isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                      </IconButton>
                      <Typography 
                        variant="body2" 
                        color={post.isLiked ? 'error.main' : 'text.secondary'}
                        sx={{ 
                          fontWeight: post.isLiked ? 600 : 400,
                          animation: animatingPosts.has(post.id) ? `${numberBounce} 0.6s ease-in-out` : 'none',
                        }}
                      >
                        {post.likes}
                      </Typography>

                      <IconButton
                        onClick={() => handleOpenComments(post)}
                        sx={{ padding: 0.5 }}
                      >
                        <Comment fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" color="text.secondary">
                        {post.comments}
                      </Typography>

                      <IconButton
                        onClick={() => handleShare(post)}
                        sx={{ padding: 0.5 }}
                      >
                        <Share fontSize="small" />
                      </IconButton>
                      {(user?.type === 'doctor' || user?.type === 'patient') && (
                        <Button
                          size="small"
                          startIcon={<FlagIcon fontSize="small" />}
                          color="warning"
                          onClick={() => handleOpenReportDialog(post)}
                          sx={{ textTransform: 'none', ml: 1 }}
                        >
                          Report
                        </Button>
                      )}
                      {isAdmin && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon fontSize="small" />}
                            onClick={() => handleAdminDeletePost(post)}
                            disabled={adminDeletingPostId === post.id}
                            sx={{ textTransform: 'none' }}
                          >
                            {adminDeletingPostId === post.id ? 'Deleting…' : 'Delete post'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color={post.adminFlagged ? 'warning' : 'primary'}
                            startIcon={<FlagIcon fontSize="small" />}
                            onClick={() => (post.adminFlagged ? handleAdminUnflag(post) : openAdminFlagDialog(post))}
                            disabled={adminFlagSubmitting && adminFlaggingPost?.id === post.id}
                            sx={{ textTransform: 'none' }}
                          >
                            {post.adminFlagged ? 'Unflag post' : 'Flag for review'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Comments Dialog */}
      <Dialog 
        open={commentDialogOpen} 
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={window.innerWidth < 600}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            height: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: '90vh' },
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Comments</Typography>
            <IconButton onClick={() => setCommentDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No comments yet
            </Typography>
          ) : (
            <List>
              {comments.map((comment) => (
                <ListItem key={comment.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                  <Box sx={{ display: 'flex', width: '100%', mb: 2 }}>
                    <ListItemAvatar>
                      <Avatar 
                        src={comment.commenterProfilePicture}
                        sx={{ bgcolor: 'secondary.main' }}
                      >
                        {!comment.commenterProfilePicture && getInitials(comment.commenterName)}
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {comment.commenterSpecialty === 'Patient' ? (
                          <Typography variant="subtitle2" fontWeight="bold">
                            {comment.commenterName}
                          </Typography>
                        ) : (
                          <DoctorNameLink
                            doctorId={comment.commenterId}
                            doctorName={comment.commenterName}
                            variant="subtitle2"
                            fontWeight="bold"
                          />
                        )}
                        <Chip
                          label={comment.commenterSpecialty}
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ height: 18 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(comment.createdAt)}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {comment.content}
                      </Typography>

                      {/* Comment Actions */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleLikeComment(comment.id)}
                          color={comment.isLiked ? 'error' : 'default'}
                          sx={{
                            padding: 0.5,
                            animation: animatingComments.has(comment.id) ? `${heartPulse} 0.6s ease-in-out` : 'none',
                          }}
                          disabled={!canInteractWithPosts}
                        >
                          {comment.isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                        </IconButton>
                        <Typography 
                          variant="caption" 
                          color={comment.isLiked ? 'error.main' : 'text.secondary'}
                          sx={{ 
                            fontWeight: comment.isLiked ? 600 : 400,
                            animation: animatingComments.has(comment.id) ? `${numberBounce} 0.6s ease-in-out` : 'none',
                          }}
                        >
                          {comment.likes}
                        </Typography>

                        <Button
                          size="small"
                          startIcon={<ReplyIcon />}
                          onClick={() => canInteractWithPosts && setReplyingTo(comment.id)}
                          sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
                          disabled={!canInteractWithPosts}
                        >
                          Reply
                        </Button>

                        {comment.replyCount > 0 && (
                          <Button
                            size="small"
                            onClick={() => toggleReplies(comment.id)}
                            endIcon={expandedComments.has(comment.id) ? <ExpandLess /> : <ExpandMore />}
                            sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
                          >
                            {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                          </Button>
                        )}
                      </Box>

                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            placeholder={canInteractWithPosts ? 'Write a reply...' : 'Admins cannot reply while reviewing.'}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            variant="outlined"
                            size="small"
                            autoFocus={canInteractWithPosts}
                            disabled={!canInteractWithPosts}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleAddReply(comment.id)}
                            disabled={!canInteractWithPosts || !replyText.trim()}
                          >
                            Reply
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}

                      {/* Replies Section */}
                      {expandedComments.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                        <Box sx={{ mt: 2, ml: 4, borderLeft: '2px solid', borderColor: 'divider', pl: 2 }}>
                          {comment.replies.map((reply) => (
                            <Box key={reply.id} sx={{ display: 'flex', mb: 2 }}>
                              <Avatar 
                                src={reply.replierProfilePicture}
                                sx={{ width: 32, height: 32, bgcolor: 'primary.main', mr: 1, fontSize: '0.875rem' }}
                              >
                                {!reply.replierProfilePicture && getInitials(reply.replierName)}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  {reply.replierSpecialty === 'Patient' ? (
                                    <Typography variant="caption" fontWeight="bold">
                                      {reply.replierName}
                                    </Typography>
                                  ) : (
                                    <DoctorNameLink
                                      doctorId={reply.replierId}
                                      doctorName={reply.replierName}
                                      variant="caption"
                                      fontWeight="bold"
                                    />
                                  )}
                                  <Chip
                                    label={reply.replierSpecialty}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ height: 16, fontSize: '0.65rem' }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(reply.createdAt)}
                                  </Typography>
                                </Box>
                                
                                <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
                                  {reply.content}
                                </Typography>

                                {/* Reply Actions */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleLikeReply(reply.id, comment.id)}
                                    color={reply.isLiked ? 'error' : 'default'}
                                    sx={{
                                      padding: 0.25,
                                      animation: animatingReplies.has(reply.id) ? `${heartPulse} 0.6s ease-in-out` : 'none',
                                    }}
                                    disabled={!canInteractWithPosts}
                                  >
                                    {reply.isLiked ? <Favorite sx={{ fontSize: 14 }} /> : <FavoriteBorder sx={{ fontSize: 14 }} />}
                                  </IconButton>
                                  <Typography 
                                    variant="caption" 
                                    color={reply.isLiked ? 'error.main' : 'text.secondary'}
                                    sx={{ 
                                      fontWeight: reply.isLiked ? 600 : 400,
                                      fontSize: '0.75rem',
                                      animation: animatingReplies.has(reply.id) ? `${numberBounce} 0.6s ease-in-out` : 'none',
                                    }}
                                  >
                                    {reply.likes}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}

          {/* Add Comment */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder={canInteractWithPosts ? 'Write a comment...' : 'Admins can review comments only.'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              disabled={!canInteractWithPosts}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddComment}
              disabled={!canInteractWithPosts || !newComment.trim() || commentLoading}
              startIcon={<Send />}
            >
              {commentLoading ? 'Posting...' : 'Post'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Report Post Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={handleCloseReportDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Report Post
          <IconButton
            onClick={handleCloseReportDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            disabled={reportSubmitting}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Help us keep MeddieConnect safe by letting us know what's wrong with this post.
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="public-report-reason-label">Reason</InputLabel>
            <Select
              labelId="public-report-reason-label"
              value={reportReason}
              label="Reason"
              onChange={handleReportReasonChange}
              disabled={reportSubmitting}
            >
              {reportReasonOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {reportReason === 'OTHER' && (
            <TextField
              fullWidth
              label="Describe the reason (optional)"
              value={reportOtherReason}
              onChange={(e) => setReportOtherReason(e.target.value)}
              multiline
              minRows={2}
              sx={{ mb: 2 }}
              disabled={reportSubmitting}
            />
          )}

          <TextField
            fullWidth
            label="Additional details (optional)"
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            multiline
            minRows={3}
            placeholder="Provide any additional context or links (optional)"
            disabled={reportSubmitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog} disabled={reportSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSubmitReport}
            disabled={reportSubmitting}
            startIcon={reportSubmitting ? <CircularProgress size={16} /> : <FlagIcon fontSize="small" />}
          >
            {reportSubmitting ? 'Submitting...' : 'Submit report'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {isAdmin && (
        <Dialog
          open={adminFlagDialogOpen}
          onClose={closeAdminFlagDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Flag Post for Review</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add an optional internal note so other admins know why this post needs attention.
            </Typography>
            <TextField
              label="Reason (optional)"
              value={adminFlagReason}
              onChange={(e) => setAdminFlagReason(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              disabled={adminFlagSubmitting}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeAdminFlagDialog} disabled={adminFlagSubmitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={submitAdminFlag}
              disabled={adminFlagSubmitting}
              startIcon={adminFlagSubmitting ? <CircularProgress size={16} /> : <FlagIcon fontSize="small" />}
            >
              {adminFlagSubmitting ? 'Flagging...' : 'Flag post'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      </Box>

      {/* Expanded Image Dialog with Navigation */}
      <Dialog
        open={expandedImage !== null}
        onClose={() => {
          setExpandedImage(null);
          setExpandedImageList([]);
          setExpandedImageIndex(0);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            boxShadow: 'none',
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => {
              setExpandedImage(null);
              setExpandedImageList([]);
              setExpandedImageIndex(0);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              }
            }}
          >
            <Close />
          </IconButton>
          
          {/* Navigation Arrows (only if multiple images) */}
          {expandedImageList.length > 1 && (
            <>
              <IconButton
                onClick={() => {
                  const newIndex = expandedImageIndex > 0 ? expandedImageIndex - 1 : expandedImageList.length - 1;
                  setExpandedImageIndex(newIndex);
                  setExpandedImage(expandedImageList[newIndex]);
                }}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 2,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                  }
                }}
              >
                <NavigateBefore />
              </IconButton>
              <IconButton
                onClick={() => {
                  const newIndex = expandedImageIndex < expandedImageList.length - 1 ? expandedImageIndex + 1 : 0;
                  setExpandedImageIndex(newIndex);
                  setExpandedImage(expandedImageList[newIndex]);
                }}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 2,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                  }
                }}
              >
                <NavigateNext />
              </IconButton>
              {/* Image Counter */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  zIndex: 2,
                }}
              >
                {expandedImageIndex + 1} / {expandedImageList.length}
              </Box>
            </>
          )}
          
          {expandedImage && (
            <img
              src={expandedImage}
              alt="Expanded post media"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DoctorPublicView;
