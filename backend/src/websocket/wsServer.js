// backend/src/websocket/wsServer.js
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const clients = new Map(); // user_id -> Set of ws connections

export function initWebSocket(httpServer) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws, req) => {
    // Parse access_token from httpOnly cookie (browsers auto-attach cookies to same-origin WS requests)
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.access_token;

    let userId;
    try {
      if (!token) {
        throw new Error('access_token cookie not found');
      }
      userId = jwt.verify(token, process.env.JWT_ACCESS_SECRET).id;
    } catch (err) {
      console.error('[WS] Authentication failed:', err.message);
      return ws.close(1008, 'Unauthorized');
    }

    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(ws);

    ws.on('close', () => {
      clients.get(userId)?.delete(ws);
    });
  });
}

export function broadcastToUsers(userIds, payload) {
  const message = JSON.stringify(payload);
  console.log('[WS] Broadcasting to', userIds.length, 'users:', JSON.stringify(payload).substring(0, 100));
  userIds.forEach((id) => {
    clients.get(id)?.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(message);
        console.log('[WS] Message sent to user:', id);
      }
    });
  });
}