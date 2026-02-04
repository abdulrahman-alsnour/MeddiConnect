/**
 * Patient Chat Page
 * 
 * Simple chat interface for patients to communicate with their doctors.
 * 
 * Features:
 * - View all chat channels (one per doctor)
 * - Send and receive messages
 * - See unread message counts
 * - Auto-opens when an appointment is confirmed
 * 
 * How it works:
 * - Chat channels are automatically created when an appointment is confirmed
 * - Only ONE channel exists per patient-doctor pair (even with multiple appointments)
 * - Messages are stored in the database
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Badge,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import PatientLayout from '../components/PatientLayout';
import { useAuth } from '../context/AuthContext';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import { Chip } from '@mui/material';

// Note: PatientLayout expects title prop, so we pass it

// Chat channel interface
interface ChatChannel {
  id: number;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  doctor: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    specialty: string;
  };
  lastMessage?: {
    id: number;
    content: string;
    sentAt: string;
    senderId: number;
  };
  unreadCount: number;
  lastActivityAt: string;
}

// Chat message interface
interface ChatMessage {
  id: number;
  channelId: number;
  content: string;
  sentAt: string;
  senderId: number;
  isRead: boolean;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isDoctor?: boolean;
  };
}

const PatientChat: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // WebSocket connection for real-time messaging
  const { connected, sendMessage: wsSendMessage, subscribeToChannel, unsubscribeFromChannel, stompError } = useWebSocketChat({
    token: user?.token || null,
    onMessage: (message) => {
      // Handle incoming real-time message
      if (message && message.id) {
        const newMessage: ChatMessage = {
          id: message.id,
          channelId: message.channelId || selectedChannel?.id || 0,
          content: message.content,
          sentAt: message.sentAt,
          senderId: message.senderId,
          isRead: message.isRead || false,
          sender: message.sender || {
            id: message.senderId,
            firstName: 'Unknown',
            lastName: '',
            isDoctor: message.sender?.isDoctor || false,
          },
        };

        // Only add if not already in messages (avoid duplicates)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMessage.id);
          if (exists) return prev;
          const updated = [...prev, newMessage];
          // Scroll to bottom when new message arrives
          setTimeout(() => scrollToBottom(), 100);
          return updated;
        });

        // Update channels to reflect new last message
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === newMessage.channelId
              ? {
                  ...ch,
                  lastMessage: {
                    id: newMessage.id,
                    content: newMessage.content,
                    sentAt: newMessage.sentAt,
                    senderId: newMessage.senderId,
                  },
                  lastActivityAt: newMessage.sentAt,
                }
              : ch
          )
        );
      }
    },
    onError: (err) => {
      console.error('WebSocket error:', err);
      // Only show error if it's a critical connection failure
      // Don't show error for every message, just log it
      if (err && typeof err === 'object' && 'headers' in err) {
        const frame = err as any;
        if (frame.headers?.message) {
          console.error('STOMP error message:', frame.headers.message);
        }
      }
      // Don't set error state immediately - let the connection retry
      // setError('Connection error. Please refresh the page.');
    },
    onConnected: () => {
      setWsConnected(true);
      // Re-subscribe to current channel if one is selected
      if (selectedChannel) {
        subscribeToChannel(selectedChannel.id);
      }
    },
    onDisconnected: () => {
      setWsConnected(false);
    },
  });

  // Fetch all chat channels for the patient
  useEffect(() => {
    const fetchChannels = async () => {
      if (!user?.token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('http://localhost:8080/chat/channels', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch chat channels');
        }
        
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          setChannels(data.data);
          
          // Check if we came from a notification - open the specific channel
          const channelIdFromNotification = (location.state as any)?.channelId;
          if (channelIdFromNotification) {
            const channelFromNotification = data.data.find((ch: ChatChannel) => ch.id === channelIdFromNotification);
            if (channelFromNotification) {
              setSelectedChannel(channelFromNotification);
              // Clear the navigation state
              window.history.replaceState({}, document.title);
            } else if (data.data.length > 0) {
              // Channel not found, select first channel
              setSelectedChannel(data.data[0]);
            }
          } else if (data.data.length > 0 && !selectedChannel) {
            // Auto-select first channel if available (only on desktop)
            if (!isMobile) {
              setSelectedChannel(data.data[0]);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching channels:', err);
        setError(err.message || 'Failed to load chat channels');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChannels();
  }, [user?.token, location.state]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Fetch messages for selected channel and subscribe to WebSocket
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChannel || !user?.token) return;
      
      // Unsubscribe from previous channel
      unsubscribeFromChannel();
      
      try {
        // Fetch initial messages via REST API
        const response = await fetch(`http://localhost:8080/chat/channels/${selectedChannel.id}/messages`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          setMessages(data.data);
          
          // Mark messages as read
          await fetch(`http://localhost:8080/chat/channels/${selectedChannel.id}/read`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
          });
          
          // Refresh channels to update unread count
          const channelsResponse = await fetch('http://localhost:8080/chat/channels', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
          });
          if (channelsResponse.ok) {
            const channelsData = await channelsResponse.json();
            if (channelsData.status === 'success') {
              setChannels(channelsData.data);
            }
          }
        }

        // Subscribe to WebSocket for real-time messages
        if (connected) {
          subscribeToChannel(selectedChannel.id);
        }
      } catch (err: any) {
        console.error('Error fetching messages:', err);
      }
    };
    
    fetchMessages();
  }, [selectedChannel, user?.token, connected, subscribeToChannel, unsubscribeFromChannel]);

  // Scroll to bottom when messages change or channel changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChannel]);

  // Send a message via WebSocket
  const handleSendMessage = async () => {
    if (!selectedChannel || !newMessage.trim() || !user?.token || !user?.username) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Send via WebSocket
      if (connected) {
        wsSendMessage(selectedChannel.id, messageContent, user.username);
        // Message will be added via WebSocket onMessage callback
      } else {
        // Fallback to REST API if WebSocket not connected
        const response = await fetch(`http://localhost:8080/chat/channels/${selectedChannel.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: messageContent,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
        
        const data = await response.json();
        if (data.status === 'success') {
          // Add real message from server
          const realMessage: ChatMessage = {
            id: data.data.id,
            channelId: selectedChannel.id,
            content: data.data.content,
            sentAt: data.data.sentAt,
            senderId: data.data.senderId,
            isRead: false,
            sender: data.data.sender || {
              id: data.data.senderId,
              firstName: 'You',
              lastName: '',
              isDoctor: false,
            },
          };
          setMessages((prev) => [...prev, realMessage]);
          
          // Refresh channels to update last message
          const channelsResponse = await fetch('http://localhost:8080/chat/channels', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
          });
          if (channelsResponse.ok) {
            const channelsData = await channelsResponse.json();
            if (channelsData.status === 'success') {
              setChannels(channelsData.data);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      // Restore message content on error so user can retry
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  return (
    <PatientLayout title="Messages">
      <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', minHeight: { xs: 'calc(100vh - 120px)', md: 'calc(100vh - 200px)' } }}>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* WebSocket connection status indicator */}
        {!wsConnected && user?.token && (
          <Alert 
            severity={stompError ? "warning" : "info"} 
            sx={{ mb: 2 }}
            onClose={stompError ? () => {} : undefined}
          >
            {stompError 
              ? `Real-time messaging unavailable: ${stompError}. Messages will still be sent via standard connection.`
              : "Connecting to real-time chat... Messages will be sent via standard connection until connected."
            }
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : channels.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No chats yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Chat channels will appear here once you have a confirmed appointment with a doctor.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flex: 1, gap: { xs: 0, md: 2 }, minHeight: 0, position: 'relative' }}>
            {/* Channel list sidebar - Drawer on mobile, sidebar on desktop */}
            <Drawer
              variant={isMobile ? 'temporary' : 'permanent'}
              open={isMobile ? drawerOpen : true}
              onClose={() => setDrawerOpen(false)}
              sx={{
                width: { xs: 280, md: 300 },
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: { xs: 280, md: 300 },
                  boxSizing: 'border-box',
                  position: { xs: 'absolute', md: 'relative' },
                  height: { xs: '100%', md: 'auto' },
                },
              }}
            >
              <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: { xs: 1.5, md: 2 }, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    Conversations
                  </Typography>
                </Box>
                <List sx={{ flex: 1, overflow: 'auto' }}>
                  {channels.map((channel) => (
                    <ListItem key={channel.id} disablePadding>
                      <ListItemButton
                        selected={selectedChannel?.id === channel.id}
                        onClick={() => {
                          setSelectedChannel(channel);
                          if (isMobile) {
                            setDrawerOpen(false);
                          }
                        }}
                        sx={{ py: { xs: 1, md: 1.5 } }}
                      >
                        <ListItemAvatar>
                          <Badge badgeContent={channel.unreadCount} color="primary">
                            <Avatar 
                              src={channel.doctor.profilePicture}
                              sx={{ width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 } }}
                            >
                              {channel.doctor.firstName[0]}{channel.doctor.lastName[0]}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                              Dr. {channel.doctor.firstName} {channel.doctor.lastName}
                            </Typography>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: { xs: '150px', md: '200px' }
                              }}
                            >
                              {channel.lastMessage?.content || 'No messages yet'}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Drawer>

            {/* Chat area */}
            {selectedChannel ? (
              <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Chat header */}
                <Box sx={{ p: { xs: 1.5, md: 2 }, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                    {isMobile && (
                      <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: { xs: -1, md: 0 } }}>
                        <MenuIcon />
                      </IconButton>
                    )}
                    <Avatar 
                      src={selectedChannel.doctor.profilePicture}
                      sx={{ width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 } }}
                    >
                      {selectedChannel.doctor.firstName[0]}{selectedChannel.doctor.lastName[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                      >
                        Dr. {selectedChannel.doctor.firstName} {selectedChannel.doctor.lastName}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                      >
                        {selectedChannel.doctor.specialty}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Messages area - Instagram-like interface */}
                <Box 
                  ref={messagesContainerRef}
                  sx={{ 
                    flex: 1, 
                    overflow: 'auto', 
                    p: { xs: 1, md: 2 }, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: { xs: 1, md: 1.5 }
                  }}
                >
                  {messages.map((message) => {
                    // Compare senderId with channel's patient ID (since this is PatientChat, the current user is the patient)
                    const isOwnMessage = selectedChannel && message.senderId === selectedChannel.patient.id;
                    const senderName = message.sender 
                      ? (message.sender.isDoctor ? `Dr. ${message.sender.firstName} ${message.sender.lastName}` : `${message.sender.firstName} ${message.sender.lastName}`)
                      : 'Unknown';
                    
                    // For own messages, get user info from selected channel (patient info)
                    const ownUserInfo = isOwnMessage && selectedChannel 
                      ? selectedChannel.patient 
                      : null;
                    
                    return (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-end',
                          gap: 1,
                          width: '100%',
                        }}
                      >
                        {/* Left side: Other person's avatar (only shown for their messages) */}
                        {!isOwnMessage && (
                          <Avatar 
                            src={message.sender?.profilePicture} 
                            sx={{ width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 }, flexShrink: 0 }}
                          >
                            {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
                          </Avatar>
                        )}
                        
                        {/* Message bubble container */}
                        <Box 
                          sx={{ 
                            maxWidth: { xs: '85%', md: '75%' }, 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                          }}
                        >
                          {/* Sender name (only for other person's messages) */}
                          {!isOwnMessage && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                mb: 0.5, 
                                fontWeight: 600,
                                color: 'text.secondary',
                                px: 0.5,
                              }}
                            >
                              {senderName}
                            </Typography>
                          )}
                          
                          {/* Message bubble */}
                          <Paper
                            elevation={0}
                            sx={{
                              p: { xs: 1, md: 1.5 },
                              px: { xs: 1.5, md: 2 },
                              bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                              color: isOwnMessage ? 'white' : 'text.primary',
                              borderRadius: isOwnMessage 
                                ? '20px 20px 4px 20px' // Right side bubble (rounded top-left, sharp bottom-right)
                                : '20px 20px 20px 4px', // Left side bubble (rounded top-right, sharp bottom-left)
                              alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                wordBreak: 'break-word',
                                fontSize: { xs: '0.875rem', md: '1rem' }
                              }}
                            >
                              {message.content}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                opacity: 0.7, 
                                display: 'block', 
                                mt: 0.5,
                                fontSize: { xs: '0.65rem', md: '0.7rem' },
                              }}
                            >
                              {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Paper>
                        </Box>
                        
                        {/* Right side: Your avatar (only shown for your messages) */}
                        {isOwnMessage && (
                          <Avatar 
                            src={ownUserInfo?.profilePicture} 
                            sx={{ width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 }, flexShrink: 0 }}
                          >
                            {ownUserInfo?.firstName?.[0]}{ownUserInfo?.lastName?.[0]}
                          </Avatar>
                        )}
                      </Box>
                    );
                  })}
                  {/* Invisible element at the bottom to scroll to */}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message input */}
                <Divider />
                <Box sx={{ p: { xs: 1, md: 2 }, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sending}
                    multiline
                    maxRows={4}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: { xs: '0.875rem', md: '1rem' },
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    sx={{ 
                      flexShrink: 0,
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 }
                    }}
                  >
                    <SendIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
                  </IconButton>
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                p: { xs: 2, md: 4 }
              }}>
                {isMobile ? (
                  <>
                    <IconButton 
                      onClick={() => setDrawerOpen(true)}
                      sx={{ mb: 2 }}
                      color="primary"
                    >
                      <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                      Select a conversation to start chatting
                    </Typography>
                  </>
                ) : (
                  <Typography variant="h6" color="text.secondary">
                    Select a conversation to start chatting
                  </Typography>
                )}
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </PatientLayout>
  );
};

export default PatientChat;

