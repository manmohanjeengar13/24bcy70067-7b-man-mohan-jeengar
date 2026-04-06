'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/layout/Navbar';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import ProductGrid from '../../components/products/ProductGrid';
import ProductFiltersBar from '../../components/products/ProductFilters';
import ProductForm from '../../components/products/ProductForm';
import WsIndicator from '../../components/websocket/WsIndicator';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ProductFilters, Product } from '../../types';

// Simple toast state
let toastTimeout: ReturnType<typeof setTimeout>;

export default function ProductsPage() {
  const { products, loading, error, fetchProducts, addProduct } = useProductStore();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [showCreate, setShowCreate] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; title: string; description: string; variant?: string }>>([]);

  const addToast = useCallback((opts: { title: string; description: string; variant?: string }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...opts }]);
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const { isConnected } = useWebSocket(addToast);

  useEffect(() => {
    fetchProducts(filters);
  }, [filters, fetchProducts]);

  const canCreate = user?.role === 'manager' || user?.role === 'admin';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="mt-0.5 text-sm text-gray-500">Browse and manage your product catalog</p>
            </div>
            <div className="flex items-center gap-3">
              <WsIndicator isConnected={isConnected} />
              {canCreate && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  + Add product
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <ProductFiltersBar
              filters={filters}
              onChange={setFilters}
              totalCount={products.length}
            />
          </div>

          {/* Grid */}
          <ProductGrid products={products} loading={loading} error={error} />
        </main>

        {/* Create product modal */}
        {showCreate && (
          <ProductForm
            onClose={() => setShowCreate(false)}
            onSave={(product: Product) => {
              addProduct(product);
              setShowCreate(false);
            }}
          />
        )}

        {/* Toast notifications */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`max-w-sm rounded-xl border px-4 py-3 shadow-lg text-sm animate-fade-in ${
                toast.variant === 'destructive'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-gray-200 bg-white text-gray-800'
              }`}
            >
              <p className="font-semibold">{toast.title}</p>
              <p className="text-xs mt-0.5 opacity-75">{toast.description}</p>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
