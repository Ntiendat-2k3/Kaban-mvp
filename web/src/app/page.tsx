import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { LayoutDashboard, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 p-6 text-center">
      <div className="mx-auto flex max-w-2xl flex-col items-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LayoutDashboard className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Quản lý công việc thông minh cùng Kaban Flow
        </h1>
        <p className="text-lg text-muted-foreground">
          Bảng Kanban trực quan, tối ưu tốc độ và kéo thả mượt mà theo thời gian thực.
        </p>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button size="lg" className="space-x-2">
              <span>Bắt đầu ngay</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/boards">
            <Button variant="outline" size="lg">
              Xem các bảng
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

