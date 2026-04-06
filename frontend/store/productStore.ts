'use client';

import { create } from 'zustand';
import { Product, ProductFilters } from '../types';
import api from '../lib/axios';

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
}

export const useProductStore = create<ProductState>()((set) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async (filters?: ProductFilters) => {
    set({ loading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (filters?.category) params.category = filters.category;
      if (filters?.sort) params.sort = filters.sort;

      const response = await api.get('/products', { params });
      const { products } = response.data.data as { products: Product[] };
      set({ products, loading: false });
    } catch {
      set({ error: 'Failed to fetch products', loading: false });
    }
  },

  addProduct: (product) =>
    set((state) => ({ products: [product, ...state.products] })),

  updateProduct: (product) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === product.id ? product : p)),
    })),

  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
}));
