'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WsMessage, Product } from '../types';
import { useAuthStore } from '../store/authStore';
import { useProductStore } from '../store/productStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
const MAX_RECONNECT_DELAY = 30000;

export interface WsState {
  isConnected: boolean;
  lastEvent: WsMessage | null;
}

type ToastFn = (opts: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;

export function useWebSocket(toast?: ToastFn): WsState {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WsMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  const { accessToken, isAuthenticated } = useAuthStore();
  const { addProduct, updateProduct, removeProduct } = useProductStore();

  const connect = useCallback(() => {
    if (!isAuthenticated || !mounted.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted.current) return;
        setIsConnected(true);
        reconnectDelay.current = 1000;

        // Authenticate WS connection
        if (accessToken) {
          ws.send(JSON.stringify({
            type: 'AUTH',
            payload: { token: accessToken },
            timestamp: new Date().toISOString(),
          }));
        }
      };

      ws.onmessage = (event) => {
        if (!mounted.current) return;
        try {
          const message = JSON.parse(event.data as string) as WsMessage;
          setLastEvent(message);

          switch (message.type) {
            case 'PRODUCT_CREATED': {
              const product = message.payload as Product;
              addProduct(product);
              toast?.({
                title: '✨ New Product',
                description: `"${product.name}" was just added`,
              });
              break;
            }
            case 'PRODUCT_UPDATED': {
              const product = message.payload as Product;
              updateProduct(product);
              toast?.({
                title: '✏️ Product Updated',
                description: `"${product.name}" was updated`,
              });
              break;
            }
            case 'PRODUCT_DELETED': {
              const { id, name } = message.payload as { id: string; name: string };
              removeProduct(id);
              toast?.({
                title: '🗑️ Product Removed',
                description: `"${name}" was deleted`,
                variant: 'destructive',
              });
              break;
            }
            case 'PRICE_CHANGED': {
              const { product, oldPrice, newPrice } = message.payload as {
                product: Product;
                oldPrice: number;
                newPrice: number;
              };
              updateProduct(product);
              toast?.({
                title: '💰 Price Changed',
                description: `"${product.name}" price: $${oldPrice} → $${newPrice}`,
              });
              break;
            }
            case 'STOCK_CHANGED': {
              const { product } = message.payload as { product: Product; oldStock: number; newStock: number };
              updateProduct(product);
              break;
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!mounted.current) return;
        setIsConnected(false);
        wsRef.current = null;

        // Exponential backoff reconnect
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
          connect();
        }, reconnectDelay.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // Retry on connection failure
      reconnectTimer.current = setTimeout(connect, reconnectDelay.current);
    }
  }, [isAuthenticated, accessToken, addProduct, updateProduct, removeProduct, toast]);

  useEffect(() => {
    mounted.current = true;
    connect();

    return () => {
      mounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected, lastEvent };
}
