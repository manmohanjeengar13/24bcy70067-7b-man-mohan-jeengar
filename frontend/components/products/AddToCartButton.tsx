'use client';

import { useState } from 'react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';

interface CartItemProps {
  product: Product;
}

export default function AddToCartButton({ product }: CartItemProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem, loading, error } = useCartStore();

  const handleAddToCart = async () => {
    try {
      await addItem(product, quantity);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
      setQuantity(1);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100"
            disabled={loading}
          >
            −
          </button>
          <span className="px-6 py-2 font-semibold text-center min-w-24">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100"
            disabled={loading}
          >
            +
          </button>
        </div>
        <span className="text-sm text-gray-600">
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleAddToCart}
        disabled={product.stock === 0 || loading}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          isAdded
            ? 'bg-green-600 text-white'
            : product.stock === 0 || loading
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? 'Adding...' : isAdded ? '✓ Added to Cart' : 'Add to Cart'}
      </button>
    </div>
  );
}
