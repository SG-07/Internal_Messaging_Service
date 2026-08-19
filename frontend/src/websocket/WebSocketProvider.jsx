// frontend/src/websocket/WebSocketProvider.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { createWebSocket } from "./websocket";

const WebSocketContext = createContext(null);

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function WebSocketProvider({ children }) {
  const { user, loading } = useAuth();

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const manuallyClosedRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    manuallyClosedRef.current = true;

    clearReconnectTimer();

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setConnected(false);
  }, [clearReconnectTimer]);

  const connect = useCallback(() => {
    if (loading || !user) {
      return;
    }

    const existingSocket = socketRef.current;

    if (existingSocket) {
      if (
        existingSocket.readyState === WebSocket.OPEN ||
        existingSocket.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
    }

    clearReconnectTimer();

    manuallyClosedRef.current = false;

    if (import.meta.env.DEV) {
      console.log("[WebSocket] Connecting...");
    }

    const socket = createWebSocket({
      onOpen: () => {
        reconnectAttemptsRef.current = 0;
        setConnected(true);

        if (import.meta.env.DEV) {
          console.log(
            "[WebSocket] Ready for real-time events"
          );
        }
      },

      onMessage: (message) => {
        setLastMessage(message);
      },

      onError: () => {
        setConnected(false);
      },

      onClose: () => {
        socketRef.current = null;
        setConnected(false);

        if (
          manuallyClosedRef.current ||
          !user
        ) {
          return;
        }

        const attempt =
          reconnectAttemptsRef.current;

        const delay = Math.min(
          INITIAL_RECONNECT_DELAY *
            2 ** attempt,
          MAX_RECONNECT_DELAY
        );

        if (import.meta.env.DEV) {
          console.log(
            `[WebSocket] Reconnecting in ${delay}ms`
          );
        }

        reconnectTimerRef.current =
          setTimeout(() => {
            reconnectTimerRef.current = null;
            reconnectAttemptsRef.current += 1;

            connect();
          }, delay);
      },
    });

    socketRef.current = socket;
  }, [
    loading,
    user,
    clearReconnectTimer,
  ]);

  const sendMessage = useCallback((message) => {
    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      if (import.meta.env.DEV) {
        console.log(
          "[WebSocket] Cannot send message. Socket is not connected."
        );
      }

      return false;
    }

    socket.send(JSON.stringify(message));

    return true;
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      disconnect();
      return;
    }

    connect();
  }, [
    loading,
    user,
    connect,
    disconnect,
  ]);

  useEffect(() => {
    return () => {
      manuallyClosedRef.current = true;

      clearReconnectTimer();

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [clearReconnectTimer]);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        lastMessage,
        sendMessage,
        connect,
        disconnect,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error(
      "useWebSocket must be used inside WebSocketProvider"
    );
  }

  return context;
}