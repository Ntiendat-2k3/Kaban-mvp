'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  CreditCard,
  Archive,
  RotateCcw,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { CardDetail } from '@/types/card-detail';
import { BoardLabel } from '@/types/board-detail';
import { BoardMember } from '@/types/board';
import { Attachment } from '@/types/attachment';
import { CardTitleEditor } from '@/components/molecules/card-title-editor';
import { CardDescriptionEditor } from '@/components/molecules/card-description-editor';
import { CardDueDatePicker } from '@/components/molecules/card-due-date-picker';
import {
  CardLabelsPopover,
} from '@/components/molecules/card-labels-popover';
import { CardMembersPopover } from '@/components/molecules/card-members-popover';
import {
  CardChecklistSection,
  AddChecklistButton,
} from '@/components/molecules/card-checklist-section';
import { CardCommentsSection } from '@/components/molecules/card-comments-section';
import { CardAttachmentSection } from '@/components/molecules/card-attachment-section';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { cn } from '@/lib/utils';
import { LABEL_COLOR_CONFIG } from '@/lib/label-colors';

export interface CardDetailModalProps {
  boardId: string;
  card: CardDetail;
  listName?: string;
  boardLabels?: BoardLabel[];
  boardMembers?: BoardMember[];
  onArchive: () => Promise<void>;
  onRestore: () => Promise<void>;
  onUpdateTitle?: (newTitle: string) => Promise<void>;
  onUpdateDescription?: (newDescription: string) => Promise<void>;
  onUpdateDueDate?: (dueDate: string | null, dueComplete?: boolean) => Promise<void>;
  onToggleDueComplete?: (complete: boolean) => Promise<void>;
  onToggleLabel?: (labelId: string, isAssigned: boolean) => Promise<void>;
  onCreateLabel?: (color: string, name?: string) => Promise<void>;
  onUpdateLabel?: (labelId: string, patch: { color?: string; name?: string }) => Promise<void>;
  onDeleteLabel?: (labelId: string) => Promise<void>;
  onToggleMember?: (userId: string, isAssigned: boolean) => Promise<void>;
  onCreateChecklist?: (title: string) => Promise<void>;
  onDeleteChecklist?: (checklistId: string) => Promise<void>;
  onCreateChecklistItem?: (checklistId: string, text: string) => Promise<void>;
  onUpdateChecklistItem?: (itemId: string, patch: { text?: string; done?: boolean }) => Promise<void>;
  onDeleteChecklistItem?: (itemId: string) => Promise<void>;
  onCreateComment?: (text: string) => Promise<void>;
  onUpdateComment?: (commentId: string, text: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  attachments?: Attachment[];
  onUploadAttachment?: (file: File) => Promise<void>;
  onDeleteAttachment?: (attachmentId: string) => Promise<void>;
  onDuplicateAttachment?: (attachmentId: string) => Promise<void>;
  onToggleAttachmentCover?: (attachmentId: string, currentIsCover: boolean) => Promise<void>;
  isUploadingAttachment?: boolean;
  attachmentsSlot?: React.ReactNode;
  titleSlot?: React.ReactNode;
  descriptionSlot?: React.ReactNode;
  dueDateSlot?: React.ReactNode;
  labelsSlot?: React.ReactNode;
  membersSlot?: React.ReactNode;
  checklistsSlot?: React.ReactNode;
  commentsSlot?: React.ReactNode;
  sidebarActionsSlot?: React.ReactNode;
}

/**
 * Organism CardDetailModal - Hộp thoại chi tiết thẻ Kanban bố cục 2 cột (SRS §1–§8)
 */
export function CardDetailModal({
  boardId,
  card,
  listName,
  boardLabels = [],
  boardMembers = [],
  onArchive,
  onRestore,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateDueDate,
  onToggleDueComplete,
  onToggleLabel,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  onToggleMember,
  onCreateChecklist,
  onDeleteChecklist,
  onCreateChecklistItem,
  onUpdateChecklistItem,
  onDeleteChecklistItem,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  attachments,
  onUploadAttachment,
  onDeleteAttachment,
  onDuplicateAttachment,
  onToggleAttachmentCover,
  isUploadingAttachment,
  attachmentsSlot,
  titleSlot,
  descriptionSlot,
  dueDateSlot,
  labelsSlot,
  membersSlot,
  checklistsSlot,
  commentsSlot,
  sidebarActionsSlot,
}: CardDetailModalProps) {
  const router = useRouter();

  const handleClose = () => {
    router.push(`/b/${boardId}`);
  };

  // Lọc các nhãn đã gán cho thẻ
  const assignedLabels = boardLabels.filter((l) => card.labelIds.includes(l.id));

  return (
    <Dialog.Root open onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 animate-in fade-in-0 duration-150 ease-out motion-reduce:animate-none" />
        <Dialog.Content
          onEscapeKeyDown={handleClose}
          className="fixed left-[50%] top-[50%] z-50 flex max-h-[90vh] w-[95vw] max-w-3xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl outline-none animate-in fade-in-0 zoom-in-95 duration-150 ease-out motion-reduce:animate-none"
        >
          {/* Banner Thẻ đã được lưu trữ (SRS §8, BR-08, TC-03.1-05, TC-03.1-06) */}
          {card.archived && (
            <div className="flex items-center justify-between bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 text-amber-800 dark:text-amber-200">
              <div className="flex items-center space-x-2 text-sm font-medium">
                <Archive className="h-4 w-4 shrink-0" />
                <span>Thẻ này đã được lưu trữ.</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onRestore}
                className="h-7 border-amber-500/40 bg-background text-xs hover:bg-amber-500/10"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                <span>Khôi phục thẻ</span>
              </Button>
            </div>
          )}

          {/* Header hộp thoại */}
          <div className="flex items-start justify-between border-b px-6 py-4">
            <div className="flex items-start space-x-3 flex-1 min-w-0 pr-4">
              <CreditCard className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                {titleSlot ? (
                  titleSlot
                ) : onUpdateTitle ? (
                  <CardTitleEditor title={card.title} onSave={onUpdateTitle} />
                ) : (
                  <h2 className="text-xl font-semibold tracking-tight text-foreground truncate">
                    {card.title}
                  </h2>
                )}
                {listName && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    trong danh sách <span className="font-medium underline">{listName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Nút đóng modal (X) */}
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                aria-label="Đóng hộp thoại"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Thân hộp thoại: Bố cục 2 cột (SRS §1) */}
          <div className="flex flex-1 flex-col md:flex-row overflow-y-auto px-6 py-4 gap-6">
            {/* Cột chính bên trái: Chi tiết thẻ, Checklists, Bình luận */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Vùng Nhãn, Thành viên và Hạn chót nếu có */}
              <div className="flex flex-wrap items-start gap-4">
                {/* Thành viên thẻ */}
                {membersSlot ? (
                  membersSlot
                ) : card.members.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Thành viên
                    </p>
                    <div className="flex items-center -space-x-1.5">
                      {card.members.map((m) => (
                        <Avatar
                          key={m.userId}
                          className="h-7 w-7 border-2 border-background ring-1 ring-border"
                          title={`${m.name} (${m.email})`}
                        >
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                            {(m.name || m.email || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Nhãn thẻ */}
                {labelsSlot ? (
                  labelsSlot
                ) : assignedLabels.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Nhãn
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedLabels.map((lbl) => {
                        const cfg = LABEL_COLOR_CONFIG[lbl.color] || LABEL_COLOR_CONFIG.green;
                        return (
                          <Badge
                            key={lbl.id}
                            className={cn('h-6 px-2 text-xs font-medium border-0', cfg.bg, cfg.text)}
                          >
                            {lbl.name || cfg.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Hạn chót */}
                {dueDateSlot ? (
                  dueDateSlot
                ) : onUpdateDueDate && onToggleDueComplete ? (
                  <CardDueDatePicker
                    dueDate={card.dueDate}
                    dueComplete={card.dueComplete}
                    onUpdateDueDate={onUpdateDueDate}
                    onToggleComplete={onToggleDueComplete}
                  />
                ) : null}
              </div>

              {/* Vùng Mô tả */}
              <div>
                {descriptionSlot ? (
                  descriptionSlot
                ) : onUpdateDescription ? (
                  <CardDescriptionEditor
                    description={card.description}
                    onSave={onUpdateDescription}
                  />
                ) : null}
              </div>

              {/* Vùng Tệp đính kèm (REQ-ATT-01, REQ-ATT-02, BR-01..BR-03, TC-02.1-01..TC-02.1-06) */}
              <div>
                {attachmentsSlot ? (
                  attachmentsSlot
                ) : onUploadAttachment && onDeleteAttachment && onToggleAttachmentCover ? (
                  <CardAttachmentSection
                    cardId={card.id}
                    attachments={attachments || (card as any).attachments || []}
                    onUpload={onUploadAttachment}
                    onDelete={onDeleteAttachment}
                    onDuplicate={onDuplicateAttachment}
                    onToggleCover={onToggleAttachmentCover}
                    isUploading={isUploadingAttachment}
                  />
                ) : null}
              </div>

              {/* Vùng Checklists (SRS §6, BR-06) */}
              <div>
                {checklistsSlot ? (
                  checklistsSlot
                ) : onCreateChecklist &&
                  onDeleteChecklist &&
                  onCreateChecklistItem &&
                  onUpdateChecklistItem &&
                  onDeleteChecklistItem ? (
                  <CardChecklistSection
                    checklists={card.checklists}
                    onCreateChecklist={onCreateChecklist}
                    onDeleteChecklist={onDeleteChecklist}
                    onCreateItem={onCreateChecklistItem}
                    onUpdateItem={onUpdateChecklistItem}
                    onDeleteItem={onDeleteChecklistItem}
                  />
                ) : null}
              </div>

              {/* Vùng Bình luận (SRS §7, BR-07) */}
              <div>
                {commentsSlot ? (
                  commentsSlot
                ) : onCreateComment && onUpdateComment && onDeleteComment ? (
                  <CardCommentsSection
                    comments={card.comments}
                    onCreateComment={onCreateComment}
                    onUpdateComment={onUpdateComment}
                    onDeleteComment={onDeleteComment}
                  />
                ) : null}
              </div>
            </div>

            {/* Cột phụ bên phải: Thanh tác vụ nhanh */}
            <div className="w-full md:w-48 shrink-0 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Thêm vào thẻ
                </p>

                {/* Popover Thành viên */}
                {onToggleMember && (
                  <CardMembersPopover
                    boardMembers={boardMembers}
                    cardMembers={card.members}
                    onToggleMember={onToggleMember}
                  />
                )}

                {/* Popover Nhãn */}
                {onToggleLabel && onCreateLabel && onUpdateLabel && onDeleteLabel && (
                  <CardLabelsPopover
                    boardLabels={boardLabels}
                    cardLabelIds={card.labelIds}
                    onToggleLabel={onToggleLabel}
                    onCreateLabel={onCreateLabel}
                    onUpdateLabel={onUpdateLabel}
                    onDeleteLabel={onDeleteLabel}
                  />
                )}

                {/* Popover Thêm danh sách công việc (Checklist) */}
                {onCreateChecklist && (
                  <AddChecklistButton onCreateChecklist={onCreateChecklist} />
                )}
              </div>

              {sidebarActionsSlot}

              {/* Nút Lưu trữ thẻ (SRS §8, BR-08, TC-03.1-04) */}
              {!card.archived && (
                <div className="pt-2">
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Thao tác
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onArchive}
                    className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-dashed"
                  >
                    <Archive className="mr-2 h-3.5 w-3.5" />
                    <span>Lưu trữ</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
