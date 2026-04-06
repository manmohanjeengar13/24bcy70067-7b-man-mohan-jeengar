'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types';

const ROLE_HIERARCHY: Record<Role, number> = {
  user: 1,
  manager: 2,
  admin: 3,
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  minRole?: Role;
}

export default function ProtectedRoute({ children, minRole = 'user' }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user && ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minRole]) {
      router.replace('/products');
    }
  }, [isAuthenticated, user, minRole, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minRole]) {
    return null;
  }

  return <>{children}</>;
}
