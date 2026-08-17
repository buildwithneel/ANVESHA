/**
 * RailGuard AI - WebSocket Service Client
 * Handles real-time event subscriptions, automatic exponential reconnection, and event dispatching.
 */

export type WebSocketEvent =
  | 'new_detection'
  | 'new_alert'
  | 'alert_updated'
  | 'incident_created'
  | 'camera_status_changed'
  | 'crowd_updated'
  | 'worksite_updated'
  | 'worksite_event_created'
  | '*';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface EventPayload<T = any> {
  type: string;
  data: T;
}

type EventCallback<T = any> = (data: T) => void;
type StatusCallback = (status: ConnectionStatus) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private statusListeners: Set<StatusCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private status: ConnectionStatus = 'disconnected';
  private wsUrl: string = '';

  constructor() {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
    const host = import.meta.env.VITE_WS_HOST || `${hostname}:8000`;
    this.wsUrl = `${protocol}//${host}/ws/events`;
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((cb) => {
        try {
          cb(newStatus);
        } catch (e) {
          console.error('[WS Status Callback Error]:', e);
        }
      });
    }
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  public connect(url?: string) {
    if (url) this.wsUrl = url;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        console.log('[RailGuard WS]: Real-time connection established with', this.wsUrl);
        this.reconnectAttempts = 0;
        this.setStatus('connected');

        // Start ping heartbeat
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send('ping');
          }
        }, 15000);
      };

      this.socket.onmessage = (event) => {
        if (event.data === 'pong') return;

        try {
          const payload: EventPayload = JSON.parse(event.data);
          const eventType = payload.type || (payload as any).event;
          const eventData = payload.data || payload;

          // Dispatch to specific event listeners
          if (eventType && this.listeners.has(eventType)) {
            this.listeners.get(eventType)?.forEach((cb) => {
              try {
                cb(eventData);
              } catch (err) {
                console.error(`[WS Error in handler for ${eventType}]:`, err);
              }
            });
          }

          // Dispatch to wildcard listeners
          if (this.listeners.has('*')) {
            this.listeners.get('*')?.forEach((cb) => {
              try {
                cb({ type: eventType, data: eventData });
              } catch (err) {
                console.error('[WS Error in wildcard handler]:', err);
              }
            });
          }
        } catch (err) {
          console.warn('[WS Warning]: Received non-JSON WebSocket message:', event.data);
        }
      };

      this.socket.onclose = () => {
        this.cleanPingInterval();
        if (this.status === 'connected') {
          console.warn('[RailGuard WS]: Connection lost. Attempting to reconnect...');
        }
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.warn('[RailGuard WS Error]:', err);
        // Onerror is followed by onclose, which handles reconnect
      };
    } catch (err) {
      console.error('[RailGuard WS Connect Exception]:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'disconnected');

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[RailGuard WS]: Max reconnect attempts reached.');
      return;
    }

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    // Exponential backoff: 1s, 2s, 4s, capped at 10s
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.setStatus('reconnecting');
      this.connect();
    }, delay);
  }

  private cleanPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public subscribe<T = any>(eventType: WebSocketEvent | string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback as EventCallback);

    // Auto-connect if not connected
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.connect();
    }

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback as EventCallback);
      }
    };
  }

  public disconnect() {
    this.cleanPingInterval();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }
}

export const webSocketService = new WebSocketClient();
export default webSocketService;
