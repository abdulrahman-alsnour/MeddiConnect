import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Fab,
  IconButton,
  Link,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

type ChatRole = 'assistant' | 'user';

type DoctorSuggestion = {
  id: number;
  fullName: string;
  clinicName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  consultationFee?: number | null;
  shortBio?: string | null;
  profilePicture?: string | null;
  specializations?: string[];
  insuranceAccepted?: string[];
};

type PatientContext = {
  ageRange?: string | null;
  primaryConcern?: string | null;
  symptomDuration?: string | null;
  symptomSeverity?: string | null;
  additionalSymptoms?: string | null;
  medicalHistory?: string | null;
  medications?: string | null;
  allergies?: string | null;
  preferredDoctorGender?: string | null;
  preferredLanguage?: string | null;
  insuranceProvider?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  preferredSpecialization?: string | null;
  appointmentPreference?: string | null;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  followUpQuestions?: string[];
  doctors?: DoctorSuggestion[];
  tips?: string[];
};

type ChatResponse = {
  reply: string;
  context: PatientContext;
  recommendedDoctors: DoctorSuggestion[];
  followUpQuestions: string[];
  informationComplete: boolean;
  rawModelContent?: string;
  navigationTips?: string[];
};

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const baseApiUrl = 'http://localhost:8080';

// Storage keys
const CHAT_STORAGE_KEY = 'mediconnect_chat_data';
const CHAT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper functions for localStorage
const getStoredChatData = (): { messages: ChatMessage[]; context: PatientContext; timestamp: number } | null => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    const now = Date.now();
    const age = now - data.timestamp;
    
    // Check if data is older than 5 minutes
    if (age > CHAT_EXPIRY_MS) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error loading chat from storage:', error);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    return null;
  }
};

const saveChatData = (messages: ChatMessage[], context: PatientContext) => {
  try {
    const data = {
      messages,
      context,
      timestamp: Date.now(),
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving chat to storage:', error);
  }
};

const clearStoredChatData = () => {
  localStorage.removeItem(CHAT_STORAGE_KEY);
};

// Get initial messages from storage or use default
const getInitialMessages = (): ChatMessage[] => {
  const stored = getStoredChatData();
  if (stored && stored.messages.length > 0) {
    return stored.messages;
  }
  return [
    {
      id: createMessageId(),
      role: 'assistant',
      content:
        "Hi, I'm MediConnect's Care Guide. Tell me how you're feeling and I'll help you find the right doctor.",
      followUpQuestions: [
        'I have stomach pain',
        'I need a pediatrician for my child',
        'I want a virtual consultation',
      ],
    },
  ];
};

// Get initial context from storage or use default
const getInitialContext = (): PatientContext => {
  const stored = getStoredChatData();
  return stored?.context || {};
};

const PatientAssistantChat: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages);
  const [patientContext, setPatientContext] = useState<PatientContext>(getInitialContext);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const authHeader = useMemo(() => {
    const token = user?.token?.trim();
    if (!token) {
      return undefined;
    }
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }, [user?.token]);

  // Save chat data to localStorage whenever messages or context change
  useEffect(() => {
    // Only save if we have more than just the initial greeting message
    if (messages.length > 1 || Object.keys(patientContext).length > 0) {
      saveChatData(messages, patientContext);
    }
  }, [messages, patientContext]);

  // Check and clear expired chat data on mount
  useEffect(() => {
    const stored = getStoredChatData();
    if (!stored) {
      // Data expired or doesn't exist, clear it
      clearStoredChatData();
    }
  }, []);

  // Auto-clear chat after 5 minutes
  useEffect(() => {
    const stored = getStoredChatData();
    if (!stored) return;

    const age = Date.now() - stored.timestamp;
    const remainingTime = CHAT_EXPIRY_MS - age;

    if (remainingTime > 0) {
      const timeout = setTimeout(() => {
        clearStoredChatData();
        // Reset to initial state
        setMessages([
          {
            id: createMessageId(),
            role: 'assistant',
            content:
              "Hi, I'm MediConnect's Care Guide. Tell me how you're feeling and I'll help you find the right doctor.",
            followUpQuestions: [
              'I have stomach pain',
              'I need a pediatrician for my child',
              'I want a virtual consultation',
            ],
          },
        ]);
        setPatientContext({});
      }, remainingTime);

      return () => clearTimeout(timeout);
    } else {
      // Already expired, clear now
      clearStoredChatData();
      setMessages([
        {
          id: createMessageId(),
          role: 'assistant',
          content:
            "Hi, I'm MediConnect's Care Guide. Tell me how you're feeling and I'll help you find the right doctor.",
          followUpQuestions: [
            'I have stomach pain',
            'I need a pediatrician for my child',
            'I want a virtual consultation',
          ],
        },
      ]);
      setPatientContext({});
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const node = messageListRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, isOpen]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const addAssistantMessage = useCallback(
    (payload: ChatResponse) => {
      const nextMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: payload.reply ?? 'I am here to help.',
        doctors: payload.recommendedDoctors ?? [],
        followUpQuestions: payload.followUpQuestions ?? [],
        tips: payload.navigationTips ?? [],
      };
      setMessages((prev) => [...prev, nextMessage]);
      setPatientContext(payload.context ?? {});
    },
    [],
  );

  const callAssistant = useCallback(
    async (updatedHistory: ChatMessage[]) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const payload = {
          messages: updatedHistory.map(({ role, content }) => ({
            role,
            content,
          })),
          context: patientContext,
        };

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authHeader) {
          headers.Authorization = authHeader;
        }

        const response = await fetch(`${baseApiUrl}/ai/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Assistant responded with status ${response.status}`);
        }

        const data: ChatResponse = await response.json();
        addAssistantMessage(data);
      } catch (err) {
        console.error('Failed to contact AI assistant', err);
        const message =
          err instanceof Error ? err.message : 'Unable to reach the assistant right now.';
        setError(message);
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: 'assistant',
            content:
              "I'm having trouble connecting at the moment. Please try again in a few seconds, or explore the recommended doctors manually.",
          },
        ]);
      } finally {
        setIsSubmitting(false);
      }
    },
    [addAssistantMessage, authHeader, patientContext],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSubmitting) {
        return;
      }

      const outbound: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content: trimmed,
      };

      setMessages((prev) => [...prev, outbound]);
      setInputValue('');

      const historyForApi = [...messages, outbound];
      await callAssistant(historyForApi);
    },
    [callAssistant, isSubmitting, messages],
  );

  const handleSend = useCallback(async () => {
    await sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleQuickReply = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage],
  );

  const renderDoctorCard = (doctor: DoctorSuggestion) => {
    const url = `/doctor-public-profile/${doctor.id}`;
    return (
      <Paper
        key={doctor.id}
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2,
          borderColor: 'primary.light',
          mb: 1.5,
          backgroundColor: 'rgba(56,101,255,0.04)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Avatar
            src={doctor.profilePicture ?? undefined}
            alt={doctor.fullName}
            sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}
          >
            <PersonIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {doctor.fullName}
            </Typography>
            {doctor.clinicName && (
              <Typography variant="body2" color="text.secondary">
                {doctor.clinicName}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <LocalHospitalIcon fontSize="small" color="primary" />
              <Typography variant="caption" color="text.secondary">
                {(doctor.specializations ?? []).join(', ') || 'General practitioner'}
              </Typography>
            </Box>
            {(doctor.city || doctor.state || doctor.country) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {[doctor.city, doctor.state, doctor.country].filter(Boolean).join(', ')}
                </Typography>
              </Box>
            )}
            {doctor.insuranceAccepted && doctor.insuranceAccepted.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <HealthAndSafetyIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Accepts: {doctor.insuranceAccepted.slice(0, 3).join(', ')}
                  {doctor.insuranceAccepted.length > 3 ? '…' : ''}
                </Typography>
              </Box>
            )}
            {doctor.consultationFee && (
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                Consultation fee: ${doctor.consultationFee.toFixed(0)}
              </Typography>
            )}
            <Link
              component={RouterLink}
              to={url}
              sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', fontWeight: 600 }}
              underline="hover"
            >
              View profile
            </Link>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <>
      {isOpen ? (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            width: { xs: '90%', sm: 360, md: 380 },
            maxWidth: 420,
            borderRadius: 3,
            overflow: 'hidden',
            zIndex: theme.zIndex.tooltip + 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.paper',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Care Guide
            </Typography>
            <IconButton
              size="small"
              onClick={toggleOpen}
              sx={{ color: 'primary.contrastText' }}
              aria-label="Close chat"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            ref={messageListRef}
            sx={{
              flex: 1,
              px: 2,
              py: 2,
              maxHeight: 420,
              overflowY: 'auto',
              backgroundColor: 'rgba(56,101,255,0.03)',
            }}
          >
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant';
              return (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAssistant ? 'flex-start' : 'flex-end',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      maxWidth: '85%',
                      backgroundColor: isAssistant ? 'common.white' : 'primary.main',
                      color: isAssistant ? 'text.primary' : 'primary.contrastText',
                      border: isAssistant ? '1px solid rgba(56,101,255,0.15)' : 'none',
                      boxShadow: isAssistant ? 1 : 'none',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    <Typography variant="body2">{message.content}</Typography>
                  </Box>
                  {isAssistant && message.doctors && message.doctors.length > 0 && (
                    <Box sx={{ mt: 1.5, width: '100%' }}>
                      {message.doctors.map(renderDoctorCard)}
                    </Box>
                  )}
                  {isAssistant && message.tips && message.tips.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {message.tips.map((tip, index) => (
                        <Typography
                          key={`${message.id}-tip-${index}`}
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          • {tip}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  {isAssistant && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {message.followUpQuestions.map((question) => (
                        <Chip
                          key={`${message.id}-${question}`}
                          label={question}
                          size="small"
                          onClick={() => handleQuickReply(question)}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
            {isSubmitting && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}
            {error && (
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1.5,
              borderTop: '1px solid rgba(56,101,255,0.12)',
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Describe how you're feeling…"
              multiline
              maxRows={3}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={isSubmitting || !inputValue.trim()}
              aria-label="Send"
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      ) : (
        <Tooltip title="Need help finding a doctor?">
          <Fab
            color="primary"
            onClick={toggleOpen}
            sx={{
              position: 'fixed',
              bottom: { xs: 16, sm: 24 },
              right: { xs: 16, sm: 24 },
              zIndex: theme.zIndex.tooltip + 1,
            }}
            aria-label="Open AI assistant"
          >
            <ChatIcon />
          </Fab>
        </Tooltip>
      )}
    </>
  );
};

export default PatientAssistantChat;

