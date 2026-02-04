import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
} from '@mui/material';
import { keyframes } from '@mui/system';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PostAdd as PostAddIcon,
  Favorite,
  FavoriteBorder,
  Comment as CommentIcon,
  Share as ShareIcon,
  Send,
  Close,
  Reply as ReplyIcon,
  ExpandMore,
  ExpandLess,
  NavigateBefore,
  NavigateNext,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  LocalHospital as HospitalIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import DoctorLayout from '../components/DoctorLayout';
import CreatePost from '../components/CreatePost';
import { useAuth } from '../context/AuthContext';

// Heart animation keyframes (same as SocialFeed)
const heartPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const heartFill = keyframes`
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const numberBounce = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.3); color: #f44336; }
  100% { transform: scale(1); }
`;

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
}

interface Liker {
  userId: number;
  name: string;
  specialty: string;
  userType: string;
  profilePicture?: string;
  likedAt: string;
}

interface Reply {
  id: number;
  replierName: string;
  replierSpecialty: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  replierId: number;
  replierProfilePicture?: string;
}

interface Comment {
  id: number;
  commenterName: string;
  commenterSpecialty: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  commenterId: number;
  replyCount: number;
  replies?: Reply[];
  commenterProfilePicture?: string;
}

const DoctorPublicProfile = () => {
  const { user } = useAuth();
  const [doctorData, setDoctorData] = useState<DoctorPublicData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<DoctorPublicData>>({});
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [animatingPosts, setAnimatingPosts] = useState<Set<number>>(new Set());
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [animatingComments, setAnimatingComments] = useState<Set<number>>(new Set());
  const [animatingReplies, setAnimatingReplies] = useState<Set<number>>(new Set());
  const [likersDialogOpen, setLikersDialogOpen] = useState(false);
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [expandedImageIndex, setExpandedImageIndex] = useState(0);
  const [expandedImageList, setExpandedImageList] = useState<string[]>([]);
  const [postMediaIndices, setPostMediaIndices] = useState<Map<number, number>>(new Map());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set()); // Track failed image URLs

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

  // Fetch doctor public data
  const fetchDoctorData = async () => {
    try {
      const response = await fetch(`http://localhost:8080/healthprovider/profile`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setDoctorData(data.data);
          setEditData(data.data);
          
          // Fetch rating for this doctor
          if (data.data?.id) {
            await fetchRating(data.data.id);
          }
        } else {
          setSnackbar({ open: true, message: 'Failed to load profile data', severity: 'error' });
        }
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      setSnackbar({ open: true, message: 'Failed to load profile data', severity: 'error' });
    }
  };

  // Fetch doctor's rating
  const fetchRating = async (doctorId: number) => {
    try {
      console.log('Fetching rating for doctor ID:', doctorId);
      const response = await fetch(`http://localhost:8080/reviews/doctor/${doctorId}/rating`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Rating API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Rating API data:', data);
        if (data.status === 'success') {
          // Handle null/undefined values properly - convert to numbers
          const avgRating = (data.averageRating !== null && data.averageRating !== undefined) ? Number(data.averageRating) : 0;
          const totalRev = (data.totalReviews !== null && data.totalReviews !== undefined) ? Number(data.totalReviews) : 0;
          console.log('Setting averageRating to:', avgRating, 'totalReviews:', totalRev);
          setAverageRating(avgRating);
          setTotalReviews(totalRev);
          
          // Debug: Log if we're getting 0 when reviews exist
          if (totalRev === 0 && avgRating === 0) {
            console.warn('Warning: Got 0 reviews and 0 rating. Check if reviews exist in database for doctor ID:', doctorId);
          }
        } else {
          console.log('API returned error status:', data.status);
          setAverageRating(0);
          setTotalReviews(0);
        }
      } else {
        const errorText = await response.text();
        console.error('Rating API error response:', errorText);
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
      setAverageRating(0);
      setTotalReviews(0);
    }
  };

  // Fetch doctor's posts
  // Updated to handle paginated response format
  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:8080/posts/feed?page=0&size=20', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
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
        // Filter posts to show only current doctor's posts
        const doctorPosts = postsData.filter((post: any) => post.doctorId === doctorData?.id);
        setPosts(doctorPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDoctorData();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (doctorData?.id) {
      fetchPosts();
    }
  }, [doctorData?.id]);

  const handleEdit = () => {
    setEditing(true);
    setEditData(doctorData || {});
    console.log('Edit mode activated, editData set to:', doctorData);
  };

  const handleSave = async () => {
    try {
      // Exclude availability fields - they should only be managed from the Schedule page
      const { availableDays, availableTimeStart, availableTimeEnd, ...profileData } = editData;
      
      console.log('Saving profile with editData:', {
        ...profileData,
        profilePicture: profileData.profilePicture ? 'base64 data present' : 'no data',
        bannerPicture: profileData.bannerPicture ? 'base64 data present' : 'no data',
      });

      const response = await fetch('http://localhost:8080/healthprovider/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Save response:', {
          ...data,
          data: {
            ...data.data,
            profilePicture: data.data?.profilePicture ? 'base64 data present' : 'no data',
            bannerPicture: data.data?.bannerPicture ? 'base64 data present' : 'no data',
          }
        });
        
        if (data.status === 'success') {
          setDoctorData(data.data);
          setEditData(data.data);
          setEditing(false);
          setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
        }
      } else {
        const errorText = await response.text();
        console.error('Save failed with status:', response.status, errorText);
        setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'Image size should be less than 5MB', severity: 'error' });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: 'Please select an image file', severity: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        console.log('Profile picture loaded, base64 length:', base64String.length);
        setEditData(prev => {
          const updated = { ...prev, profilePicture: base64String };
          console.log('Updated editData with profile picture');
          return updated;
        });
        setDoctorData(prev => {
          const updated = prev ? { ...prev, profilePicture: base64String } : prev;
          console.log('Updated doctorData with profile picture');
          return updated;
        });
        setSnackbar({ open: true, message: 'Profile picture updated. Click Save to persist changes.', severity: 'info' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerPictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'Image size should be less than 5MB', severity: 'error' });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: 'Please select an image file', severity: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditData(prev => ({ ...prev, bannerPicture: base64String }));
        setDoctorData(prev => prev ? { ...prev, bannerPicture: base64String } : prev);
        setSnackbar({ open: true, message: 'Banner picture updated. Click Save to persist changes.', severity: 'info' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditData(doctorData || {});
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // For now, we'll just use a placeholder URL
      // In a real app, you'd upload to a cloud service like AWS S3
      const imageUrl = URL.createObjectURL(file);
      setEditData({ ...editData, profilePicture: imageUrl });
      setSnackbar({ open: true, message: 'Profile picture updated', severity: 'success' });
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({ open: true, message: 'Failed to upload image', severity: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };


  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      // Note: This endpoint needs to be implemented in the backend
      const response = await fetch(`http://localhost:8080/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId));
        setSnackbar({ open: true, message: 'Post deleted successfully', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to delete post', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setSnackbar({ open: true, message: 'Failed to delete post', severity: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDateLong = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatWorkingHours = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 'Not specified';
    return `${startTime} - ${endTime}`;
  };


  const calculateYearsOfExperience = (workExperiences?: WorkExperience[]) => {
    if (!workExperiences || workExperiences.length === 0) return 0;
    
    let totalYears = 0;
    workExperiences.forEach(work => {
      const start = new Date(work.startDate);
      const end = work.stillWorking ? new Date() : new Date(work.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      totalYears += diffYears;
    });
    
    return Math.round(totalYears);
  };

  const handleLike = async (postId: number) => {
    const currentPost = posts.find(p => p.id === postId);
    const isCurrentlyLiked = currentPost?.isLiked || false;
    
    setAnimatingPosts(prev => new Set(prev).add(postId));
    
    // Optimistic update
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1,
              isLiked: !isCurrentlyLiked
            }
          : post
      )
    );

    try {
      const response = await fetch(`http://localhost:8080/posts/like/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Like response:', data);
        console.log('Backend says isLiked:', data.isLiked);
        
        if (data.status === 'success') {
          // Don't refresh posts - optimistic update is enough
          // This prevents scroll jumping
          setSnackbar({ 
            open: true, 
            message: data.isLiked ? 'Post liked!' : 'Like removed!', 
            severity: 'success' 
          });
        } else {
          // Revert changes on backend failure
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === postId 
                ? { 
                    ...post, 
                    likes: isCurrentlyLiked ? post.likes : post.likes - 1,
                    isLiked: isCurrentlyLiked
                  }
                : post
            )
          );
        }
      }
    } catch (err) {
      console.error('Error liking post:', err);
      // Revert to original state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes: isCurrentlyLiked ? post.likes : post.likes - 1,
                isLiked: isCurrentlyLiked
              }
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

  const handleOpenComments = async (post: Post) => {
    setSelectedPost(post);
    setCommentDialogOpen(true);
    
    try {
      const response = await fetch(`http://localhost:8080/posts/comments/${post.id}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim()) return;

    try {
      setCommentLoading(true);
      const response = await fetch('http://localhost:8080/posts/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          postId: selectedPost.id,
          commenterId: user?.id,
          commentText: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setNewComment('');
          const commentsResponse = await fetch(`http://localhost:8080/posts/comments/${selectedPost.id}`, {
            headers: {
              'Authorization': `Bearer ${user?.token}`,
            },
          });
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            setComments(commentsData);
          }
          await fetchPosts();
        }
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleShare = async (post: Post) => {
    try {
      const postUrl = `${window.location.origin}/post/${post.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Medical Post by ${post.doctorName}`,
          text: post.content.substring(0, 100) + '...',
          url: postUrl,
        });
        setSnackbar({ open: true, message: 'Post shared successfully!', severity: 'success' });
      } else {
        await navigator.clipboard.writeText(postUrl);
        setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
      }
    } catch (err) {
      console.error('Error sharing post:', err);
      const postUrl = `${window.location.origin}/post/${post.id}`;
      setSnackbar({ open: true, message: `Share this link: ${postUrl}`, severity: 'info' });
    }
  };

  const handleLikeComment = async (commentId: number) => {
    const currentComment = comments.find(c => c.id === commentId);
    const isCurrentlyLiked = currentComment?.isLiked || false;
    
    setAnimatingComments(prev => new Set(prev).add(commentId));
    
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes: isCurrentlyLiked ? comment.likes - 1 : comment.likes + 1, isLiked: !isCurrentlyLiked }
          : comment
      )
    );

    try {
      const response = await fetch(`http://localhost:8080/posts/comment/like/${commentId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      if (response.ok && selectedPost) {
        await handleOpenComments(selectedPost);
      }
    } catch (err) {
      console.error('Error liking comment:', err);
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

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    if (!user?.token) {
      setSnackbar({ open: true, message: 'Please sign in to delete comments.', severity: 'error' });
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/posts/comment/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` },
      });

      if (response.ok) {
        // Remove comment from the list
        setComments(prevComments => prevComments.filter(c => c.id !== commentId));
        
        // Update post comment count locally
        if (selectedPost) {
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === selectedPost.id 
                ? { ...post, comments: Math.max(0, post.comments - 1) }
                : post
            )
          );
        }
        
        setSnackbar({ open: true, message: 'Comment deleted successfully!', severity: 'success' });
      } else {
        const data = await response.json().catch(() => ({ message: 'Failed to delete comment' }));
        setSnackbar({ open: true, message: data.message || 'Failed to delete comment', severity: 'error' });
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setSnackbar({ open: true, message: 'Failed to delete comment. Please try again.', severity: 'error' });
    }
  };

  const handleReplyToComment = async (commentId: number) => {
    if (!replyText.trim()) return;

    try {
      const response = await fetch('http://localhost:8080/posts/comment/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ commentId, replyText: replyText.trim() }),
      });
      if (response.ok && selectedPost) {
        setReplyText('');
        setReplyingTo(null);
        await handleOpenComments(selectedPost);
        setSnackbar({ open: true, message: 'Reply added!', severity: 'success' });
      }
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleLikeReply = async (replyId: number, commentId: number) => {
    setAnimatingReplies(prev => new Set(prev).add(replyId));
    
    setComments(prevComments => 
      prevComments.map(comment => {
        if (comment.id === commentId && comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === replyId ? { ...reply, likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1, isLiked: !reply.isLiked } : reply
            )
          };
        }
        return comment;
      })
    );

    try {
      const response = await fetch(`http://localhost:8080/posts/reply/like/${replyId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` },
      });
      if (response.ok && selectedPost) await handleOpenComments(selectedPost);
    } catch (err) {
      console.error('Error liking reply:', err);
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

  const handleDeleteReply = async (replyId: number, commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    if (!user?.token) {
      setSnackbar({ open: true, message: 'Please sign in to delete replies.', severity: 'error' });
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/posts/reply/${replyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` },
      });

      if (response.ok) {
        // Remove reply from the comment's replies list
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === commentId && comment.replies) {
              return {
                ...comment,
                replies: comment.replies.filter(reply => reply.id !== replyId),
                replyCount: Math.max(0, comment.replyCount - 1)
              };
            }
            return comment;
          })
        );
        
        setSnackbar({ open: true, message: 'Reply deleted successfully!', severity: 'success' });
      } else {
        const data = await response.json().catch(() => ({ message: 'Failed to delete reply' }));
        setSnackbar({ open: true, message: data.message || 'Failed to delete reply', severity: 'error' });
      }
    } catch (err) {
      console.error('Error deleting reply:', err);
      setSnackbar({ open: true, message: 'Failed to delete reply. Please try again.', severity: 'error' });
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

  const handleViewLikers = async (postId: number) => {
    setLikersDialogOpen(true);
    setLoadingLikers(true);
    
    try {
      const response = await fetch(`http://localhost:8080/posts/${postId}/likers`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikers(data);
      } else {
        setLikers([]);
      }
    } catch (err) {
      console.error('Error fetching likers:', err);
      setLikers([]);
    } finally {
      setLoadingLikers(false);
    }
  };

  const handleViewCommentLikers = async (commentId: number) => {
    setLikersDialogOpen(true);
    setLoadingLikers(true);
    
    try {
      const response = await fetch(`http://localhost:8080/posts/comment/${commentId}/likers`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikers(data);
      } else {
        setLikers([]);
      }
    } catch (err) {
      console.error('Error fetching comment likers:', err);
      setLikers([]);
    } finally {
      setLoadingLikers(false);
    }
  };

  const handleViewReplyLikers = async (replyId: number) => {
    setLikersDialogOpen(true);
    setLoadingLikers(true);
    
    try {
      const response = await fetch(`http://localhost:8080/posts/reply/${replyId}/likers`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikers(data);
      } else {
        setLikers([]);
      }
    } catch (err) {
      console.error('Error fetching reply likers:', err);
      setLikers([]);
    } finally {
      setLoadingLikers(false);
    }
  };

  if (loading) {
    return (
      <DoctorLayout title="Public Profile" subtitle="Manage your public profile and posts">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout title="Public Profile" subtitle="Manage your public profile and posts">
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
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
            {/* Banner Upload Button */}
            {editing && (
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'white' },
                }}
                component="label"
              >
                <PhotoCameraIcon />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleBannerPictureChange}
                />
              </IconButton>
            )}
            <Box sx={{
              position: 'absolute',
              bottom: -75,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={editing ? editData.profilePicture : doctorData?.profilePicture}
                  sx={{ 
                    width: 150, 
                    height: 150,
                    border: '4px solid white',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    fontSize: '3rem'
                  }}
                >
                  {(!(editing ? editData.profilePicture : doctorData?.profilePicture) && (editing ? editData : doctorData)) && 
                    `${(editing ? editData.firstName : doctorData?.firstName)?.[0] || ''}${(editing ? editData.lastName : doctorData?.lastName)?.[0] || ''}`.toUpperCase()
                  }
                </Avatar>
                {editing && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 5,
                      right: 5,
                      backgroundColor: 'white',
                      color: 'primary.main',
                      width: 36,
                      height: 36,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      '&:hover': { backgroundColor: 'grey.100' },
                    }}
                    component="label"
                  >
                    <PhotoCameraIcon sx={{ fontSize: 20 }} />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleProfilePictureChange}
                    />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>

          {/* Profile Info Section */}
          <Box sx={{ pt: 8, pb: 3, px: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
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
                    fontWeight: 500
                  }} 
                />
              ))}
            </Box>

            {/* Bio */}
            {doctorData?.bio && (
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
                {doctorData.bio}
              </Typography>
            )}

          {/* Key Info Cards */}
          <Grid container spacing={2} sx={{ mb: 3, maxWidth: 800, mx: 'auto' }}>
            <Grid item xs={12} sm={2.4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: 'primary.50',
                border: '1px solid',
                borderColor: 'primary.100'
              }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  {calculateYearsOfExperience(doctorData?.workExperiences)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Years Experience
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={2.4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: 'success.50',
                border: '1px solid',
                borderColor: 'success.100'
              }}>
                <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
                  {doctorData?.specializations?.length || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Specializations
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={2.4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: 'warning.50',
                border: '1px solid',
                borderColor: 'warning.100'
              }}>
                <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 600 }}>
                  {doctorData?.consultationFee ? `$${doctorData.consultationFee}` : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Consultation Fee
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={2.4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: 'info.50',
                border: '1px solid',
                borderColor: 'info.100'
              }}>
                <Typography variant="h6" sx={{ color: 'info.main', fontWeight: 600 }}>
                  {doctorData?.availableDays?.length || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Available Days
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={2.4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: 'warning.50',
                border: '1px solid',
                borderColor: 'warning.100'
              }}>
                <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 600 }}>
                  {totalReviews > 0 ? averageRating.toFixed(1) : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {totalReviews > 0 ? `Rating (${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})` : 'No Reviews Yet'}
                </Typography>
              </Box>
            </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {!editing ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    sx={{ 
                      borderRadius: 3,
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      textTransform: 'none'
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CalendarIcon />}
                    disabled
                    sx={{ 
                      borderRadius: 3,
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      textTransform: 'none',
                      cursor: 'not-allowed',
                    }}
                  >
                    Book Appointment
                  </Button>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: 600, textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: 600, textTransform: 'none' }}
                  >
                    Save Changes
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Edit Form */}
        {editing && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <EditIcon sx={{ mr: 1, color: 'primary.main' }} />
                Edit Profile Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={editData.firstName || ''}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={editData.lastName || ''}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={3}
                    value={editData.bio || ''}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={editData.phoneNumber || ''}
                    onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={editData.address || ''}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={editData.city || ''}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={editData.country || ''}
                    onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Clinic Name"
                    value={editData.clinicName || ''}
                    onChange={(e) => setEditData({ ...editData, clinicName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="License Number"
                    value={editData.licenseNumber || ''}
                    onChange={(e) => setEditData({ ...editData, licenseNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Consultation Fee"
                    type="number"
                    value={editData.consultationFee || ''}
                    onChange={(e) => setEditData({ ...editData, consultationFee: parseFloat(e.target.value) || 0 })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    To manage your schedule, availability, and appointment duration, please use the <strong>Schedule</strong> page from the sidebar menu.
                  </Alert>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column - Professional Info */}
          <Grid item xs={12} lg={8}>
            {/* Contact & Availability */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                Contact Information
              </Typography>
              
              <Grid container spacing={3}>
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
              <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                  Clinic Information
                </Typography>
                
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  backgroundColor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  mb: 1.5
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HospitalIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 20 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {doctorData.clinicName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        License: {doctorData.licenseNumber || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Compact Information Grid */}
                <Grid container spacing={1.5}>
                  {/* Available Days */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary', fontSize: '0.875rem' }}>
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
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              ));
                            }
                            return <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>No available days</Typography>;
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
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            ));
                          }
                          return <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>Not specified</Typography>;
                        })()}
                      </Box>
                    </Box>
                  </Grid>
                  
                  {/* Working Hours */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary', fontSize: '0.875rem' }}>
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
                              return <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>{formatWorkingHours(enabledDays[0].startTime, enabledDays[0].endTime)}</Typography>;
                            } else {
                              // Different hours per day - show compact schedule
                              return (
                                <Box>
                                  {enabledDays.slice(0, 3).map((av: DayAvailabilityData, index: number) => (
                                    <Typography key={index} variant="body2" sx={{ fontSize: '0.75rem', mb: 0.25 }}>
                                      {av.dayOfWeek.substring(0, 3)}: {formatWorkingHours(av.startTime, av.endTime)}
                                    </Typography>
                                  ))}
                                  {enabledDays.length > 3 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      +{enabledDays.length - 3} more
                                    </Typography>
                                  )}
                                </Box>
                              );
                            }
                          }
                        }
                        // Fallback to old system
                        return <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>{formatWorkingHours(doctorData?.availableTimeStart, doctorData?.availableTimeEnd)}</Typography>;
                      })()}
                    </Box>
                  </Grid>

                  {/* Location */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary', fontSize: '0.875rem' }}>
                        Location
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        {doctorData?.address ? 
                          `${doctorData.city || ''}${doctorData.country ? `, ${doctorData.country}` : ''}` 
                          : 'Not provided'
                        }
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Accepted Insurances */}
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary', fontSize: '0.875rem' }}>
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
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>None specified</Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

          </Grid>

          {/* Right Column - Quick Info */}
          <Grid item xs={12} lg={4}>
            {/* Professional Summary Card */}
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

        {/* Posts Section - Main Content */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PostAddIcon sx={{ mr: 1, color: 'primary.main' }} />
                My Posts
              </Typography>
              <Button
                variant="contained"
                startIcon={<PostAddIcon />}
                onClick={() => setCreatePostOpen(true)}
              >
                Create Post
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {posts.length === 0 ? (
              <Alert severity="info">
                You haven't created any posts yet. Create your first post to share with the medical community!
              </Alert>
            ) : (
              <Box>
                {posts.map((post) => (
                  <Card key={post.id} sx={{ mb: 3, borderRadius: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                      {/* Doctor Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          src={doctorData?.profilePicture || undefined}
                          sx={{ bgcolor: 'primary.main', mr: 2, width: 48, height: 48 }}
                        >
                          {(!doctorData?.profilePicture && doctorData) && 
                            getInitials(`${doctorData.firstName || ''} ${doctorData.lastName || ''}`)
                          }
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
                        <IconButton
                          color="error"
                          onClick={() => handleDeletePost(post.id)}
                          size="small"
                          title="Delete post"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      {/* Post Content */}
                      <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                        {post.content}
                      </Typography>

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
                                    Image failed to load
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {currentIndex + 1} / {mediaUrls.length}
                                  </Typography>
                                </Box>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          onClick={() => handleLike(post.id)}
                          color={post.isLiked ? 'error' : 'default'}
                          size="small"
                          sx={{
                            position: 'relative',
                            animation: animatingPosts.has(post.id) ? `${heartPulse} 0.6s ease-in-out` : 'none',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: post.isLiked ? 'rgba(244, 67, 54, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                              transform: 'scale(1.1)',
                            },
                            '& .MuiSvgIcon-root': {
                              animation: post.isLiked && animatingPosts.has(post.id) ? `${heartFill} 0.6s ease-in-out` : 'none',
                              transition: 'all 0.3s ease',
                            }
                          }}
                        >
                          {post.isLiked ? (
                            <Favorite 
                              sx={{ 
                                color: '#f44336',
                                filter: 'drop-shadow(0 2px 4px rgba(244, 67, 54, 0.3))'
                              }} 
                            />
                          ) : (
                            <FavoriteBorder />
                          )}
                        </IconButton>
                        <Typography 
                          variant="body2" 
                          color={post.isLiked ? 'error.main' : 'text.secondary'}
                          onClick={() => post.likes > 0 && handleViewLikers(post.id)}
                          sx={{ 
                            mr: 2,
                            fontWeight: post.isLiked ? 600 : 400,
                            animation: animatingPosts.has(post.id) ? `${numberBounce} 0.6s ease-in-out` : 'none',
                            transition: 'all 0.3s ease',
                            cursor: post.likes > 0 ? 'pointer' : 'default',
                            '&:hover': post.likes > 0 ? {
                              textDecoration: 'underline',
                            } : {},
                          }}
                        >
                          {post.likes}
                        </Typography>
                      </Box>

                      <IconButton
                        onClick={() => handleOpenComments(post)}
                        size="small"
                      >
                        <CommentIcon />
                      </IconButton>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        {post.comments}
                      </Typography>

                      <IconButton 
                        size="small"
                        onClick={() => handleShare(post)}
                        title="Share post"
                      >
                        <ShareIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Box>

      {/* Create Post Dialog */}
      <CreatePost
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={() => {
          fetchPosts();
          setSnackbar({ open: true, message: 'Post created successfully!', severity: 'success' });
        }}
      />

      {/* Comments Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Comments
          <IconButton
            onClick={() => setCommentDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Add Comment */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleAddComment}
              disabled={!newComment.trim() || commentLoading}
              startIcon={commentLoading ? <CircularProgress size={16} /> : <Send />}
            >
              Send
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Comments List */}
          {comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No comments yet
            </Typography>
          ) : (
            <List sx={{ py: 0 }}>
              {comments.map((comment) => (
                <Box key={comment.id}>
                  <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
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
                        <Typography variant="subtitle2" fontWeight="bold">
                          {comment.commenterName}
                        </Typography>
                        <Chip
                          label={comment.commenterSpecialty}
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ height: 20 }}
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
                          sx={{ padding: 0.5, animation: animatingComments.has(comment.id) ? `${heartPulse} 0.6s ease-in-out` : 'none' }}
                        >
                          {comment.isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                        </IconButton>
                        <Typography 
                          variant="caption" 
                          color={comment.isLiked ? 'error.main' : 'text.secondary'}
                          onClick={() => comment.likes > 0 && handleViewCommentLikers(comment.id)}
                          sx={{ 
                            fontWeight: comment.isLiked ? 600 : 400, 
                            animation: animatingComments.has(comment.id) ? `${numberBounce} 0.6s ease-in-out` : 'none',
                            cursor: comment.likes > 0 ? 'pointer' : 'default',
                            '&:hover': comment.likes > 0 ? {
                              textDecoration: 'underline',
                            } : {},
                          }}
                        >
                          {comment.likes}
                        </Typography>

                        <Button size="small" startIcon={<ReplyIcon />} onClick={() => setReplyingTo(comment.id)} sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}>
                          Reply
                        </Button>

                        {comment.commenterId === user?.id && (
                          <IconButton size="small" onClick={() => handleDeleteComment(comment.id)} color="error" sx={{ padding: 0.5 }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}

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
                          <TextField fullWidth placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} variant="outlined" size="small" autoFocus />
                          <Button variant="contained" size="small" onClick={() => handleReplyToComment(comment.id)} disabled={!replyText.trim()}>Reply</Button>
                          <Button variant="outlined" size="small" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</Button>
                        </Box>
                      )}

                      {/* Nested Replies */}
                      {expandedComments.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                        <Box sx={{ ml: 4, mt: 2, borderLeft: '2px solid #e0e0e0', pl: 2 }}>
                          {comment.replies.map((reply) => (
                            <Box key={reply.id} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Avatar 
                                  src={reply.replierProfilePicture}
                                  sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}
                                >
                                  {!reply.replierProfilePicture && getInitials(reply.replierName)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="caption" fontWeight="bold">{reply.replierName}</Typography>
                                    <Chip label={reply.replierSpecialty} size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{formatDate(reply.createdAt)}</Typography>
                                  </Box>
                                  
                                  <Typography variant="body2" fontSize="0.875rem" sx={{ mb: 0.5 }}>{reply.content}</Typography>

                                  {/* Reply Actions */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <IconButton size="small" onClick={() => handleLikeReply(reply.id, comment.id)} color={reply.isLiked ? 'error' : 'default'} sx={{ padding: 0.3, animation: animatingReplies.has(reply.id) ? `${heartPulse} 0.6s ease-in-out` : 'none' }}>
                                      {reply.isLiked ? <Favorite sx={{ fontSize: 16 }} /> : <FavoriteBorder sx={{ fontSize: 16 }} />}
                                    </IconButton>
                                    <Typography 
                                      variant="caption" 
                                      color={reply.isLiked ? 'error.main' : 'text.secondary'} 
                                      onClick={() => reply.likes > 0 && handleViewReplyLikers(reply.id)}
                                      sx={{ 
                                        fontWeight: reply.isLiked ? 600 : 400, 
                                        animation: animatingReplies.has(reply.id) ? `${numberBounce} 0.6s ease-in-out` : 'none',
                                        cursor: reply.likes > 0 ? 'pointer' : 'default',
                                        '&:hover': reply.likes > 0 ? {
                                          textDecoration: 'underline',
                                        } : {},
                                      }}
                                    >
                                      {reply.likes}
                                    </Typography>

                                    {reply.replierId === user?.id && (
                                      <IconButton size="small" onClick={() => handleDeleteReply(reply.id, comment.id)} color="error" sx={{ padding: 0.3, ml: 1 }}>
                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Likers Dialog */}
      <Dialog
        open={likersDialogOpen}
        onClose={() => setLikersDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Liked by
          <IconButton
            onClick={() => setLikersDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loadingLikers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : likers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No likes yet
            </Typography>
          ) : (
            <List sx={{ py: 0 }}>
              {likers.map((liker) => {
                const getInitials = (name: string) => {
                  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                };
                
                return (
                  <ListItem key={liker.userId} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar 
                        src={liker.profilePicture || undefined}
                        onError={(e) => {
                          // Hide the image if it fails to load, show initials instead
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                        sx={{ 
                          bgcolor: liker.userType === 'doctor' ? 'primary.main' : 'secondary.main',
                          width: 48,
                          height: 48,
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {getInitials(liker.name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {liker.name}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={liker.specialty}
                            size="small"
                            variant="outlined"
                            color={liker.userType === 'doctor' ? 'primary' : 'secondary'}
                            sx={{ height: 18 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DoctorLayout>
  );
};

export default DoctorPublicProfile;
