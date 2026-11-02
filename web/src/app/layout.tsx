import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query/provider';
import { AppToaster } from '@/components/atoms/app-toaster';

export const metadata: Metadata = {
  title: 'Kaban Flow — Quản lý công việc trực quan',
  description: 'Bản sao chức năng Trello tối ưu hiệu năng và giao diện hiện đại',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <QueryProvider>
          {children}
          <AppToaster />
        </QueryProvider>
      </body>
    </html>
  );
}

