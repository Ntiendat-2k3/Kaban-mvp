'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/templates/dashboard-layout';
import { BoardHeader } from '@/components/organisms/board-header';
import { BoardCanvas } from '@/components/organisms/board-canvas';
import { BoardFilterBar } from '@/components/molecules/board-filter-bar';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import {
  getBoardDetail,
  updateBoard,
  archiveBoard,
  starBoard,
  unstarBoard,
} from '@/lib/api/boards';
import {
  createList,
  updateList,
  archiveList,
  createCard,
  duplicateCard,
} from '@/lib/api/board-detail';
import { deleteCard, updateCard } from '@/lib/api/card-detail';
import { useBoardFilter } from '@/hooks/use-board-filter';
import { BoardBackground, BOARD_BACKGROUND_COLORS, BoardMember } from '@/types/board';
import { BoardDetail, BoardLabel } from '@/types/board-detail';

export default function BoardDetailPage({ params }: { params: { boardId: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { boardId } = params;

  // Lấy chi tiết bảng đầy đủ cấu trúc BoardDetail
  const {
    data: board,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<BoardDetail>({
    queryKey: ['board', boardId],
    queryFn: () => getBoardDetail(boardId),
    retry: 1,
  });

  // Bộ lọc thẻ phía client (SRS §8, BR-09, RISK-02)
  const listsData = useMemo(() => board?.lists || [], [board?.lists]);
  const {
    filters,
    setFilters,
    isFilterActive,
    resetFilters,
    filteredLists,
    totalMatches,
    totalCards,
  } = useBoardFilter(listsData);

  // Bản đồ Nhãn và Thành viên để render nhanh chóng trên CardTile
  const labelsMap = useMemo(() => {
    const map = new Map<string, BoardLabel>();
    (board?.labels || []).forEach((l) => map.set(l.id, l));
    return map;
  }, [board?.labels]);

  const membersMap = useMemo(() => {
    const map = new Map<string, BoardMember>();
    (board?.members || []).forEach((m) => map.set(m.userId, m));
    return map;
  }, [board?.members]);

  // Giữ màu nền và tên bảng phản hồi ngay, rồi đồng bộ lại với dữ liệu từ API.
  const updateMutation = useMutation({
    mutationFn: (patch: { name?: string; background?: BoardBackground }) =>
      updateBoard(boardId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });
      const previous = queryClient.getQueryData<BoardDetail>(['board', boardId]);
      queryClient.setQueryData<BoardDetail>(['board', boardId], (current) =>
        current
          ? { ...current, ...patch, board: { ...current.board, ...patch } }
          : current
      );
      return { previous };
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (current) =>
        current
          ? { ...current, ...updated, board: { ...current.board, ...updated } }
          : current
      );
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['board', boardId], context.previous);
      }
      toast.error('Không thể cập nhật bảng. Vui lòng thử lại.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  // Mutation toggle sao với optimistic update
  const toggleStarMutation = useMutation({
    mutationFn: async () => {
      if (!board) return;
      if (board.isStarred) {
        await unstarBoard(boardId);
      } else {
        await starBoard(boardId);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });
      const previous = queryClient.getQueryData<BoardDetail>(['board', boardId]);
      if (previous) {
        queryClient.setQueryData<BoardDetail>(['board', boardId], {
          ...previous,
          isStarred: !previous.isStarred,
        });
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['board', boardId], context.previous);
      }
      toast.error('Không thể thay đổi trạng thái đánh dấu sao.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  // Mutation đóng bảng (archive)
  const archiveMutation = useMutation({
    mutationFn: () => archiveBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      router.push('/boards');
    },
  });

  // Mutations quản lý danh sách (Lists)
  const createListMutation = useMutation({
    mutationFn: (name: string) => createList(boardId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const updateListMutation = useMutation({
    mutationFn: ({ listId, name }: { listId: string; name: string }) =>
      updateList(listId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const archiveListMutation = useMutation({
    mutationFn: (listId: string) => archiveList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const updateWipMutation = useMutation({
    mutationFn: ({ listId, wipLimit }: { listId: string; wipLimit: number | null }) => updateList(listId, { wipLimit }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
    onError: () => toast.error('Không thể cập nhật giới hạn thẻ.'),
  });

  const updateListColorMutation = useMutation({
    mutationFn: ({ listId, color }: { listId: string; color: BoardBackground | null }) => updateList(listId, { color }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
    onError: () => toast.error('Không thể đổi màu cột.'),
  });

  // Mutation tạo thẻ nhanh (SRS §5, BR-06, API-06)
  const createCardMutation = useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      createCard(listId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Xử lý trạng thái lỗi hoặc Non-member 404 (BR-09)
  if (isError) {
    const isNotFound = isAxiosError(error) && error.response?.status === 404;
    return (
      <DashboardLayout contentClassName="p-0">
        <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isNotFound ? 'Không tìm thấy bảng' : 'Không thể tải bảng'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isNotFound
              ? 'Bảng này không tồn tại hoặc bạn không có quyền truy cập.'
              : 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.'}
          </p>
          {!isNotFound && (
            <Button className="mt-6" onClick={() => refetch()} disabled={isFetching}>
              Thử lại
            </Button>
          )}
          <Link href="/boards" className="mt-6">
            <Button variant="default" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại các bảng</span>
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Trạng thái đang tải dữ liệu
  if (isLoading || !board) {
    return (
      <DashboardLayout contentClassName="p-0">
        <div className="flex h-14 w-full items-center justify-between border-b px-6 bg-muted/40">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="p-6">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  const bgConfig = BOARD_BACKGROUND_COLORS[board.background] || BOARD_BACKGROUND_COLORS.blue;

  return (
    <DashboardLayout contentClassName="p-0">
      <div
        className="board-surface flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col overflow-hidden"
        style={{ '--board-accent': bgConfig.hex } as React.CSSProperties}
      >
        {/* Header trang bảng (SRS §3, §4, §5) */}
        <BoardHeader
          board={board}
          onUpdateName={(name) => updateMutation.mutate({ name })}
          onUpdateBackground={(background) => updateMutation.mutate({ background })}
          onToggleStar={() => toggleStarMutation.mutate()}
          onArchive={() => archiveMutation.mutate()}
          onOpenMembers={() => {
            const trigger = document.getElementById('board-members-dialog-trigger');
            if (trigger) trigger.click();
          }}
          isUpdating={updateMutation.isPending}
        />

        {/* Thanh lọc thẻ client (SRS §8, BR-09, RISK-02) */}
        <BoardFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
          isFilterActive={isFilterActive}
          totalMatches={totalMatches}
          totalCards={totalCards}
          labels={board.labels || []}
          members={board.members || []}
        />

        {/* Khung Canvas Kanban cuộn ngang với danh sách các cột và thẻ (SRS §1, §2, §4, §6) */}
        <main className="flex-1 overflow-hidden">
          <BoardCanvas
            boardId={boardId}
            lists={filteredLists}
            labelsMap={labelsMap}
            membersMap={membersMap}
            onListsChange={(newLists) => {
              // Cập nhật ngay cache để UI mượt mà (Optimistic)
              queryClient.setQueryData(['board', boardId], (old: any) => {
                if (!old) return old;
                return {
                  ...old,
                  lists: newLists,
                };
              });
            }}
            onCreateList={async (name) => {
              await createListMutation.mutateAsync(name);
            }}
            onUpdateListTitle={(listId, name) => {
              updateListMutation.mutate({ listId, name });
            }}
            onUpdateListWipLimit={(listId, wipLimit) => updateWipMutation.mutate({ listId, wipLimit })}
            onUpdateListColor={(listId, color) => updateListColorMutation.mutate({ listId, color })}
            onArchiveList={(listId) => {
              archiveListMutation.mutate(listId);
            }}
            onQuickCreateCard={async (listId, title) => {
              await createCardMutation.mutateAsync({ listId, title });
            }}
            onDuplicateCard={async (cardId) => {
              const copied = await duplicateCard(cardId);
              queryClient.setQueryData<BoardDetail>(['board', boardId], (current) => current && ({
                ...current,
                lists: current.lists.map((list) => {
                  if (list.id !== copied.listId) return list;
                  const cards = [...list.cards];
                  const index = cards.findIndex((card) => card.id === cardId);
                  cards.splice(index + 1, 0, copied);
                  return { ...list, cards };
                }),
              }));
              queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            }}
            onRenameCard={async (cardId, title) => {
              await updateCard(cardId, { title });
              queryClient.setQueryData<BoardDetail>(['board', boardId], (current) => current && ({
                ...current,
                lists: current.lists.map((list) => ({
                  ...list,
                  cards: list.cards.map((card) => card.id === cardId ? { ...card, title } : card),
                })),
              }));
              queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            }}
            onDeleteCard={async (cardId) => {
              await deleteCard(cardId);
              queryClient.setQueryData<BoardDetail>(['board', boardId], (current) => current && ({
                ...current,
                lists: current.lists.map((list) => ({
                  ...list,
                  cards: list.cards.filter((card) => card.id !== cardId),
                })),
              }));
              queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            }}
            isFilterActive={isFilterActive}
          />
        </main>
      </div>
    </DashboardLayout>
  );
}
