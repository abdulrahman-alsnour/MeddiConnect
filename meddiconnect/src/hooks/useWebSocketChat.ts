import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UseWebSocketChatOptions {
  token: string | null;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface UseWebSocketChatReturn {
  connected: boolean;
  sendMessage: (channelId: number, content: string, senderUsername: string) => void;
  subscribeToChannel: (channelId: number) => void;
  unsubscribeFromChannel: () => void;
  disconnect: () => void;
  stompError: string | null;
}

/**
 * Custom hook for managing WebSocket chat connections
 * Handles connection, subscription, and message sending via STOMP over SockJS
 */
export const useWebSocketChat = ({
  token,
  onMessage,
  onError,
  onConnected,
  onDisconnected,
}: UseWebSocketChatOptions): UseWebSocketChatReturn => {
  const [connected, setConnected] = useState(false);
  const [stompError, setStompError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const currentChannelIdRef = useRef<number | null>(null);

  // Use refs to avoid closure issues with callbacks
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);

  // Keep refs updated
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
  }, [onMessage, onError, onConnected, onDisconnected]);

  // Initialize WebSocket client
  useEffect(() => {
    if (!token) {
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
          console.log('STOMP:', str);
        }
      },
      onConnect: () => {
        console.log('WebSocket connected');
        setConnected(true);
        setStompError(null);
        onConnectedRef.current?.();
        
        // Re-subscribe to current channel if we were subscribed before reconnection
        if (currentChannelIdRef.current !== null && clientRef.current?.connected) {
          const channelId = currentChannelIdRef.current;
          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
          }
          const subscription = clientRef.current.subscribe(
            `/topic/chat/${channelId}`,
            (message: IMessage) => {
              try {
                const data = JSON.parse(message.body);
                console.log('Received message:', data);
                onMessageRef.current?.(data);
              } catch (error) {
                console.error('Error parsing message:', error);
              }
            }
          );
          subscriptionRef.current = subscription;
          console.log(`Re-subscribed to channel ${channelId}`);
        }
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        onDisconnectedRef.current?.();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        console.error('STOMP error headers:', frame.headers);
        console.error('STOMP error body:', frame.body);
        const errorMsg = frame.headers?.message || frame.body || 'WebSocket connection error';
        setStompError(errorMsg);
        setConnected(false);
        onErrorRef.current?.(frame);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
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
  }, [token]);

  // Subscribe to a channel
  const subscribeToChannel = useCallback((channelId: number) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn('WebSocket not connected, cannot subscribe');
      return;
    }

    // Unsubscribe from previous channel if exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // Subscribe to new channel
    const subscription = clientRef.current.subscribe(
      `/topic/chat/${channelId}`,
      (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          console.log('Received message:', data);
          onMessageRef.current?.(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      }
    );

    subscriptionRef.current = subscription;
    currentChannelIdRef.current = channelId;
    console.log(`Subscribed to channel ${channelId}`);
  }, []);

  // Unsubscribe from current channel
  const unsubscribeFromChannel = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      currentChannelIdRef.current = null;
      console.log('Unsubscribed from channel');
    }
  }, []);

  // Send a message via WebSocket
  const sendMessage = useCallback((channelId: number, content: string, senderUsername: string) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.error('WebSocket not connected, cannot send message');
      onErrorRef.current?.('WebSocket not connected');
      return;
    }

    const message = {
      channelId: channelId,
      content: content,
      senderUsername: senderUsername,
    };

    clientRef.current.publish({
      destination: `/app/chat/${channelId}/sendMessage`,
      body: JSON.stringify(message),
    });

    console.log('Sent message:', message);
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    unsubscribeFromChannel();
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setConnected(false);
  }, [unsubscribeFromChannel]);

  return {
    connected,
    sendMessage,
    subscribeToChannel,
    unsubscribeFromChannel,
    disconnect,
    stompError,
  };
};

