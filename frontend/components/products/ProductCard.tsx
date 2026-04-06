'use client';

import { useState } from 'react';
import { Product } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useProductStore } from '../../store/productStore';
import { formatPrice, formatDate, CATEGORY_COLORS, CATEGORY_ICONS } from '../../lib/utils';
import api from '../../lib/axios';
import ProductForm from './ProductForm';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuthStore();
  const { removeProduct, updateProduct } = useProductStore();
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = user?.role === 'manager' || user?.role === 'admin';
  const canDelete = user?.role === 'admin';

  const handleDelete = async () => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${product.id}`);
      removeProduct(product.id);
    } catch {
      alert('Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const stockStatus =
    product.stock === 0
      ? { label: 'Out of stock', class: 'text-red-600 bg-red-50 border-red-200' }
      : product.stock < 10
      ? { label: `Low stock (${product.stock})`, class: 'text-amber-600 bg-amber-50 border-amber-200' }
      : { label: `${product.stock} in stock`, class: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

  return (
    <>
      <div className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in">
        {/* Category header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-100 px-4 py-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[product.category]}`}
          >
            {CATEGORY_ICONS[product.category]} {product.category}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stockStatus.class}`}
          >
            {stockStatus.label}
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-base font-semibold text-gray-900 leading-snug">{product.name}</h3>
          {product.description && (
            <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
          <div className="mt-auto pt-4">
            <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="rounded-b-2xl border-t border-gray-100 bg-gray-50/60 px-4 py-3">
          {canEdit || canDelete ? (
            // Admin/Manager view
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{formatDate(product.created_at)}</span>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => setShowEdit(true)}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {deleting ? '…' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Customer view - Show AddToCartButton
            <AddToCartButton product={product} />
          )}
        </div>
      </div>

      {showEdit && (
        <ProductForm
          product={product}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => {
            updateProduct(updated);
            setShowEdit(false);
          }}
        />
      )}
    </>
  );
}
