'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Button } from '@/components/atoms/button';
import { Spinner } from '@/components/atoms/spinner';
import { getArchivedCards, restoreCard } from '@/lib/api/card-detail';
import { getArchivedLists, restoreList } from '@/lib/api/board-detail';
import { getConflictMessage } from '@/lib/api/client';

interface BoardArchiveDialogProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Tập hợp danh sách và thẻ đã lưu trữ để thành viên bảng có thể tìm lại và khôi phục. */
export function BoardArchiveDialog({ boardId, open, onOpenChange }: BoardArchiveDialogProps) {
  const queryClient = useQueryClient();
  const { data: cards = [], isLoading: isCardsLoading, isError: isCardsError, refetch: refetchCards } = useQuery({
    queryKey: ['archived-cards', boardId],
    queryFn: () => getArchivedCards(boardId),
    enabled: open,
  });
  const { data: lists = [], isLoading: isListsLoading, isError: isListsError, refetch: refetchLists } = useQuery({
    queryKey: ['archived-lists', boardId],
    queryFn: () => getArchivedLists(boardId),
    enabled: open,
  });
  const restoreCardMutation = useMutation({
    mutationFn: (cardId: string) => restoreCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-cards', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Đã khôi phục thẻ.');
    },
    onError: (error) => toast.error(getConflictMessage(error) || 'Không thể khôi phục thẻ. Vui lòng thử lại.'),
  });
  const restoreListMutation = useMutation({
    mutationFn: (listId: string) => restoreList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-lists', boardId] });
      queryClient.invalidateQueries({ queryKey: ['archived-cards', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Đã khôi phục danh sách.');
    },
    onError: () => toast.error('Không thể khôi phục danh sách. Vui lòng thử lại.'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Kho lưu trữ</DialogTitle>
          <DialogDescription>Khôi phục danh sách hoặc thẻ về bảng.</DialogDescription>
        </DialogHeader>

        <section aria-labelledby="archived-lists-heading" className="mt-2">
          <h3 id="archived-lists-heading" className="text-sm font-semibold">Danh sách đã lưu trữ</h3>
          {isListsLoading ? (
            <div className="flex h-20 items-center justify-center"><Spinner /></div>
          ) : isListsError ? (
            <div className="flex items-center justify-between gap-3 py-4">
              <p role="alert" className="text-sm text-destructive">Không thể tải danh sách.</p>
              <Button size="sm" variant="outline" onClick={() => void refetchLists()}>Thử lại</Button>
            </div>
          ) : lists.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Chưa có danh sách nào được lưu trữ.</p>
          ) : (
            <div className="divide-y">
              {lists.map((list) => (
                <div key={list.id} className="flex items-center gap-3 py-3">
                  <p className="min-w-0 flex-1 truncate font-medium" title={list.name}>{list.name}</p>
                  <Button size="sm" variant="outline" disabled={restoreListMutation.isPending}
                    onClick={() => restoreListMutation.mutate(list.id)} aria-label={`Khôi phục danh sách ${list.name}`}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Khôi phục
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="archived-cards-heading" className="mt-4 border-t pt-4">
          <h3 id="archived-cards-heading" className="text-sm font-semibold">Thẻ đã lưu trữ</h3>
          {isCardsLoading ? (
            <div className="flex h-20 items-center justify-center"><Spinner /></div>
          ) : isCardsError ? (
            <div className="flex items-center justify-between gap-3 py-4">
              <p role="alert" className="text-sm text-destructive">Không thể tải thẻ.</p>
              <Button size="sm" variant="outline" onClick={() => void refetchCards()}>Thử lại</Button>
            </div>
          ) : cards.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Archive className="h-4 w-4" /> Chưa có thẻ nào được lưu trữ.
            </div>
          ) : (
            <div className="divide-y">
              {cards.map((card) => (
                <div key={card.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium" title={card.title}>{card.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {card.listName}{card.listArchived ? ' · Khôi phục danh sách gốc trước' : ''}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" disabled={card.listArchived || restoreCardMutation.isPending}
                    onClick={() => restoreCardMutation.mutate(card.id)} aria-label={`Khôi phục thẻ ${card.title}`}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Khôi phục
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
