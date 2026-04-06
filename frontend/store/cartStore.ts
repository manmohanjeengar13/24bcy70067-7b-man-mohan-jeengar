'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '../types';
import api from '../lib/axios';

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      fetchCart: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.get('/cart');
          const cart = response.data.data?.cart;
          if (cart) {
            const items = cart.items.map(
              (item: {
                product_id: string;
                quantity: number;
                price: number;
              }) => ({
                id: item.product_id,
                productId: item.product_id,
                productName: '', // Will be updated from product name
                price: item.price,
                quantity: item.quantity,
                category: 'electronics' as const,
              })
            );
            set({ items, loading: false });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to fetch cart';
          set({ error: errorMsg, loading: false });
        }
      },

      addItem: async (product: Product, quantity: number) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/cart/items', {
            product_id: product.id,
            quantity,
          });

          if (response.data.data?.cart) {
            const cart = response.data.data.cart;
            const items = cart.items.map(
              (item: {
                product_id: string;
                quantity: number;
                price: number;
              }) => ({
                id: `${item.product_id}-item`,
                productId: item.product_id,
                productName: product.name,
                price: item.price,
                quantity: item.quantity,
                category: product.category,
              })
            );
            set({ items, loading: false });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to add item';
          set({ error: errorMsg, loading: false });
          throw err;
        }
      },

      removeItem: async (productId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await api.delete(`/cart/items/${productId}`);

          if (response.data.data?.cart) {
            const cart = response.data.data.cart;
            set((state) => {
              const items = cart.items.map(
                (item: {
                  product_id: string;
                  quantity: number;
                  price: number;
                }) => ({
                  id: `${item.product_id}-item`,
                  productId: item.product_id,
                  productName:
                    state.items.find((i) => i.productId === item.product_id)?.productName || '',
                  price: item.price,
                  quantity: item.quantity,
                  category:
                    state.items.find((i) => i.productId === item.product_id)?.category ||
                    ('electronics' as const),
                })
              );
              return { items, loading: false };
            });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to remove item';
          set({ error: errorMsg, loading: false });
          throw err;
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        set({ loading: true, error: null });
        try {
          if (quantity <= 0) {
            await get().removeItem(productId);
            return;
          }

          const response = await api.put(`/cart/items/${productId}`, { quantity });

          if (response.data.data?.cart) {
            const cart = response.data.data.cart;
            set((state) => {
              const items = cart.items.map(
                (item: {
                  product_id: string;
                  quantity: number;
                  price: number;
                }) => ({
                  id: `${item.product_id}-item`,
                  productId: item.product_id,
                  productName:
                    state.items.find((i) => i.productId === item.product_id)?.productName || '',
                  price: item.price,
                  quantity: item.quantity,
                  category:
                    state.items.find((i) => i.productId === item.product_id)?.category ||
                    ('electronics' as const),
                })
              );
              return { items, loading: false };
            });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to update quantity';
          set({ error: errorMsg, loading: false });
          throw err;
        }
      },

      clearCart: async () => {
        set({ loading: true, error: null });
        try {
          await api.delete('/cart');
          set({ items: [], loading: false });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to clear cart';
          set({ error: errorMsg, loading: false });
          throw err;
        }
      },

      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'cart-store',
    }
  )
);
