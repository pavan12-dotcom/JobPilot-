// src/services/websocket.service.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../db/prisma');
const env = require('../config/env');
const logger = require('../utils/logger');

let wss = null;
const userSockets = new Map(); // userId -> Set of WS connections

let supabaseAdmin = null;
function getSupabase() {
  if (!supabaseAdmin && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      realtime: { transport: WebSocket }
    });
  }
  return supabaseAdmin;
}

async function verifyToken(token) {
  if (!token) return null;
  
  // Try Supabase first
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        const user = await prisma.user.findUnique({
          where: { supabase_id: data.user.id }
        });
        if (user) return user.id;
      }
    } catch (err) {
      logger.debug('WS Supabase auth failed, falling back to local JWT: ' + err.message);
    }
  }

  // Local JWT fallback
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const userId = decoded.userId || decoded.sub;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user.id;
  } catch (err) {
    logger.debug('WS Local JWT verification failed: ' + err.message);
  }

  return null;
}

function initWebSocketServer(server) {
  wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      let token = url.searchParams.get('token');
      
      // Support standard Bearer prefix if passed that way
      if (token && token.startsWith('Bearer ')) {
        token = token.substring(7);
      }

      const userId = await verifyToken(token);
      if (!userId) {
        logger.warn('WS connection upgrade rejected: Unauthenticated');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, userId);
      });
    } catch (err) {
      logger.error('WS Upgrade error: ' + err.message);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', (ws, request, userId) => {
    logger.info(`🔌 WS Client connected: User ${userId}`);

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(ws);

    // Heartbeat mechanism to detect stale connections
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (message) => {
      try {
        const payload = JSON.parse(message);
        if (payload.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {}
    });

    ws.on('close', () => {
      logger.info(`🔌 WS Client disconnected: User ${userId}`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(ws);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });

    ws.on('error', (err) => {
      logger.error(`WS Error for User ${userId}: ${err.message}`);
    });

    // Send welcome message
    ws.send(JSON.stringify({ type: 'welcome', data: { userId } }));
  });

  // Keep-alive ping interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

function broadcastToUser(userId, eventType, data) {
  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) return;

  const payload = JSON.stringify({ type: eventType, data });
  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

module.exports = {
  initWebSocketServer,
  broadcastToUser
};
