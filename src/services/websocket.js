/**
 * WebSocket Client Service
 * PhD Elite+++ Real-time Market Data & Updates
 */

class WebSocketService {
  constructor() {
    this.dataSocket = null;
    this.tradingSocket = null;
    this.config = null;
    this.subscriptions = new Set();
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = null;
    this.isConnected = false;
  }

  /**
   * Initialize WebSocket connections
   */
  async initialize() {
    try {
      // Get connection config from server
      const token = localStorage.getItem('iava_token');
      if (!token) {
        throw new Error('Authentication required for WebSocket');
      }

      const response = await fetch('/api/websocket/stream', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get WebSocket configuration');
      }

      const data = await response.json();
      this.config = data.config;

      // Connect to data stream
      await this.connectDataStream();

      // Connect to trading stream
      await this.connectTradingStream();

      // Start heartbeat
      this.startHeartbeat();

      this.isConnected = true;
      console.log('[WebSocket] ✅ Connected to real-time streams');

      return true;
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect to market data stream
   */
  async connectDataStream() {
    return new Promise((resolve, reject) => {
      try {
        this.dataSocket = new WebSocket(this.config.dataStream.url);

        this.dataSocket.onopen = () => {
          console.log('[WebSocket] Data stream connected');

          // Authenticate
          this.dataSocket.send(JSON.stringify(this.config.dataStream.auth));

          resolve();
        };

        this.dataSocket.onmessage = (event) => {
          try {
            const messages = event.data.split('\n').filter(msg => msg.trim());
            messages.forEach(msg => {
              const data = JSON.parse(msg);
              this.handleDataMessage(data);
            });
          } catch (error) {
            console.error('[WebSocket] Data parse error:', error);
          }
        };

        this.dataSocket.onerror = (error) => {
          console.error('[WebSocket] Data stream error:', error);
          this.handleDisconnect('data');
        };

        this.dataSocket.onclose = () => {
          console.log('[WebSocket] Data stream closed');
          this.handleDisconnect('data');
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Connect to trading updates stream
   */
  async connectTradingStream() {
    return new Promise((resolve, reject) => {
      try {
        this.tradingSocket = new WebSocket(this.config.tradingStream.url);

        this.tradingSocket.onopen = () => {
          console.log('[WebSocket] Trading stream connected');

          // Authenticate
          this.tradingSocket.send(JSON.stringify(this.config.tradingStream.auth));

          // Subscribe to updates
          this.tradingSocket.send(JSON.stringify({
            action: 'listen',
            data: {
              streams: ['trade_updates', 'account_updates']
            }
          }));

          resolve();
        };

        this.tradingSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleTradingMessage(data);
          } catch (error) {
            console.error('[WebSocket] Trading parse error:', error);
          }
        };

        this.tradingSocket.onerror = (error) => {
          console.error('[WebSocket] Trading stream error:', error);
          this.handleDisconnect('trading');
        };

        this.tradingSocket.onclose = () => {
          console.log('[WebSocket] Trading stream closed');
          this.handleDisconnect('trading');
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle market data messages
   */
  handleDataMessage(data) {
    if (data.T === 'success' || data.T === 'subscription') {
      console.log('[WebSocket] Data subscription:', data);
      return;
    }

    // Emit to listeners based on message type
    switch (data.T) {
      case 't': // Trade
        this.emit('trade', {
          symbol: data.S,
          price: data.p,
          size: data.s,
          timestamp: data.t
        });
        break;

      case 'q': // Quote
        this.emit('quote', {
          symbol: data.S,
          bidPrice: data.bp,
          bidSize: data.bs,
          askPrice: data.ap,
          askSize: data.as,
          timestamp: data.t
        });
        break;

      case 'b': // Bar
        this.emit('bar', {
          symbol: data.S,
          open: data.o,
          high: data.h,
          low: data.l,
          close: data.c,
          volume: data.v,
          timestamp: data.t
        });
        break;
    }
  }

  /**
   * Handle trading update messages
   */
  handleTradingMessage(data) {
    if (data.stream === 'authorization' && data.data.status === 'authorized') {
      console.log('[WebSocket] Trading authorized');
      return;
    }

    // Emit trading updates
    switch (data.stream) {
      case 'trade_updates':
        this.emit('order_update', {
          id: data.data.order_id,
          status: data.data.event,
          filled_qty: data.data.filled_qty,
          filled_price: data.data.filled_avg_price,
          timestamp: data.data.timestamp
        });

        // Show toast notification for important events
        if (['fill', 'partial_fill', 'rejected', 'canceled'].includes(data.data.event)) {
          const message = this.getOrderStatusMessage(data.data);
          window.dispatchEvent(new CustomEvent('iava.toast', {
            detail: {
              text: message,
              type: data.data.event === 'rejected' ? 'error' : 'info',
              ttl: 5000
            }
          }));
        }
        break;

      case 'account_updates':
        this.emit('account_update', data.data);
        break;
    }
  }

  /**
   * Get user-friendly order status message
   */
  getOrderStatusMessage(orderData) {
    const symbol = orderData.symbol;
    const qty = orderData.qty;

    switch (orderData.event) {
      case 'fill':
        return `✅ Order filled: ${qty} shares of ${symbol} at $${orderData.filled_avg_price}`;
      case 'partial_fill':
        return `⏳ Partial fill: ${orderData.filled_qty}/${qty} shares of ${symbol}`;
      case 'rejected':
        return `❌ Order rejected: ${symbol} - ${orderData.reject_reason || 'Unknown reason'}`;
      case 'canceled':
        return `🚫 Order canceled: ${symbol}`;
      default:
        return `📊 Order update: ${symbol} - ${orderData.event}`;
    }
  }

  /**
   * Subscribe to symbol updates
   */
  subscribe(symbols, types = ['trades', 'quotes', 'bars']) {
    if (!this.dataSocket || this.dataSocket.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Not connected, queuing subscription');
      return;
    }

    const subscription = {
      action: 'subscribe'
    };

    types.forEach(type => {
      subscription[type] = symbols;
    });

    this.dataSocket.send(JSON.stringify(subscription));

    // Track subscriptions
    symbols.forEach(symbol => this.subscriptions.add(symbol));

    console.log('[WebSocket] Subscribed to:', symbols);
  }

  /**
   * Unsubscribe from symbol updates
   */
  unsubscribe(symbols, types = ['trades', 'quotes', 'bars']) {
    if (!this.dataSocket || this.dataSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const unsubscription = {
      action: 'unsubscribe'
    };

    types.forEach(type => {
      unsubscription[type] = symbols;
    });

    this.dataSocket.send(JSON.stringify(unsubscription));

    // Remove from tracking
    symbols.forEach(symbol => this.subscriptions.delete(symbol));

    console.log('[WebSocket] Unsubscribed from:', symbols);
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.dataSocket && this.dataSocket.readyState === WebSocket.OPEN) {
        this.dataSocket.send('ping');
      }
      if (this.tradingSocket && this.tradingSocket.readyState === WebSocket.OPEN) {
        this.tradingSocket.send('ping');
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Handle disconnection and reconnect
   */
  handleDisconnect(streamType) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.isConnected = false;
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`[WebSocket] Reconnecting ${streamType} in ${delay}ms...`);

    setTimeout(() => {
      if (streamType === 'data') {
        this.connectDataStream();
      } else {
        this.connectTradingStream();
      }
    }, delay);
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnect() {
    this.isConnected = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.dataSocket) {
      this.dataSocket.close();
      this.dataSocket = null;
    }

    if (this.tradingSocket) {
      this.tradingSocket.close();
      this.tradingSocket = null;
    }

    this.subscriptions.clear();
    this.listeners.clear();

    console.log('[WebSocket] Disconnected');
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;