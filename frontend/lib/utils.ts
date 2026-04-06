import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function formatDate(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(parsedDate.getTime())) {
    return 'Invalid date'; // optional fallback
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsedDate);
}

export const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  manager: 'bg-amber-100 text-amber-700 border-amber-200',
  user: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const ROLE_DOTS: Record<string, string> = {
  admin: '🔴',
  manager: '🟡',
  user: '🟢',
};

export const CATEGORY_COLORS: Record<string, string> = {
  electronics: 'bg-blue-50 text-blue-700 border-blue-200',
  clothing: 'bg-pink-50 text-pink-700 border-pink-200',
  books: 'bg-amber-50 text-amber-700 border-amber-200',
  sports: 'bg-green-50 text-green-700 border-green-200',
};

export const CATEGORY_ICONS: Record<string, string> = {
  electronics: '💻',
  clothing: '👕',
  books: '📚',
  sports: '⚽',
};
