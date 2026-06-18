// lib/websocket.js — Client-side WebSocket integration

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.token = null;
    this.reconnectTimeout = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.pingInterval = null;
  }

  connect(token) {
    if (typeof window === 'undefined') return;
    this.disconnect();

    this.token = token;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Convert http(s) to ws(s)
    let wsUrl = API_URL.replace(/^http/, 'ws');
    // Ensure trailing slash isn't duplicated
    if (!wsUrl.endsWith('/')) {
      wsUrl += '/';
    }
    wsUrl += `?token=${encodeURIComponent(token)}`;

    console.log(`🔌 WS: Connecting to ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('🔌 WS: Connected successfully');
      this.reconnectDelay = 1000; // Reset backoff delay
      
      // Start ping/pong keepalive
      this.pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 15000);
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('🔌 WS Message received:', payload);

        if (payload.type === 'pong') return;

        // Dispatch a custom event on the window object
        const customEvent = new CustomEvent(`jobpilot:${payload.type}`, {
          detail: payload.detail || payload.data
        });
        window.dispatchEvent(customEvent);
      } catch (err) {
        console.warn('Failed to parse WebSocket message:', err);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`🔌 WS: Closed (code: ${event.code}). Attempting reconnect...`);
      this.cleanup();
      
      // Reconnect with backoff
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
        this.connect(this.token);
      }, this.reconnectDelay);
    };

    this.ws.onerror = (err) => {
      console.error('🔌 WS: Connection error:', err);
    };
  }

  disconnect() {
    this.cleanup();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.token = null;
  }

  cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

const wsClient = new WebSocketClient();
export default wsClient;
