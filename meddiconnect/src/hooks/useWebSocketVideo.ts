import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface VideoSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  sender?: string;
  recipient?: string;
}

interface UseWebSocketVideoOptions {
  token: string | null;
  appointmentId: string | null;
  onSignalReceived: (signal: VideoSignal) => void;
  onError?: (error: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface UseWebSocketVideoReturn {
  connected: boolean;
  sendSignal: (signal: VideoSignal) => void;
  disconnect: () => void;
  stompError: string | null;
}

/**
 * Custom hook for managing WebSocket video call signaling
 * Handles WebRTC signaling (offer, answer, ICE candidates) via STOMP over SockJS
 */
export const useWebSocketVideo = ({
  token,
  appointmentId,
  onSignalReceived,
  onError,
  onConnected,
  onDisconnected,
}: UseWebSocketVideoOptions): UseWebSocketVideoReturn => {
  const [connected, setConnected] = useState(false);
  const [stompError, setStompError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  // Use refs to avoid closure issues with callbacks
  const onSignalReceivedRef = useRef(onSignalReceived);
  const onErrorRef = useRef(onError);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);

  // Keep refs updated
  useEffect(() => {
    onSignalReceivedRef.current = onSignalReceived;
    onErrorRef.current = onError;
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
  }, [onSignalReceived, onError, onConnected, onDisconnected]);

  // Initialize WebSocket client
  useEffect(() => {
    if (!token || !appointmentId) {
      return;
    }

    // Create STOMP client with SockJS
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Video STOMP:', str);
        }
      },
      onConnect: () => {
        console.log('Video WebSocket connected');
        setConnected(true);
        setStompError(null);
        onConnectedRef.current?.();

        // Subscribe to video topic for this appointment
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }

        const subscription = client.subscribe(
          `/topic/video/${appointmentId}`,
          (message: IMessage) => {
            try {
              const signal: VideoSignal = JSON.parse(message.body);
              console.log('Received video signal:', signal);
              onSignalReceivedRef.current?.(signal);
            } catch (error) {
              console.error('Error parsing video signal:', error);
            }
          }
        );

        subscriptionRef.current = subscription;
        console.log(`Subscribed to video topic for appointment ${appointmentId}`);
      },
      onDisconnect: () => {
        console.log('Video WebSocket disconnected');
        setConnected(false);
        onDisconnectedRef.current?.();
      },
      onStompError: (frame) => {
        console.error('Video STOMP error:', frame);
        console.error('Video STOMP error headers:', frame.headers);
        console.error('Video STOMP error body:', frame.body);
        const errorMsg = frame.headers?.message || frame.body || 'WebSocket connection error';
        setStompError(errorMsg);
        setConnected(false);
        onErrorRef.current?.(frame);
      },
      onWebSocketError: (event) => {
        console.error('Video WebSocket error:', event);
        setStompError('WebSocket connection failed. Please check if the server is running.');
        setConnected(false);
        onErrorRef.current?.(event);
      },
    });

    // Activate the client
    client.activate();

    clientRef.current = client;

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setConnected(false);
    };
  }, [token, appointmentId]);

  // Send a video signal via WebSocket
  const sendSignal = useCallback(
    (signal: VideoSignal) => {
      if (!clientRef.current || !clientRef.current.connected) {
        console.error('Video WebSocket not connected, cannot send signal');
        onErrorRef.current?.('WebSocket not connected');
        return;
      }

      if (!appointmentId) {
        console.error('No appointment ID, cannot send signal');
        return;
      }

      try {
        clientRef.current.publish({
          destination: `/app/video/${appointmentId}`,
          body: JSON.stringify(signal),
          headers: { 'content-type': 'application/json' },
        });
        console.log('Sent video signal:', signal);
      } catch (e) {
        console.error('Error sending video signal via WebSocket:', e);
        onErrorRef.current?.('Failed to send signal via WebSocket.');
      }
    },
    [appointmentId]
  );

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setConnected(false);
  }, []);

  return {
    connected,
    sendSignal,
    disconnect,
    stompError,
  };
};

