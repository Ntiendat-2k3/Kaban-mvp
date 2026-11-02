'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBoard, starBoard, unstarBoard } from '@/lib/api/boards';
import { Board, BoardBackground } from '@/types/board';

/**
 * Hook tập trung quản lý các mutations cho Bảng làm việc
 * Hỗ trợ optimistic updates có rollback (RISK-02)
 */
export function useBoardMutations() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Mutation tạo bảng mới (API-02, BR-03)
  const createMutation = useMutation({
    mutationFn: (data: { name: string; background?: BoardBackground }) => createBoard(data),
    onSuccess: (newBoard) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      // Chuyển hướng ngay tới bảng vừa tạo theo SRS §2
      router.push(`/b/${newBoard.id}`);
    },
  });

  // Mutation gắn/bỏ sao với Optimistic Update và Rollback (API-07, API-08, BR-05, RISK-02)
  const toggleStarMutation = useMutation({
    mutationFn: async ({ boardId, isStarred }: { boardId: string; isStarred: boolean }) => {
      if (isStarred) {
        await unstarBoard(boardId);
      } else {
        await starBoard(boardId);
      }
    },
    onMutate: async ({ boardId, isStarred }) => {
      // Huỷ các queries đang fetch để tránh xung đột
      await queryClient.cancelQueries({ queryKey: ['boards'] });

      // Lưu snapshot trạng thái trước đó để rollback nếu lỗi
      const previousBoards = queryClient.getQueryData<Board[]>(['boards', { includeClosed: false }]);

      // Cập nhật optimistic ngay lập tức trên UI
      queryClient.setQueryData<Board[]>(['boards', { includeClosed: false }], (old) => {
        if (!old) return [];
        return old.map((b) => (b.id === boardId ? { ...b, isStarred: !isStarred } : b));
      });

      return { previousBoards };
    },
    onError: (err, variables, context) => {
      // Rollback lại dữ liệu cũ khi có lỗi phát sinh (RISK-02)
      if (context?.previousBoards) {
        queryClient.setQueryData(['boards', { includeClosed: false }], context.previousBoards);
      }
    },
    onSettled: () => {
      // Đồng bộ lại dữ liệu chuẩn từ server
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  return {
    createBoard: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    toggleStar: toggleStarMutation.mutate,
    isTogglingStar: toggleStarMutation.isPending,
  };
}
