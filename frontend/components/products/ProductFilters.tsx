'use client';

import { Category, ProductFilters, SortOption } from '../../types';

const CATEGORIES: { value: Category | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'electronics', label: '💻 Electronics' },
  { value: 'clothing', label: '👕 Clothing' },
  { value: 'books', label: '📚 Books' },
  { value: 'sports', label: '⚽ Sports' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'Name: A → Z' },
  { value: 'name_desc', label: 'Name: Z → A' },
];

interface ProductFiltersProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  totalCount: number;
}

export default function ProductFiltersBar({ filters, onChange, totalCount }: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-gray-500 font-medium">{totalCount} products</span>

      <div className="flex items-center gap-2 ml-auto">
        {/* Category filter */}
        <select
          value={filters.category ?? ''}
          onChange={(e) =>
            onChange({ ...filters, category: e.target.value as Category | '' })
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sort ?? 'created_desc'}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOption })}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {(filters.category || filters.sort) && (
          <button
            onClick={() => onChange({})}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm transition hover:border-gray-300 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
