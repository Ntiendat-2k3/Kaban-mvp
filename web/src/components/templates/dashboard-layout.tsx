'use client';

import React from 'react';
import { Navbar } from '@/components/organisms/navbar';
import { AuthGuard } from '@/components/templates/auth-guard';
import { cn } from '@/lib/utils';

export function DashboardLayout({
  children,
  contentClassName,
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <AuthGuard requireAuth={true}>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className={cn('flex-1 p-6', contentClassName)}>{children}</main>
      </div>
    </AuthGuard>
  );
}

export default DashboardLayout;
