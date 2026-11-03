'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Copy, Files, Link2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';
import { getConflictMessage } from '@/lib/api/client';
import { CardSummary } from '@/types/board-detail';
import { cn } from '@/lib/utils';
import { Input } from '@/components/atoms/input';

interface CardActionsMenuProps {
  card: CardSummary;
  boardId: string;
  children: (titleEditor: React.ReactNode | null, editingMinHeight?: number) => React.ReactNode;
  disabled?: boolean;
  onDuplicate: (cardId: string) => Promise<void>;
  onRename?: (cardId: string, title: string) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
}

/**
 * Menu thao tác trên thẻ, mở bằng chuột phải, nút ba chấm hoặc phím menu.
 * Phím tắt chỉ hoạt động khi thẻ có focus và không can thiệp vùng nhập liệu.
 */
export function CardActionsMenu({
  card,
  boardId,
  children,
  disabled = false,
  onDuplicate,
  onRename,
  onDelete,
}: CardActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(card.title);
  const [editingMinHeight, setEditingMinHeight] = useState<number>();
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  const cancelRef = useRef(false);

  useEffect(() => setTitleValue(card.title), [card.title]);
  useEffect(() => {
    if (isEditing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [isEditing]);
  const startRename = () => {
    if (!onRename || disabled) return;
    cancelRef.current = false;
    setEditingMinHeight(cardRef.current?.getBoundingClientRect().height);
    setTitleValue(card.title);
    setIsEditing(true);
  };

  const saveRename = async () => {
    if (cancelRef.current || savingRef.current) return;
    const title = titleValue.trim();
    if (!title || title === card.title) { setIsEditing(false); return; }
    savingRef.current = true;
    try {
      await onRename?.(card.id, title);
      setIsEditing(false);
    } catch {
      toast.error('Không thể đổi tên thẻ. Vui lòng thử lại.');
      inputRef.current?.focus();
    } finally {
      savingRef.current = false;
    }
  };

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    if (isWorking) return;
    try {
      setIsWorking(true);
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getConflictMessage(error) || 'Không thể thực hiện thao tác. Vui lòng thử lại.');
    } finally {
      setIsWorking(false);
    }
  };

  const copyText = (text: string, label: string) =>
    runAction(() => navigator.clipboard.writeText(text), `Đã sao chép ${label}.`);

  const duplicate = () => runAction(() => onDuplicate(card.id), 'Đã nhân bản thẻ.');

  const deleteCard = () => {
    if (!window.confirm('Xóa vĩnh viễn thẻ này và toàn bộ nội dung? Không thể khôi phục.')) return;
    void runAction(() => onDelete(card.id), 'Đã xóa thẻ.');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || isWorking) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, video, [contenteditable]')) return;

    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      setIsOpen(true);
    } else if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      event.stopPropagation();
      void duplicate();
    } else if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'c') {
      if (window.getSelection()?.toString()) return;
      event.preventDefault();
      event.stopPropagation();
      void copyText(`${window.location.origin}/b/${boardId}/c/${card.id}`, 'liên kết thẻ');
    } else if (event.key === 'Delete') {
      event.preventDefault();
      event.stopPropagation();
      deleteCard();
    }
  };

  const titleEditor = isEditing ? (
    <Input
      ref={inputRef}
      value={titleValue}
      maxLength={512}
      aria-label="Đổi tên thẻ"
      onChange={(event) => setTitleValue(event.target.value)}
      onPointerDown={(event) => event.stopPropagation()}
      onBlur={() => void saveRename()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') { event.preventDefault(); void saveRename(); }
        if (event.key === 'Escape') {
          cancelRef.current = true;
          setIsEditing(false);
          setTitleValue(card.title);
        }
      }}
      className="h-7 w-full rounded-md border-primary bg-background px-1 text-base font-medium text-foreground focus-visible:ring-2 focus-visible:ring-primary"
    />
  ) : null;

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <div
        ref={cardRef}
        className="group relative min-w-0"
        onContextMenu={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsOpen(true);
        }}
        onKeyDownCapture={handleKeyDown}
      >
        {children(titleEditor, editingMinHeight)}
        {!isEditing && <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={`Thao tác với thẻ ${card.title}`}
            disabled={disabled || isWorking}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              'absolute right-1 top-1 z-10 rounded-md bg-background/90 p-1.5 text-muted-foreground opacity-100 shadow-sm transition-opacity hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
              disabled && 'hidden'
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>}
      </div>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          onCloseAutoFocus={(event) => {
            if (!isEditing) return;
            event.preventDefault();
            inputRef.current?.focus();
            inputRef.current?.select();
          }}
          className="z-[60] min-w-[220px] rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-xl outline-none"
        >
          <DropdownMenu.Item
            onSelect={() => void copyText(`${window.location.origin}/b/${boardId}/c/${card.id}`, 'liên kết thẻ')}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 outline-none focus:bg-accent"
          >
            <Link2 className="h-4 w-4" /> Sao chép liên kết
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+C</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => void copyText(card.title, 'tiêu đề thẻ')}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 outline-none focus:bg-accent"
          >
            <Copy className="h-4 w-4" /> Sao chép tiêu đề
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={startRename}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 outline-none focus:bg-accent"
          >
            <Pencil className="h-4 w-4" /> Đổi tên thẻ
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => void duplicate()}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 outline-none focus:bg-accent"
          >
            <Files className="h-4 w-4" /> Nhân bản thẻ
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+D</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={deleteCard}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-destructive outline-none focus:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Xóa thẻ
            <span className="ml-auto text-xs">Delete</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
