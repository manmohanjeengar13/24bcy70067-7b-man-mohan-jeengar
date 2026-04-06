'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { ROLE_COLORS, ROLE_DOTS } from '../../lib/utils';
import api from '../../lib/axios';
import CartBadge from '../products/CartBadge';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, refreshToken, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // proceed regardless
    }
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) return null;

  const navLinks = [
    { href: '/products', label: 'Products' },
    ...(user?.role === 'manager' || user?.role === 'admin'
      ? [{ href: '/dashboard', label: 'Dashboard' }]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/products" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              PH
            </div>
            <span className="text-lg font-semibold text-gray-900">ProductHub</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User section */}
          <div className="flex items-center gap-4">
            <CartBadge />
            {user && (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-gray-600 sm:block">{user.name}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}
                >
                  {ROLE_DOTS[user.role]} {user.role}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
