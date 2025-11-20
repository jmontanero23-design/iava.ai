/**
 * WebSocket Hook
 * Easy real-time data integration for React components
 */

import { useState, useEffect, useCallback } from 'react';
import websocketService from '../services/websocket.js';

/**
 * Hook for real-time market data
 */
export function useMarketData(symbols) {
  const [quotes, setQuotes] = useState({});
  const [trades, setTrades] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket if not already connected
    const connect = async () => {
      if (!websocketService.isConnected) {
        try {
          await websocketService.initialize();
          setConnected(true);
        } catch (error) {
          console.error('[useMarketData] Failed to connect:', error);
          setConnected(false);
          return;
        }
      } else {
        setConnected(true);
      }

      // Subscribe to symbols
      if (symbols && symbols.length > 0) {
        websocketService.subscribe(symbols, ['quotes', 'trades']);
      }
    };

    connect();

    // Set up listeners
    const handleQuote = (data) => {
      setQuotes(prev => ({
        ...prev,
        [data.symbol]: {
          bid: data.bidPrice,
          ask: data.askPrice,
          bidSize: data.bidSize,
          askSize: data.askSize,
          spread: (data.askPrice - data.bidPrice).toFixed(2),
          timestamp: data.timestamp
        }
      }));
    };

    const handleTrade = (data) => {
      setTrades(prev => ({
        ...prev,
        [data.symbol]: {
          price: data.price,
          size: data.size,
          timestamp: data.timestamp
        }
      }));
    };

    websocketService.on('quote', handleQuote);
    websocketService.on('trade', handleTrade);

    // Cleanup
    return () => {
      websocketService.off('quote', handleQuote);
      websocketService.off('trade', handleTrade);

      if (symbols && symbols.length > 0) {
        websocketService.unsubscribe(symbols);
      }
    };
  }, [symbols]);

  return { quotes, trades, connected };
}

/**
 * Hook for real-time order updates
 */
export function useOrderUpdates(onUpdate) {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket
    const connect = async () => {
      if (!websocketService.isConnected) {
        try {
          await websocketService.initialize();
          setConnected(true);
        } catch (error) {
          console.error('[useOrderUpdates] Failed to connect:', error);
          setConnected(false);
          return;
        }
      } else {
        setConnected(true);
      }
    };

    connect();

    // Set up listener
    const handleOrderUpdate = (data) => {
      setLastUpdate(data);
      if (onUpdate) {
        onUpdate(data);
      }
    };

    websocketService.on('order_update', handleOrderUpdate);

    // Cleanup
    return () => {
      websocketService.off('order_update', handleOrderUpdate);
    };
  }, [onUpdate]);

  return { lastUpdate, connected };
}

/**
 * Hook for real-time price bars
 */
export function usePriceBars(symbol, onBar) {
  const [bars, setBars] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!symbol) return;

    // Initialize WebSocket
    const connect = async () => {
      if (!websocketService.isConnected) {
        try {
          await websocketService.initialize();
          setConnected(true);
        } catch (error) {
          console.error('[usePriceBars] Failed to connect:', error);
          setConnected(false);
          return;
        }
      } else {
        setConnected(true);
      }

      // Subscribe to symbol
      websocketService.subscribe([symbol], ['bars']);
    };

    connect();

    // Set up listener
    const handleBar = (data) => {
      if (data.symbol === symbol) {
        setBars(prev => {
          const newBars = [...prev, data];
          // Keep last 100 bars
          if (newBars.length > 100) {
            newBars.shift();
          }
          return newBars;
        });

        if (onBar) {
          onBar(data);
        }
      }
    };

    websocketService.on('bar', handleBar);

    // Cleanup
    return () => {
      websocketService.off('bar', handleBar);
      if (symbol) {
        websocketService.unsubscribe([symbol], ['bars']);
      }
    };
  }, [symbol, onBar]);

  return { bars, connected };
}

/**
 * Hook for WebSocket connection status
 */
export function useWebSocketStatus() {
  const [connected, setConnected] = useState(websocketService.isConnected);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    // Check connection status periodically
    const interval = setInterval(() => {
      setConnected(websocketService.isConnected);
      setReconnecting(
        websocketService.reconnectAttempts > 0 &&
        websocketService.reconnectAttempts < websocketService.maxReconnectAttempts
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    try {
      await websocketService.initialize();
      setConnected(true);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setConnected(false);
  }, []);

  return { connected, reconnecting, connect, disconnect };
}

/**
 * Hook for subscribing to custom WebSocket events
 */
export function useWebSocketEvent(event, callback) {
  useEffect(() => {
    if (!event || !callback) return;

    websocketService.on(event, callback);

    return () => {
      websocketService.off(event, callback);
    };
  }, [event, callback]);
}