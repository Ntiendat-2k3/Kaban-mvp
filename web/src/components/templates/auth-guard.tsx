'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { Spinner } from '@/components/atoms/spinner';

export interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * Component bảo vệ route (BR-06, SRS §5)
 * - requireAuth = true (mặc định cho Dashboard/Boards): Chưa đăng nhập chuyển /login
 * - requireAuth = false (cho Login/Register): Đã đăng nhập chuyển /boards
 */
export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isInitialized, initAuth } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initAuth();
    }
  }, [isInitialized, initAuth]);

  useEffect(() => {
    if (isLoading || !isInitialized) return;

    if (requireAuth && !user) {
      // Chưa đăng nhập mà truy cập route riêng tư -> chuyển hướng /login kèm redirect param
      const redirectParam = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirectParam}`);
    } else if (!requireAuth && user) {
      // Đã đăng nhập mà truy cập /login hoặc /register -> chuyển /boards
      router.push('/boards');
    }
  }, [user, isLoading, isInitialized, requireAuth, pathname, router]);

  if (isLoading || !isInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-background">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-muted-foreground">Đang tải phiên làm việc...</p>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user) {
    return null;
  }

  return <>{children}</>;
}

export default AuthGuard;
