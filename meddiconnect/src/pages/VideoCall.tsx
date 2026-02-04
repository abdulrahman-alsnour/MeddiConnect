/**
 * Video Call Component
 * 
 * ZegoCloud Prebuilt UI Kit-based video call interface for doctor-patient appointments.
 * 
 * Features:
 * - Complete video call UI provided by ZegoCloud Prebuilt Kit
 * - Automatic token generation (for development)
 * - Camera and microphone controls
 * - Clean, integrated UI
 * 
 * How it works:
 * - Uses ZegoCloud Prebuilt UI Kit (handles everything automatically)
 * - Doctor and Patient join the same room (using appointmentId as roomID)
 * - ZegoCloud manages all WebRTC connections, signaling, and UI
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import DoctorLayout from '../components/DoctorLayout';
import PatientLayout from '../components/PatientLayout';
import { ZEGO_CONFIG } from '../config/zegoConfig';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

interface VideoCallProps {
  appointmentId: string;
  doctorId: number;
  patientId: number;
  isDoctor: boolean;
  patientName?: string;
  doctorName?: string;
}

const VideoCall: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Check if opened in popup window
  const isPopup = window.opener !== null;

  // Extract props from location state, sessionStorage (for popup), or params
  let state = location.state as VideoCallProps | null;
  
  // If opened in popup and no state, try to get from sessionStorage
  if (isPopup && !state && appointmentId) {
    try {
      const storedData = sessionStorage.getItem(`videoCall_${appointmentId}`);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        state = {
          appointmentId: appointmentId,
          doctorId: parsed.doctorId,
          patientId: parsed.patientId,
          isDoctor: parsed.isDoctor,
          patientName: parsed.patientName,
          doctorName: parsed.doctorName,
        };
      }
    } catch (e) {
      console.error('Error reading from sessionStorage:', e);
    }
  }

  const doctorId = state?.doctorId || 0;
  const patientId = state?.patientId || 0;
  const isDoctor = state?.isDoctor || false;
  const patientName = state?.patientName || 'Patient';
  const doctorName = state?.doctorName || 'Doctor';

  // Container ref for ZegoCloud UI
  const zegoContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStarted, setCallStarted] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('VideoCall component mounted:', {
      appointmentId,
      doctorId,
      patientId,
      isDoctor,
      isPopup,
      user: user ? 'authenticated' : 'not authenticated',
    });
  }, []);

  // Initialize the call when container is ready
  useEffect(() => {
    // Only initialize if call is started, not already initialized, and container exists
    if (!callStarted || zegoInstanceRef.current || !zegoContainerRef.current) {
      return;
    }

    const initializeCall = async () => {
      if (!appointmentId) {
        setError('Appointment ID is missing.');
        setCallStarted(false);
        return;
      }

      if (!ZEGO_CONFIG.appID || !ZEGO_CONFIG.serverSecret) {
        setError('ZegoCloud credentials not configured. Please set AppID and ServerSecret in src/config/zegoConfig.ts');
        setCallStarted(false);
        return;
      }

      setLoading(true);

      try {
        // Generate user ID and name
        const userID = isDoctor ? `doctor_${doctorId}` : `patient_${patientId}`;
        const userName = isDoctor ? doctorName : patientName;

        // Generate kit token (for development/testing)
        // NOTE: For production, generate tokens on your backend server
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          ZEGO_CONFIG.appID,
          ZEGO_CONFIG.serverSecret, // Use serverSecret, not appSign
          appointmentId, // roomID
          userID,
          userName
        );

        // Create ZegoUIKitPrebuilt instance
        const zp = ZegoUIKitPrebuilt.create(kitToken);

        // Store instance for cleanup
        zegoInstanceRef.current = zp;

        // Join the room
        zp.joinRoom({
          container: zegoContainerRef.current!,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall, // One-on-one call mode
          },
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: false, // Disable screen sharing for medical calls
          showTextChat: false, // Disable text chat
          showUserList: false, // Hide user list (only 2 people)
        });

        setLoading(false);
      } catch (err: any) {
        console.error('Error starting call:', err);
        setError(err.message || 'Failed to start video call.');
        setLoading(false);
        setCallStarted(false);
        zegoInstanceRef.current = null;
      }
    };

    initializeCall();
  }, [callStarted, appointmentId, isDoctor, doctorId, patientId, doctorName, patientName]);

  // Handle start call button click
  const handleStartCall = () => {
    setCallStarted(true);
    setError(null);
  };

  // End the call and cleanup
  const handleEndCall = () => {
    // Leave the room if instance exists
    if (zegoInstanceRef.current) {
      try {
        zegoInstanceRef.current.leaveRoom();
        zegoInstanceRef.current.destroy();
      } catch (err) {
        console.error('Error during cleanup:', err);
      }
      zegoInstanceRef.current = null;
    }

    setCallStarted(false);

    // If doctor, call backend API to end the call
    if (isDoctor && appointmentId && user?.token) {
      fetch(`http://localhost:8080/appointments/${appointmentId}/end-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      }).catch(err => console.error('Error ending call:', err));
    }

    // If opened in popup, close the popup window
    if (isPopup && window.opener) {
      window.close();
    } else {
      // Otherwise navigate back
      navigate(isDoctor ? '/doctor-online-appointments' : '/online-appointments');
    }
  };


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (zegoInstanceRef.current) {
        try {
          zegoInstanceRef.current.leaveRoom();
          zegoInstanceRef.current.destroy();
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
        zegoInstanceRef.current = null;
      }
    };
  }, []);

  // Layout component based on user role
  const otherPersonName = isDoctor ? patientName : doctorName;

  // Wrapper for popup mode (no layout)
  const PopupWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isPopup) {
      return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
              Video Call - {otherPersonName}
            </Typography>
            {children}
          </Box>
        </Box>
      );
    }
    return <>{children}</>;
  };

  // If popup mode, render without layout wrapper
  if (isPopup) {
    return (
      <PopupWrapper>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Start Call Button or Loading State */}
          {!callStarted && !loading && (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px" gap={2}>
              <Typography variant="h5" gutterBottom>
                Ready to start the call
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click the button below to start your video call with {otherPersonName}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleStartCall}
                sx={{ minWidth: 200 }}
              >
                Start Call
              </Button>
            </Box>
          )}
          
          {loading && (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1">Initializing video call...</Typography>
            </Box>
          )}

          {/* ZegoCloud Video Call Container */}
          {callStarted && (
            <Box
              ref={zegoContainerRef}
              sx={{
                width: '100%',
                height: '80vh',
                minHeight: 600,
                borderRadius: 2,
                overflow: 'hidden',
                display: loading ? 'none' : 'block',
              }}
            />
          )}
        </Box>
      </PopupWrapper>
    );
  }

  // Normal mode with layout wrapper
  const Layout = isDoctor ? DoctorLayout : PatientLayout;

  return (
    <Layout title="Video Call" subtitle={`Appointment with ${otherPersonName}`}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Start Call Button or Loading State */}
        {!callStarted && !loading && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px" gap={2}>
            <Typography variant="h5" gutterBottom>
              Ready to start the call
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click the button below to start your video call with {otherPersonName}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleStartCall}
              sx={{ minWidth: 200 }}
            >
              Start Call
            </Button>
          </Box>
        )}
        
        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1">Initializing video call...</Typography>
          </Box>
        )}

        {/* ZegoCloud Video Call Container */}
        {callStarted && (
          <Box
            ref={zegoContainerRef}
            sx={{
              width: '100%',
              height: '80vh',
              minHeight: 600,
              borderRadius: 2,
              overflow: 'hidden',
              display: loading ? 'none' : 'block',
            }}
          />
        )}
      </Box>
    </Layout>
  );
};

export default VideoCall;
