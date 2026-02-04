import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import ReplyIcon from '@mui/icons-material/Reply';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MessageIcon from '@mui/icons-material/Message';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId: number;
  actor: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  post?: {
    id: number;
    content: string;
  };
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user?.token) return;

    try {
      const response = await fetch('http://localhost:8080/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch all notifications
  const fetchNotifications = async () => {
    if (!user?.token) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/notifications', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    if (!user?.token) return;

    try {
      await fetch(`http://localhost:8080/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.token) return;

    try {
      await fetch('http://localhost:8080/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    handleClose();
    
    // Handle chat message notifications - navigate to chat page
    if (notification.type === 'CHAT_MESSAGE') {
      // relatedEntityId contains the channelId
      const channelId = notification.relatedEntityId;
      
      // Navigate to chat page with channel ID to open the specific chat
      if (user?.type === 'doctor') {
        navigate('/doctor-chat', { 
          state: { channelId } 
        });
      } else {
        navigate('/patient-chat', { 
          state: { channelId } 
        });
      }
      return;
    }
    
    // Handle appointment notifications
    const appointmentNotificationTypes = [
      'APPOINTMENT_REQUESTED',
      'APPOINTMENT_CONFIRMED',
      'APPOINTMENT_CANCELLED',
      'APPOINTMENT_RESCHEDULED',
      'APPOINTMENT_RESCHEDULE_CONFIRMED',
      'APPOINTMENT_RESCHEDULE_CANCELLED'
    ];
    
    if (appointmentNotificationTypes.includes(notification.type)) {
      // Navigate to appointments page with appointment ID in state
      // relatedEntityId contains the appointment ID
      const appointmentId = notification.relatedEntityId;
      
      if (user?.type === 'doctor') {
        navigate('/doctor-appointments', { 
          state: { appointmentId } 
        });
      } else {
        navigate('/patient-appointments', { 
          state: { appointmentId } 
        });
      }
      return;
    }
    
    // Navigate to the post without changing pages - stay on current page
    if (notification.post?.id) {
      const postId = notification.post.id;
      
      // First, try to find the post on the current page
      const postElement = document.getElementById(`post-${postId}`);
      
      if (postElement) {
        // Calculate the scroll position to center the post
        const postRect = postElement.getBoundingClientRect();
        const scrollPosition = window.scrollY + postRect.top - (window.innerHeight / 2) + (postRect.height / 2);
        
        // Scroll to the post first
        window.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
        
        // If it's a comment/reply notification, open the comments section
        if (notification.type === 'POST_COMMENT' || notification.type === 'COMMENT_REPLY' || notification.type === 'COMMENT_LIKE') {
          // Wait for scroll to complete, then open comments
          setTimeout(() => {
            // Recalculate position after scroll
            const newPostRect = postElement.getBoundingClientRect();
            const newScrollPosition = window.scrollY + newPostRect.top - (window.innerHeight / 2) + (newPostRect.height / 2);
            
            // Ensure we're at the right position
            window.scrollTo(0, Math.max(0, newScrollPosition));
            
            // Find and click the comment button to open comments
            const commentButton = postElement.querySelector('[data-comment-button]') as HTMLElement;
            if (commentButton) {
              // Store the target scroll position
              const targetScroll = Math.max(0, newScrollPosition);
              
              // Click the button
              commentButton.click();
              
              // Maintain scroll position after dialog opens - multiple attempts
              const maintainScroll = () => {
                window.scrollTo(0, targetScroll);
              };
              
              setTimeout(maintainScroll, 50);
              setTimeout(maintainScroll, 100);
              setTimeout(maintainScroll, 200);
              setTimeout(maintainScroll, 300);
              setTimeout(maintainScroll, 500);
            }
          }, 600);
        }
        
        // Highlight the post briefly to draw attention
        postElement.style.boxShadow = '0 0 20px rgba(33, 150, 243, 0.5)';
        postElement.style.transition = 'box-shadow 0.3s ease-in-out';
        
        setTimeout(() => {
          postElement.style.boxShadow = '';
        }, 2000);
        
      } else {
        // Post not visible on current page - navigate to appropriate page
        const postProviderId = notification.relatedEntityId;
        
        // Store post ID and notification type in sessionStorage for after navigation
        sessionStorage.setItem('scrollToPostId', postId.toString());
        sessionStorage.setItem('scrollToPostType', notification.type);
        sessionStorage.setItem('preventScrollReset', 'true');
        
        // Prevent scroll reset immediately
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
        
        if (user?.type === 'doctor') {
          // For doctors, go to their own dashboard
          navigate('/doctor-dashboard', { 
            state: { scrollToPostId: postId, notificationType: notification.type },
            preventScrollReset: true 
          });
        } else {
          // For patients, go to their dashboard where they can see posts
          navigate('/patient-dashboard', { 
            state: { scrollToPostId: postId, notificationType: notification.type },
            preventScrollReset: true 
          });
        }
        
        // Immediately prevent scroll to top
        window.scrollTo(0, 0);
        
        // Use a more reliable method to wait for the post to be available
        // Try multiple times with increasing delays
        let attempts = 0;
        const maxAttempts = 30; // Try for up to 3 seconds (30 * 100ms)
        
        const tryScrollToPost = () => {
          attempts++;
          const newPostElement = document.getElementById(`post-${postId}`);
          
          if (newPostElement) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
              // Calculate the position of the post element
              const postRect = newPostElement.getBoundingClientRect();
              const scrollPosition = window.scrollY + postRect.top - (window.innerHeight / 2) + (postRect.height / 2);
              
              // Scroll to the post position
              window.scrollTo({
                top: Math.max(0, scrollPosition),
                behavior: 'smooth'
              });
              
              // If it's a comment/reply notification, open the comments section
              if (notification.type === 'POST_COMMENT' || notification.type === 'COMMENT_REPLY' || notification.type === 'COMMENT_LIKE') {
                // Wait for scroll to complete, then open comments
                setTimeout(() => {
                  // Recalculate position to ensure accuracy
                  const updatedPostRect = newPostElement.getBoundingClientRect();
                  const targetScrollPos = window.scrollY + updatedPostRect.top - (window.innerHeight / 2) + (updatedPostRect.height / 2);
                  
                  // Ensure we're at the correct position
                  window.scrollTo(0, Math.max(0, targetScrollPos));
                  
                  const commentButton = newPostElement.querySelector('[data-comment-button]') as HTMLElement;
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
              newPostElement.style.boxShadow = '0 0 20px rgba(33, 150, 243, 0.5)';
              newPostElement.style.transition = 'box-shadow 0.3s ease-in-out';
              
              setTimeout(() => {
                newPostElement.style.boxShadow = '';
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
            // Clean up sessionStorage if post not found after max attempts
            sessionStorage.removeItem('scrollToPostId');
            sessionStorage.removeItem('scrollToPostType');
            sessionStorage.removeItem('preventScrollReset');
            
            // Restore scroll restoration
            if ('scrollRestoration' in window.history) {
              window.history.scrollRestoration = 'auto';
            }
          }
        };
        
        // Start trying after a delay to allow navigation and initial render
        setTimeout(tryScrollToPost, 500);
      }
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Handle scrolling to post after navigation (when coming from notification)
  useEffect(() => {
    const scrollToPostId = sessionStorage.getItem('scrollToPostId');
    const notificationType = sessionStorage.getItem('scrollToPostType');
    
    if (scrollToPostId) {
      const postId = parseInt(scrollToPostId, 10);
      
      // Wait for posts to load, then scroll to the post
      let attempts = 0;
      const maxAttempts = 30; // Try for up to 3 seconds (30 * 100ms)
      
      const tryScrollToPost = () => {
        attempts++;
        const postElement = document.getElementById(`post-${postId}`);
        
        if (postElement) {
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            // Calculate the position of the post element
            const postRect = postElement.getBoundingClientRect();
            const scrollPosition = window.scrollY + postRect.top - (window.innerHeight / 2) + (postRect.height / 2);
            
            // Scroll to the post position without resetting scroll first
            window.scrollTo({
              top: Math.max(0, scrollPosition), // Ensure we don't scroll to negative position
              behavior: 'smooth'
            });
            
            // If it's a comment/reply notification, open the comments section
            if (notificationType && (notificationType === 'POST_COMMENT' || notificationType === 'COMMENT_REPLY' || notificationType === 'COMMENT_LIKE')) {
              setTimeout(() => {
                const commentButton = postElement.querySelector('[data-comment-button]') as HTMLElement;
                if (commentButton) {
                  commentButton.click();
                }
              }, 800);
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
          });
        } else if (attempts < maxAttempts) {
          // Post not found yet, try again
          setTimeout(tryScrollToPost, 100);
        } else {
          // Clean up sessionStorage if post not found after max attempts
          sessionStorage.removeItem('scrollToPostId');
          sessionStorage.removeItem('scrollToPostType');
        }
      };
      
      // Start trying after a short delay to allow page to load
      setTimeout(tryScrollToPost, 300);
    }
  }, [navigate]); // Re-run when navigation changes

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'POST_LIKE':
      case 'COMMENT_LIKE':
        return <FavoriteIcon sx={{ color: '#e91e63' }} />;
      case 'POST_COMMENT':
        return <CommentIcon sx={{ color: '#2196f3' }} />;
      case 'COMMENT_REPLY':
        return <ReplyIcon sx={{ color: '#4caf50' }} />;
      case 'APPOINTMENT_REQUESTED':
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_CANCELLED':
      case 'APPOINTMENT_RESCHEDULED':
      case 'APPOINTMENT_RESCHEDULE_CONFIRMED':
      case 'APPOINTMENT_RESCHEDULE_CANCELLED':
        return <CalendarTodayIcon sx={{ color: '#ff9800' }} />;
      case 'CHAT_MESSAGE':
        return <MessageIcon sx={{ color: '#9c27b0' }} />;
      default:
        return <NotificationsIcon />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No notifications yet</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  disablePadding
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                  }}
                >
                  <ListItemButton
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      py: 2,
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={notification.actor.profilePicture}
                        alt={`${notification.actor.firstName} ${notification.actor.lastName}`}
                      >
                        {notification.actor.firstName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getNotificationIcon(notification.type)}
                          <Typography variant="body2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                            {notification.message}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(notification.createdAt)}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;

