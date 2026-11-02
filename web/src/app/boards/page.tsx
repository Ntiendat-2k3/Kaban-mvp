'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Layout, Plus, AlertCircle, Archive, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/templates/dashboard-layout';
import { BoardCard } from '@/components/molecules/board-card';
import { CreateBoardDialog } from '@/components/organisms/create-board-dialog';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import { getBoards, restoreBoard, starBoard, unstarBoard } from '@/lib/api/boards';
import { Board } from '@/types/board';

export default function BoardsPage() {
  const queryClient = useQueryClient();
  const [includeClosed, setIncludeClosed] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Truy vấn danh sách bảng
  const {
    data: boards = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['boards', { includeClosed }],
    queryFn: () => getBoards(includeClosed),
  });

  // Mutation mở lại bảng đã đóng
  const restoreMutation = useMutation({
    mutationFn: (boardId: string) => restoreBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  // Mutation toggle sao với optimistic update (BR-05)
  const toggleStarMutation = useMutation({
    mutationFn: async ({ boardId, currentStarred }: { boardId: string; currentStarred: boolean }) => {
      if (currentStarred) {
        await unstarBoard(boardId);
      } else {
        await starBoard(boardId);
      }
    },
    onMutate: async ({ boardId, currentStarred }) => {
      await queryClient.cancelQueries({ queryKey: ['boards', { includeClosed }] });
      const previousBoards = queryClient.getQueryData<Board[]>(['boards', { includeClosed }]);

      queryClient.setQueryData<Board[]>(['boards', { includeClosed }], (old) => {
        if (!old) return [];
        return old.map((b) => (b.id === boardId ? { ...b, isStarred: !currentStarred } : b));
      });

      return { previousBoards };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(['boards', { includeClosed }], context.previousBoards);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  const handleToggleStar = (boardId: string, currentStarred: boolean) => {
    toggleStarMutation.mutate({ boardId, currentStarred });
  };

  const handleRestore = (boardId: string) => {
    restoreMutation.mutate(boardId);
  };

  // Lọc bảng đã gắn sao (chỉ áp dụng cho các bảng đang hoạt động)
  const starredBoards = boards.filter((b) => b.isStarred && !b.archived);

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Header trang và điều khiển */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Các không gian làm việc
            </h1>
            <p className="text-sm text-muted-foreground">
              Quản lý các bảng công việc của bạn và bảng bạn tham gia
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Công tắc Bảng đã đóng (SRS §1, §5) */}
            <Button
              variant={includeClosed ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIncludeClosed(!includeClosed)}
              className="flex items-center space-x-1.5"
            >
              <Archive className="h-4 w-4" />
              <span>{includeClosed ? 'Xem bảng đang mở' : 'Bảng đã đóng'}</span>
            </Button>

            {!includeClosed && (
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo bảng mới</span>
              </Button>
            )}
          </div>
        </div>

        {/* Trạng thái lỗi (BR-02) */}
        {isError && (
          <div
            role="alert"
            className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center"
          >
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="text-lg font-semibold text-destructive">Không thể tải danh sách bảng</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {(error as any)?.message || 'Đã xảy ra lỗi trong quá trình kết nối với máy chủ.'}
            </p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4">
              <RotateCcw className="mr-2 h-4 w-4" />
              <span>Thử lại</span>
            </Button>
          </div>
        )}

        {/* Trạng thái đang tải (BR-02) */}
        {isLoading && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {/* Trạng thái rỗng (BR-02) */}
        {!isLoading && !isError && boards.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <Layout className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              {includeClosed ? 'Không có bảng nào đã đóng' : 'Chưa có bảng nào'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {includeClosed
                ? 'Các bảng được lưu trữ sẽ xuất hiện ở đây khi bạn đóng chúng.'
                : 'Bắt đầu bằng cách tạo bảng công việc đầu tiên của bạn.'}
            </p>
            {!includeClosed && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Tạo bảng mới</span>
              </Button>
            )}
          </div>
        )}

        {/* Danh sách bảng (BR-01) */}
        {!isLoading && !isError && boards.length > 0 && (
          <div className="space-y-8">
            {/* Nhóm Đã gắn sao (chỉ hiện khi có ít nhất 1 bảng có star và không ở chế độ closed) */}
            {!includeClosed && starredBoards.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-base font-semibold text-foreground">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />
                  <h2>Đã gắn sao</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {starredBoards.map((board) => (
                    <BoardCard
                      key={`starred-${board.id}`}
                      board={board}
                      onToggleStar={handleToggleStar}
                      isStarLoading={toggleStarMutation.isPending}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Nhóm Tất cả bảng hoặc Bảng đã đóng */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-base font-semibold text-foreground">
                {includeClosed ? (
                  <>
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    <h2>Bảng đã đóng</h2>
                  </>
                ) : (
                  <>
                    <Layout className="h-5 w-5 text-muted-foreground" />
                    <h2>Tất cả bảng</h2>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {boards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    onToggleStar={handleToggleStar}
                    onRestore={handleRestore}
                    isStarLoading={toggleStarMutation.isPending}
                    isRestoreLoading={restoreMutation.isPending}
                  />
                ))}
                {!includeClosed && (
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="flex h-28 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-3 text-muted-foreground transition-all hover:border-primary/50 hover:bg-muted/40 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <Plus className="mb-1 h-5 w-5" />
                    <span className="text-sm font-medium">Tạo bảng mới</span>
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Modal tạo bảng mới (REQ-BD-02, BR-03) */}
        <CreateBoardDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>
    </DashboardLayout>
  );
}
