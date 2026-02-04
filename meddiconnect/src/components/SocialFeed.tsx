import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Avatar,
  IconButton,
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { keyframes } from '@mui/system';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  Add,
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
import DoctorNameLink from './DoctorNameLink';

// Heart animation keyframes
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

interface Post {
  id: number;
  doctorName: string;
  doctorSpecialty: string;
  doctorId: number;
  doctorProfilePicture?: string;
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

interface SocialFeedProps {
  onCreatePost?: () => void; // Only used by doctors
  refreshTrigger?: number; // When this changes, refresh posts
}

const SocialFeed: React.FC<SocialFeedProps> = ({ onCreatePost, refreshTrigger }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [animatingPosts, setAnimatingPosts] = useState<Set<number>>(new Set());
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [animatingComments, setAnimatingComments] = useState<Set<number>>(new Set());
  const [animatingReplies, setAnimatingReplies] = useState<Set<number>>(new Set());
  const [likersDialogOpen, setLikersDialogOpen] = useState(false);
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [expandedImageIndex, setExpandedImageIndex] = useState(0);
  const [expandedImageList, setExpandedImageList] = useState<string[]>([]);
  const [postMediaIndices, setPostMediaIndices] = useState<Map<number, number>>(new Map());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set()); // Track failed image URLs
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState<string>('INAPPROPRIATE_CONTENT');
  const [reportOtherReason, setReportOtherReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

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

  // Helper function to check if URL is a PDF
  const isPdfUrl = (url: string): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.pdf') || lowerUrl.includes('/raw/upload/');
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

  // Mock posts data
  const mockPosts: Post[] = [
    {
      id: 1,
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'Cardiology',
      doctorId: 1,
      content: 'Important reminder: Regular check-ups are essential for maintaining good health. Schedule your annual physical today! Remember to stay hydrated and maintain a balanced diet.',
      likes: 12,
      comments: 3,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isLiked: false,
    },
    {
      id: 2,
      doctorName: 'Dr. Michael Chen',
      doctorSpecialty: 'General Practice',
      doctorId: 2,
      content: 'New research shows that 30 minutes of daily exercise can significantly reduce the risk of heart disease. Stay active, stay healthy! Even a simple walk can make a difference.',
      likes: 8,
      comments: 5,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      isLiked: false,
    },
    {
      id: 3,
      doctorName: 'Dr. Emily Rodriguez',
      doctorSpecialty: 'Psychiatry',
      doctorId: 3,
      content: 'Mental health is just as important as physical health. If you\'re feeling overwhelmed, don\'t hesitate to reach out to a mental health professional. Your well-being matters.',
      likes: 15,
      comments: 7,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      isLiked: false,
    },
    {
      id: 4,
      doctorName: 'Dr. James Wilson',
      doctorSpecialty: 'Pediatrics',
      doctorId: 4,
      content: 'Winter is here! Make sure to get your flu vaccine and maintain good hygiene practices to stay healthy during the cold season.',
      likes: 6,
      comments: 2,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      isLiked: false,
    },
    {
      id: 5,
      doctorName: 'Dr. Lisa Thompson',
      doctorSpecialty: 'Internal Medicine',
      doctorId: 5,
      content: 'Sleep is crucial for your immune system. Aim for 7-9 hours of quality sleep each night. Your body will thank you!',
      likes: 10,
      comments: 4,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      isLiked: false,
    },
  ];

  const reportReasonOptions = [
    { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
    { value: 'MISINFORMATION', label: 'Misinformation' },
    { value: 'HARASSMENT_OR_ABUSE', label: 'Harassment or abuse' },
    { value: 'SPAM_OR_SCAM', label: 'Spam or scam' },
    { value: 'PRIVACY_CONCERN', label: 'Privacy concern' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Fetch posts from backend with pagination support
  const fetchPosts = async (page: number = 0, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Fetch with pagination parameters
      const response = await fetch(`http://localhost:8080/posts/feed?page=${page}&size=20`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Fetched posts response:', responseData);
        
        // Handle paginated response format: { data: [...], totalElements, hasNext, ... }
        // Or backward compatible format: array of posts
        let postsData: Post[] = [];
        let hasNextPage = false;
        
        if (Array.isArray(responseData)) {
          // Backward compatible: direct array response
          postsData = responseData;
          hasNextPage = false; // Can't determine if there's more
        } else if (responseData.data && Array.isArray(responseData.data)) {
          // New paginated format
          postsData = responseData.data;
          hasNextPage = responseData.hasNext || false;
        }
        
        if (postsData && postsData.length > 0) {
          if (append) {
            // Append new posts to existing ones
            setPosts(prevPosts => [...prevPosts, ...postsData]);
          } else {
            // Replace all posts (initial load or refresh)
            setPosts(postsData);
          }
          
          setHasMore(hasNextPage);
          setCurrentPage(page);
          
          // Sync liked posts state with backend for animation tracking
          const likedPostIds = new Set<number>();
          postsData.forEach((post: Post) => {
            if (post.isLiked) {
              likedPostIds.add(post.id);
            }
          });
          // Merge liked posts from new data with existing liked posts
          setLikedPosts(prev => {
            const newSet = new Set(prev);
            likedPostIds.forEach(id => newSet.add(id));
            return newSet;
          });
        } else {
          // If no posts from backend, use mock data only on initial load
          if (!append) {
            console.log('No posts from backend, using mock data');
            setPosts(mockPosts);
            setHasMore(false);
          } else {
            setHasMore(false);
          }
        }
      } else {
        // If backend fails, use mock data only on initial load
        if (!append) {
          console.log('Backend unavailable, using mock data');
          setPosts(mockPosts);
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      // If there's an error, use mock data only on initial load
      if (!append) {
        console.log('Using mock data due to error');
        setPosts(mockPosts);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  // Load more posts (next page)
  const loadMorePosts = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(currentPage + 1, true);
    }
  };

  // Refresh posts when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      // Reset to first page and fetch fresh posts
      setCurrentPage(0);
      fetchPosts(0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  useEffect(() => {
    // Prevent scroll reset if we're coming from a notification
    const preventScrollReset = sessionStorage.getItem('preventScrollReset');
    if (preventScrollReset === 'true') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      // Prevent any scroll to top on mount
      window.scrollTo(0, 0);
    }
    
    fetchPosts();
    
    // Refresh posts when window gains focus (user switches back to tab)
    const handleFocus = () => {
      console.log('Window focused, refreshing posts...');
      fetchPosts();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.token]); // Re-fetch when user changes or logs in/out

  // Handle scrolling to post after navigation (when coming from notification)
  useEffect(() => {
    const scrollToPostId = sessionStorage.getItem('scrollToPostId');
    const notificationType = sessionStorage.getItem('scrollToPostType');
    const preventScrollReset = sessionStorage.getItem('preventScrollReset');
    
    if (scrollToPostId && posts.length > 0 && preventScrollReset === 'true') {
      const postId = parseInt(scrollToPostId, 10);
      
      // Prevent scroll reset
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      
      // Immediately prevent scroll to top
      window.scrollTo(0, 0);
      
      // Wait a bit for DOM to be ready, then scroll to the post
      let attempts = 0;
      const maxAttempts = 30;
      
      const tryScrollToPost = () => {
        attempts++;
        const postElement = document.getElementById(`post-${postId}`);
        
        if (postElement) {
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            // Calculate the position of the post element
            const postRect = postElement.getBoundingClientRect();
            const scrollPosition = window.scrollY + postRect.top - (window.innerHeight / 2) + (postRect.height / 2);
            
            // Scroll to the post position
            window.scrollTo({
              top: Math.max(0, scrollPosition),
              behavior: 'smooth'
            });
            
            // If it's a comment/reply notification, open the comments section
            if (notificationType && (notificationType === 'POST_COMMENT' || notificationType === 'COMMENT_REPLY' || notificationType === 'COMMENT_LIKE')) {
              // Wait for scroll to complete, then open comments
              setTimeout(() => {
                // Recalculate position to ensure accuracy based on post element
                const updatedPostRect = postElement.getBoundingClientRect();
                const targetScrollPos = window.scrollY + updatedPostRect.top - (window.innerHeight / 2) + (updatedPostRect.height / 2);
                
                // Ensure we're at the correct position
                window.scrollTo(0, Math.max(0, targetScrollPos));
                
                const commentButton = postElement.querySelector('[data-comment-button]') as HTMLElement;
                if (commentButton) {
                  // Store the target scroll position
                  const finalScrollPosition = Math.max(0, targetScrollPos);
                  
                  // Click the button to open comments
                  commentButton.click();
                  
                  // Aggressively maintain scroll position after dialog opens
                  const maintainScroll = () => {
                    window.scrollTo(0, finalScrollPosition);
                  };
                  
                  setTimeout(maintainScroll, 0);
                  setTimeout(maintainScroll, 50);
                  setTimeout(maintainScroll, 100);
                  setTimeout(maintainScroll, 200);
                  setTimeout(maintainScroll, 300);
                  setTimeout(maintainScroll, 500);
                  setTimeout(maintainScroll, 700);
                  setTimeout(maintainScroll, 1000);
                }
              }, 1000);
            }
            
            // Highlight the post
            postElement.style.boxShadow = '0 0 20px rgba(33, 150, 243, 0.5)';
            postElement.style.transition = 'box-shadow 0.3s ease-in-out';
            
            setTimeout(() => {
              postElement.style.boxShadow = '';
            }, 2000);
            
            // Clean up sessionStorage
            sessionStorage.removeItem('scrollToPostId');
            sessionStorage.removeItem('scrollToPostType');
            sessionStorage.removeItem('preventScrollReset');
            
            // Restore scroll restoration
            if ('scrollRestoration' in window.history) {
              window.history.scrollRestoration = 'auto';
            }
          });
        } else if (attempts < maxAttempts) {
          // Post not found yet, try again
          setTimeout(tryScrollToPost, 100);
        } else {
          // Clean up sessionStorage if post not found
          sessionStorage.removeItem('scrollToPostId');
          sessionStorage.removeItem('scrollToPostType');
          sessionStorage.removeItem('preventScrollReset');
          
          // Restore scroll restoration
          if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'auto';
          }
        }
      };
      
      // Start trying after a delay to allow page to render
      setTimeout(tryScrollToPost, 500);
    }
  }, [posts]); // Re-run when posts are loaded

  const handleLike = async (postId: number, event?: React.MouseEvent) => {
    // Prevent default behavior and stop propagation to avoid page scrolling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Find the current post to get its actual liked state
    const currentPost = posts.find(p => p.id === postId);
    const isCurrentlyLiked = currentPost?.isLiked || false;
    
    console.log('Liking post:', postId, 'Currently liked:', isCurrentlyLiked);
    
    // Start animation
    setAnimatingPosts(prev => new Set(prev).add(postId));
    
    // Update local state immediately for responsive UI (optimistic update)
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
    
    // Update liked posts set
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

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
          console.error('Failed to like post:', data.message);
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
          setSnackbar({ 
            open: true, 
            message: 'Failed to update like: ' + data.message, 
            severity: 'error' 
          });
        }
      } else {
        console.error('Backend error, status:', response.status);
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
        setSnackbar({ 
          open: true, 
          message: 'Failed to update like. Please try again.', 
          severity: 'error' 
        });
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
      setSnackbar({ 
        open: true, 
        message: 'Network error. Please check your connection.', 
        severity: 'error' 
      });
    } finally {
      // Stop animation after a delay
      setTimeout(() => {
        setAnimatingPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }, 600);
    }
  };

  const handleOpenComments = async (post: Post, event?: React.MouseEvent) => {
    // Prevent default behavior and stop propagation to avoid page scrolling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Store current scroll position before opening dialog
    const scrollPosition = window.scrollY || window.pageYOffset;
    
    // Find the post element to maintain its position
    const postElement = document.getElementById(`post-${post.id}`);
    let targetScrollPosition = scrollPosition;
    
    if (postElement) {
      // Calculate the ideal scroll position to keep the post visible
      const postRect = postElement.getBoundingClientRect();
      targetScrollPosition = window.scrollY + postRect.top - (window.innerHeight / 2) + (postRect.height / 2);
    }
    
    setSelectedPost(post);
    setCommentDialogOpen(true);
    
    // Restore scroll position immediately and multiple times to prevent scroll reset
    const maintainScroll = () => {
      window.scrollTo(0, Math.max(0, targetScrollPosition));
    };
    
    requestAnimationFrame(maintainScroll);
    setTimeout(maintainScroll, 0);
    setTimeout(maintainScroll, 50);
    setTimeout(maintainScroll, 100);
    setTimeout(maintainScroll, 200);
    setTimeout(maintainScroll, 300);
    
    try {
      const response = await fetch(`http://localhost:8080/posts/comments/${post.id}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure commenterId and reply replierIds are numbers for proper comparison
        const normalizedComments = Array.isArray(data) ? data.map((comment: any) => ({
          ...comment,
          commenterId: Number(comment.commenterId),
          replies: comment.replies ? comment.replies.map((reply: any) => ({
            ...reply,
            replierId: Number(reply.replierId)
          })) : []
        })) : [];
        setComments(normalizedComments);
      } else {
        // Set empty array if backend fails
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      // Set empty array if there's an error
      setComments([]);
    }
    
    // Continue maintaining scroll position after state updates
    setTimeout(maintainScroll, 400);
    setTimeout(maintainScroll, 500);
    setTimeout(maintainScroll, 700);
    setTimeout(maintainScroll, 1000);
  };

  const handleAddComment = async (event?: React.FormEvent | React.MouseEvent) => {
    // Prevent default behavior and stop propagation to avoid page scrolling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!selectedPost || !newComment.trim()) return;

    // Store current scroll position
    const scrollPosition = window.scrollY || window.pageYOffset;

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
          // Update comment count locally instead of refreshing all posts
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === selectedPost.id 
                ? { ...post, comments: post.comments + 1 }
                : post
            )
          );
          
          // Restore scroll position after state updates
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPosition);
          });
        } else {
          console.error('Failed to add comment:', data.message);
          // Add comment locally as fallback
          const newCommentObj: Comment = {
            id: Date.now(),
            commenterName: user?.username ? (user.type === 'doctor' ? `Dr. ${user.username}` : user.username) : 'Anonymous',
            commenterSpecialty: user?.type === 'doctor' ? 'General Practice' : 'Patient',
            commenterId: user?.id || 0,
            content: newComment.trim(),
            createdAt: new Date().toISOString(),
            likes: 0,
            isLiked: false,
            replyCount: 0,
            replies: [],
          };
          setComments(prev => [newCommentObj, ...prev]);
          setNewComment('');
          
          // Update post comment count
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === selectedPost.id 
                ? { ...post, comments: post.comments + 1 }
                : post
            )
          );
          
          // Restore scroll position
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPosition);
          });
        }
      } else {
        // If backend fails, add comment to mock data locally
        console.log('Backend unavailable, adding comment locally');
        const newCommentObj: Comment = {
          id: Date.now(),
          commenterName: user?.username ? (user.type === 'doctor' ? `Dr. ${user.username}` : user.username) : 'Anonymous',
          commenterSpecialty: user?.type === 'doctor' ? 'General Practice' : 'Patient',
          commenterId: user?.id || 0,
          content: newComment.trim(),
          createdAt: new Date().toISOString(),
          likes: 0,
          isLiked: false,
          replyCount: 0,
          replies: [],
        };
        setComments(prev => [newCommentObj, ...prev]);
        setNewComment('');
        
        // Update post comment count
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === selectedPost.id 
              ? { ...post, comments: post.comments + 1 }
              : post
          )
        );
        
        // Restore scroll position
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
        });
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      // Add comment to mock data locally if there's an error
      const newCommentObj: Comment = {
        id: Date.now(),
        commenterName: user?.username ? (user.type === 'doctor' ? `Dr. ${user.username}` : user.username) : 'Anonymous',
        commenterSpecialty: user?.type === 'doctor' ? 'General Practice' : 'Patient',
        commenterId: user?.id || 0,
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        replyCount: 0,
        replies: [],
      };
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment('');
      
      // Update post comment count
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === selectedPost.id 
            ? { ...post, comments: post.comments + 1 }
            : post
        )
      );
      
      // Restore scroll position
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    } finally {
      setCommentLoading(false);
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleShare = async (post: Post) => {
    try {
      // Create a shareable link for the post
      const postUrl = `${window.location.origin}/post/${post.id}`;
      
      // Try to use the Web Share API if available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: `Medical Post by ${post.doctorName}`,
          text: post.content.substring(0, 100) + '...',
          url: postUrl,
        });
        setSnackbar({ open: true, message: 'Post shared successfully!', severity: 'success' });
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(postUrl);
        setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
      }
    } catch (err) {
      console.error('Error sharing post:', err);
      // Fallback: show the URL in a toast
      const postUrl = `${window.location.origin}/post/${post.id}`;
      setSnackbar({ open: true, message: `Share this link: ${postUrl}`, severity: 'info' });
    }
  };

  const handleOpenReportDialog = (post: Post) => {
    if (!user?.token) {
      setSnackbar({ open: true, message: 'Please sign in to report posts.', severity: 'info' });
      return;
    }

    if (user.type !== 'doctor' && user.type !== 'patient') {
      setSnackbar({ open: true, message: 'Only patients and doctors can report posts.', severity: 'info' });
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
        setSnackbar({ open: true, message: 'Report submitted. Thank you.', severity: 'success' });
        handleCloseReportDialog();
      } else {
        const message = data?.message || 'Failed to submit report. Please try again.';
        setSnackbar({ open: true, message, severity: 'error' });
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setSnackbar({ open: true, message: 'Unable to submit report. Check your connection.', severity: 'error' });
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number, event?: React.MouseEvent) => {
    // Prevent default behavior and stop propagation to avoid page scrolling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!user?.token) {
      console.error('User not authenticated');
      return;
    }

    const currentComment = comments.find(c => c.id === commentId);
    if (!currentComment) {
      console.error('Comment not found');
      return;
    }

    const isCurrentlyLiked = currentComment.isLiked || false;
    const previousLikes = currentComment.likes;
    
    setAnimatingComments(prev => new Set(prev).add(commentId));
    
    // Optimistic update
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              likes: isCurrentlyLiked ? comment.likes - 1 : comment.likes + 1,
              isLiked: !isCurrentlyLiked
            }
          : comment
      )
    );

    try {
      const response = await fetch(`http://localhost:8080/posts/comment/like/${commentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        // Refresh comments to get accurate like count and state
        if (selectedPost) {
          await handleOpenComments(selectedPost);
        }
      } else {
        // Revert optimistic update on error
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === commentId 
              ? { 
                  ...comment, 
                  likes: previousLikes,
                  isLiked: isCurrentlyLiked
                }
              : comment
          )
        );
        console.error('Failed to like comment:', data.message);
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      // Revert optimistic update on error
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likes: previousLikes,
                isLiked: isCurrentlyLiked
              }
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

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    if (!user?.token) {
      setSnackbar({ open: true, message: 'Please sign in to delete comments.', severity: 'error' });
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/posts/comment/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
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

  const handleDeleteReply = async (replyId: number, commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    if (!user?.token) {
      setSnackbar({ open: true, message: 'Please sign in to delete replies.', severity: 'error' });
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/posts/reply/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
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

  const handleReplyToComment = async (commentId: number) => {
    if (!replyText.trim()) return;

    try {
      const response = await fetch('http://localhost:8080/posts/comment/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          commentId: commentId,
          replyText: replyText.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && selectedPost) {
          setReplyText('');
          setReplyingTo(null);
          await handleOpenComments(selectedPost);
          setSnackbar({ open: true, message: 'Reply added!', severity: 'success' });
        }
      }
    } catch (err) {
      console.error('Error adding reply:', err);
      setSnackbar({ open: true, message: 'Failed to add reply', severity: 'error' });
    }
  };

  const handleLikeReply = async (replyId: number, commentId: number, event?: React.MouseEvent) => {
    // Prevent default behavior and stop propagation to avoid page scrolling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setAnimatingReplies(prev => new Set(prev).add(replyId));
    
    // Find and update the reply optimistically
    setComments(prevComments => 
      prevComments.map(comment => {
        if (comment.id === commentId && comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === replyId
                ? { ...reply, likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1, isLiked: !reply.isLiked }
                : reply
            )
          };
        }
        return comment;
      })
    );

    try {
      const response = await fetch(`http://localhost:8080/posts/reply/like/${replyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (response.ok && selectedPost) {
        await handleOpenComments(selectedPost);
      }
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Create Post Button - Only show for doctors */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Medical Community Feed
        </Typography>
        {user?.type === 'doctor' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreatePost}
            sx={{ borderRadius: 2 }}
          >
            Create Post
          </Button>
        )}
      </Box>

      {/* Posts */}
      {posts.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No posts yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {user?.type === 'doctor' 
                ? 'Be the first to share medical insights with the community!' 
                : 'Check back later for health tips and medical advice from healthcare professionals!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id} id={`post-${post.id}`} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent sx={{ pb: 1 }}>
              {/* Doctor Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={post.doctorProfilePicture || undefined}
                  sx={{ bgcolor: 'primary.main', mr: 2 }}
                >
                  {!post.doctorProfilePicture && getInitials(post.doctorName)}
                </Avatar>
                <Box>
                  <DoctorNameLink
                    doctorId={post.doctorId}
                    doctorName={post.doctorName}
                    variant="subtitle1"
                    fontWeight="bold"
                  />
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
                            {isPdfUrl(currentMedia) ? 'PDF failed to load' : 
                             isVideoUrl(currentMedia) ? 'Video failed to load' : 
                             'Image failed to load'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {currentIndex + 1} / {mediaUrls.length}
                          </Typography>
                        </Box>
                      ) : isPdfUrl(currentMedia) ? (
                        <Box
                          sx={{
                            width: '100%',
                            minHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.100',
                            borderRadius: '8px',
                            p: 2,
                          }}
                        >
                          <Button
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(currentMedia, '_blank');
                            }}
                            sx={{ mb: 2 }}
                          >
                            View PDF
                          </Button>
                          <iframe
                            src={currentMedia}
                            style={{
                              width: '100%',
                              height: '600px',
                              border: 'none',
                              borderRadius: '8px',
                            }}
                            title={`PDF ${currentIndex + 1}`}
                            onError={(e) => {
                              console.error('Failed to load PDF:', currentMedia);
                              setFailedImages(prev => new Set(prev).add(currentMedia));
                            }}
                          />
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  onClick={(e) => handleLike(post.id, e)}
                  color={post.isLiked ? 'error' : 'default'}
                  size="small"
                  type="button"
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
                onClick={(e) => handleOpenComments(post, e)}
                size="small"
                type="button"
                data-comment-button="true"
              >
                <Comment />
              </IconButton>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                {post.comments}
              </Typography>

              <IconButton 
                size="small"
                onClick={() => handleShare(post)}
                title="Share post"
              >
                <Share />
              </IconButton>
              <Box sx={{ flexGrow: 1 }} />
              {(user?.type === 'doctor' || user?.type === 'patient') && (
                <Button
                  size="small"
                  startIcon={<FlagIcon fontSize="small" />}
                  color="warning"
                  onClick={() => handleOpenReportDialog(post)}
                  sx={{ textTransform: 'none' }}
                >
                  Report
                </Button>
              )}
            </CardActions>
          </Card>
        ))
      )}

      {/* Load More Button */}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
          <Button
            variant="outlined"
            onClick={loadMorePosts}
            disabled={loadingMore}
            startIcon={loadingMore ? <CircularProgress size={16} /> : null}
            sx={{ minWidth: 150 }}
          >
            {loadingMore ? 'Loading...' : 'Load More Posts'}
          </Button>
        </Box>
      )}

      {/* Comments Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disableScrollLock={false}
        PaperProps={{
          onMouseDown: (e) => {
            // Prevent scroll when clicking on dialog
            e.stopPropagation();
          }
        }}
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
          <Box 
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddComment(e);
            }}
            sx={{ mb: 2, display: 'flex', gap: 1 }}
          >
            <TextField
              fullWidth
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newComment.trim() && !commentLoading) {
                    handleAddComment(e);
                  }
                }
              }}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={(e) => handleAddComment(e)}
              type="submit"
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
                          onClick={(e) => handleLikeComment(comment.id, e)}
                          color={comment.isLiked ? 'error' : 'default'}
                          type="button"
                          sx={{
                            padding: 0.5,
                            animation: animatingComments.has(comment.id) ? `${heartPulse} 0.6s ease-in-out` : 'none',
                          }}
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

                        <Button
                          size="small"
                          startIcon={<ReplyIcon />}
                          onClick={() => setReplyingTo(comment.id)}
                          sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
                        >
                          Reply
                        </Button>

                        {(() => {
                          // Always log for debugging (you can remove this later)
                          console.log('Delete button check for comment:', {
                            userId: user?.id,
                            commenterId: comment.commenterId,
                            userType: typeof user?.id,
                            commenterType: typeof comment.commenterId,
                            userObject: user,
                            numericMatch: Number(comment.commenterId) === Number(user?.id),
                            stringMatch: String(comment.commenterId) === String(user?.id),
                            canDelete: user?.id && (
                              Number(comment.commenterId) === Number(user.id) ||
                              String(comment.commenterId) === String(user.id)
                            )
                          });
                          
                          const canDelete = user?.id && (
                            Number(comment.commenterId) === Number(user.id) ||
                            String(comment.commenterId) === String(user.id)
                          );
                          if (canDelete) {
                            return (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteComment(comment.id)}
                                color="error"
                                sx={{ 
                                  padding: 0.5,
                                  '&:hover': {
                                    backgroundColor: 'error.light',
                                    color: 'error.contrastText',
                                  }
                                }}
                                title="Delete your comment"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            );
                          }
                          return null;
                        })()}

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
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            variant="outlined"
                            size="small"
                            autoFocus
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleReplyToComment(comment.id)}
                            disabled={!replyText.trim()}
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
                                      sx={{ height: 18, fontSize: '0.65rem' }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      {formatDate(reply.createdAt)}
                                    </Typography>
                                  </Box>
                                  
                                  <Typography variant="body2" fontSize="0.875rem" sx={{ mb: 0.5 }}>
                                    {reply.content}
                                  </Typography>

                                  {/* Reply Actions */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleLikeReply(reply.id, comment.id, e)}
                                      color={reply.isLiked ? 'error' : 'default'}
                                      type="button"
                                      sx={{
                                        padding: 0.3,
                                        animation: animatingReplies.has(reply.id) ? `${heartPulse} 0.6s ease-in-out` : 'none',
                                      }}
                                    >
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

                                    {(() => {
                                      const canDelete = user?.id && (
                                        Number(reply.replierId) === Number(user.id) ||
                                        String(reply.replierId) === String(user.id)
                                      );
                                      if (canDelete) {
                                        return (
                                          <IconButton
                                            size="small"
                                            onClick={() => handleDeleteReply(reply.id, comment.id)}
                                            color="error"
                                            sx={{ 
                                              padding: 0.3, 
                                              ml: 1,
                                              '&:hover': {
                                                backgroundColor: 'error.light',
                                                color: 'error.contrastText',
                                              }
                                            }}
                                            title="Delete your reply"
                                          >
                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                          </IconButton>
                                        );
                                      }
                                      return null;
                                    })()}
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
            Let us know why this post is problematic. Reports are anonymous and help keep the community safe.
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="report-reason-label">Reason</InputLabel>
            <Select
              labelId="report-reason-label"
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
            failedImages.has(expandedImage) ? (
              <Box
                sx={{
                  width: '100%',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  p: 3,
                }}
              >
                <Typography variant="body1" color="white" sx={{ mb: 1 }}>
                  {isPdfUrl(expandedImage) ? 'PDF failed to load' : 
                   isVideoUrl(expandedImage) ? 'Video failed to load' : 
                   'Image failed to load'}
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  {expandedImageIndex + 1} / {expandedImageList.length}
                </Typography>
              </Box>
            ) : isVideoUrl(expandedImage) ? (
              <video
                src={expandedImage}
                controls
                style={{
                  width: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  display: 'block',
                }}
                onError={(e) => {
                  console.error('Failed to load expanded video:', expandedImage);
                  setFailedImages(prev => new Set(prev).add(expandedImage));
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
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
                onError={(e) => {
                  console.error('Failed to load expanded image:', expandedImage);
                  setFailedImages(prev => new Set(prev).add(expandedImage));
                }}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SocialFeed;
