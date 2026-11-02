'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { useAuthStore } from '@/lib/store/use-auth-store';

/**
 * Navbar - Thanh điều hướng chính ứng dụng Kaban Flow
 * Hiển thị logo, liên kết điều hướng và menu người dùng / nút đăng xuất (REQ-AU-05, BR-07)
 */
export function Navbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isInitialized, clearAuth } = useAuthStore();

  const handleLogout = () => {
    // Xóa token khỏi localStorage và reset auth state (BR-07)
    clearAuth();
    // Dọn sạch TanStack Query cache để tránh rò rỉ dữ liệu phiên trước
    queryClient.clear();
    // Chuyển hướng người dùng về trang đăng nhập
    router.push('/login');
  };

  // Lấy chữ cái đầu của tên người dùng hiển thị trên Avatar
  const initialChar = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : user?.email
    ? user.email.trim().charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/boards" className="flex items-center space-x-2 font-bold text-lg text-primary">
            <LayoutDashboard className="h-5 w-5" />
            <span>Kaban Flow</span>
          </Link>
          {user && (
            <nav className="flex items-center space-x-2 text-sm font-medium">
              <Link href="/boards">
                <Button variant="ghost" size="sm">
                  Các bảng
                </Button>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {!isInitialized ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-label="Menu người dùng"
                  className="rounded-full ring-offset-background transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <Avatar className="h-8 w-8 cursor-pointer border">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initialChar}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80"
                >
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium leading-none text-foreground">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-muted" />

                  <DropdownMenu.Item
                    onSelect={handleLogout}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Đăng ký</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
