// frontend/src/websocket/websocket.js
const WS_BASE_URL = import.meta.env.VITE_WS_URL;

export function createWebSocket({
  onOpen,
  onMessage,
  onClose,
  onError,
}) {
  if (!WS_BASE_URL) {
    throw new Error(
      "VITE_WS_URL is not configured."
    );
  }

  const socket = new WebSocket(WS_BASE_URL);

  socket.onopen = () => {
    if (import.meta.env.DEV) {
      console.log("[WebSocket] Connected");
    }

    onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (import.meta.env.DEV) {
        console.log(
          "[WebSocket] Received:",
          message
        );
      }

      onMessage?.(message);
    } catch (error) {
      console.error(
        "[WebSocket] Invalid message:",
        error
      );
    }
  };

  socket.onerror = (error) => {
    if (import.meta.env.DEV) {
      console.log(
        "[WebSocket] Error:",
        error
      );
    }

    onError?.(error);
  };

  socket.onclose = (event) => {
    if (import.meta.env.DEV) {
      console.log(
        "[WebSocket] Closed:",
        event.code,
        event.reason
      );
    }

    onClose?.(event);
  };

  return socket;
}