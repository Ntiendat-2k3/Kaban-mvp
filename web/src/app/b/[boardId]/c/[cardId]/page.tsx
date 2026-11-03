'use client';

import React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  getCardDetail,
  updateCard,
  archiveCard,
  restoreCard,
  addCardLabel,
  removeCardLabel,
  createBoardLabel,
  updateBoardLabel,
  deleteBoardLabel,
  addCardMember,
  removeCardMember,
  createChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  createComment,
  updateComment,
  deleteComment,
} from '@/lib/api/card-detail';
import { getBoardDetail } from '@/lib/api/boards';
import {
  getAttachments,
  uploadAttachment,
  deleteAttachment,
  duplicateAttachment,
  setAttachmentCover,
} from '@/lib/api/attachments';
import { CardDetailModal } from '@/components/organisms/card-detail-modal';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import { BoardDetail } from '@/types/board-detail';
import { CardDetail, CardPatchInput } from '@/types/card-detail';
import { Attachment } from '@/types/attachment';

export default function CardModalPage({
  params,
}: {
  params: { boardId: string; cardId: string };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { boardId, cardId } = params;

  // Lấy chi tiết thẻ (SRS §1, API-08, BR-01)
  const {
    data: card,
    isLoading: isCardLoading,
    isError: isCardError,
    refetch,
  } = useQuery<CardDetail>({
    queryKey: ['card', cardId],
    queryFn: () => getCardDetail(cardId),
    retry: 1,
  });

  // Lấy chi tiết bảng để lấy danh sách nhãn và thành viên bảng (SRS §3, §4)
  const { data: board } = useQuery<BoardDetail>({
    queryKey: ['board', boardId],
    queryFn: () => getBoardDetail(boardId),
  });

  const handleClose = () => {
    router.push(`/b/${boardId}`);
  };

  // Mutation Cập nhật thẻ (SRS §2, §5, API-09, BR-02, BR-05)
  const updateCardMutation = useMutation({
    mutationFn: (patch: CardPatchInput) => updateCard(cardId, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(['card', cardId], updated);
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật thẻ');
    },
  });

  // Mutation Lưu trữ thẻ (SRS §8, API-10, BR-08, TC-03.1-04)
  const archiveMutation = useMutation({
    mutationFn: () => archiveCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu trữ thẻ');
    },
  });

  // Mutation Khôi phục thẻ (SRS §8, API-11, BR-08, RISK-02, TC-03.1-05, TC-03.1-06)
  const restoreMutation = useMutation({
    mutationFn: () => restoreCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
    onError: (err: any) => {
      const msg =
        err.response?.status === 409 || err.response?.data?.error?.code === 'LIST_ARCHIVED'
          ? 'Không thể khôi phục vì danh sách gốc của thẻ này đã bị lưu trữ.'
          : err.response?.data?.message || 'Không thể khôi phục thẻ';
      toast.error(msg);
    },
  });

  // Mutations Nhãn (SRS §3, BR-03, API-12, 13, 16, 17, 18)
  const toggleLabelMutation = useMutation({
    mutationFn: async ({ labelId, isAssigned }: { labelId: string; isAssigned: boolean }) => {
      if (isAssigned) {
        await removeCardLabel(cardId, labelId);
      } else {
        await addCardLabel(cardId, labelId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const createLabelMutation = useMutation({
    mutationFn: ({ color, name }: { color: string; name?: string }) =>
      createBoardLabel(boardId, color, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const updateLabelMutation = useMutation({
    mutationFn: ({ labelId, patch }: { labelId: string; patch: { color?: string; name?: string } }) =>
      updateBoardLabel(labelId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (labelId: string) => deleteBoardLabel(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });

  // Mutations Thành viên (SRS §4, BR-04, API-14, 15)
  const toggleMemberMutation = useMutation({
    mutationFn: async ({ userId, isAssigned }: { userId: string; isAssigned: boolean }) => {
      if (isAssigned) {
        await removeCardMember(cardId, userId);
      } else {
        await addCardMember(cardId, userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutations Checklists (SRS §6, BR-06, API-19, 20, 21, 22, 23)
  const createChecklistMutation = useMutation({
    mutationFn: (title: string) => createChecklist(cardId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: (checklistId: string) => deleteChecklist(checklistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: ({ checklistId, text }: { checklistId: string; text: string }) =>
      createChecklistItem(checklistId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: { text?: string; done?: boolean } }) =>
      updateChecklistItem(itemId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteChecklistItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutations Bình luận (SRS §7, BR-07, API-24, 25, 26)
  const createCommentMutation = useMutation({
    mutationFn: (text: string) => createComment(cardId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi bình luận');
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      updateComment(commentId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi sửa bình luận');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi xoá bình luận');
    },
  });

  // Lấy danh sách tệp đính kèm của thẻ (API-28, REQ-ATT-02, BR-03, TC-02.1-04)
  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['card-attachments', cardId],
    queryFn: () => getAttachments(cardId),
    enabled: !!cardId,
  });

  // Mutation Tải lên tệp đính kèm (API-27, REQ-ATT-01, BR-01, BR-02, TC-02.1-01)
  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(cardId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-attachments', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation Xoá tệp đính kèm (API-29, REQ-ATT-02, BR-03, TC-02.1-05)
  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(cardId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-attachments', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation Đổi ảnh/video bìa (API-30, REQ-ATT-04, BR-05, TC-02.1-06)
  const toggleAttachmentCoverMutation = useMutation({
    mutationFn: ({ attachmentId, currentIsCover }: { attachmentId: string; currentIsCover: boolean }) =>
      setAttachmentCover(cardId, attachmentId, !currentIsCover),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-attachments', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // 1. Trạng thái không tìm thấy hoặc lỗi (SRS §1, BR-01, TC-03.1-03)
  if (isCardError) {
    return (
      <Dialog.Root open onOpenChange={(open) => !open && handleClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-background p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Không tìm thấy thẻ</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Thẻ này có thể đã bị xoá hoặc bạn không có quyền truy cập vào thẻ này.
              </p>
              <div className="mt-6 flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  <span>Thử lại</span>
                </Button>
                <Button size="sm" onClick={handleClose}>
                  <span>Đóng</span>
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  // 2. Trạng thái đang tải dữ liệu (SRS §1)
  if (isCardLoading || !card) {
    return (
      <Dialog.Root open onOpenChange={(open) => !open && handleClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-3xl translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-background p-6 shadow-2xl">
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="md:col-span-2 space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  const targetList = board?.lists?.find((l) => l.id === card.listId);

  return (
    <>
      <CardDetailModal
        boardId={boardId}
        card={card}
        listName={targetList?.name}
        boardLabels={board?.labels || []}
        boardMembers={board?.members || []}
        onArchive={async () => {
          await archiveMutation.mutateAsync();
        }}
        onRestore={async () => {
          await restoreMutation.mutateAsync();
        }}
        onUpdateTitle={async (newTitle) => {
          await updateCardMutation.mutateAsync({ title: newTitle });
        }}
        onUpdateDescription={async (newDesc) => {
          await updateCardMutation.mutateAsync({ description: newDesc });
        }}
        onUpdateDueDate={async (newDueDate, dueComplete) => {
          await updateCardMutation.mutateAsync({ dueDate: newDueDate, dueComplete });
        }}
        onToggleDueComplete={async (complete) => {
          await updateCardMutation.mutateAsync({ dueComplete: complete });
        }}
        onToggleLabel={async (labelId, isAssigned) => {
          await toggleLabelMutation.mutateAsync({ labelId, isAssigned });
        }}
        onCreateLabel={async (color, name) => {
          await createLabelMutation.mutateAsync({ color, name });
        }}
        onUpdateLabel={async (labelId, patch) => {
          await updateLabelMutation.mutateAsync({ labelId, patch });
        }}
        onDeleteLabel={async (labelId) => {
          await deleteLabelMutation.mutateAsync(labelId);
        }}
        onToggleMember={async (userId, isAssigned) => {
          await toggleMemberMutation.mutateAsync({ userId, isAssigned });
        }}
        onCreateChecklist={async (title) => {
          await createChecklistMutation.mutateAsync(title);
        }}
        onDeleteChecklist={async (checklistId) => {
          await deleteChecklistMutation.mutateAsync(checklistId);
        }}
        onCreateChecklistItem={async (checklistId, text) => {
          await createItemMutation.mutateAsync({ checklistId, text });
        }}
        onUpdateChecklistItem={async (itemId, patch) => {
          await updateItemMutation.mutateAsync({ itemId, patch });
        }}
        onDeleteChecklistItem={async (itemId) => {
          await deleteItemMutation.mutateAsync(itemId);
        }}
        onCreateComment={async (text) => {
          await createCommentMutation.mutateAsync(text);
        }}
        onUpdateComment={async (commentId, text) => {
          await updateCommentMutation.mutateAsync({ commentId, text });
        }}
        onDeleteComment={async (commentId) => {
          await deleteCommentMutation.mutateAsync(commentId);
        }}
        attachments={attachments.length > 0 ? attachments : (card as any)?.attachments || []}
        isUploadingAttachment={uploadAttachmentMutation.isPending}
        onUploadAttachment={async (file) => {
          await uploadAttachmentMutation.mutateAsync(file);
        }}
        onDeleteAttachment={async (attachmentId) => {
          await deleteAttachmentMutation.mutateAsync(attachmentId);
        }}
        onDuplicateAttachment={async (attachmentId) => {
          await duplicateAttachment(cardId, attachmentId);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['card-attachments', cardId] }),
            queryClient.invalidateQueries({ queryKey: ['card', cardId] }),
          ]);
        }}
        onToggleAttachmentCover={async (attachmentId, currentIsCover) => {
          await toggleAttachmentCoverMutation.mutateAsync({ attachmentId, currentIsCover });
        }}
      />
    </>
  );
}
