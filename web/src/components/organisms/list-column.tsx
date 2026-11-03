'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Archive, Palette, Check } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ListWithCards } from '@/types/board-detail';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { QuickCardCreator } from '@/components/molecules/quick-card-creator';
import { cn } from '@/lib/utils';
import { BoardBackground, BOARD_BACKGROUND_COLORS, BOARD_BACKGROUND_OPTIONS } from '@/types/board';

export interface ListColumnProps {
  list: ListWithCards;
  onUpdateTitle?: (listId: string, name: string) => void;
  onUpdateWipLimit?: (listId: string, wipLimit: number | null) => void;
  onUpdateColor?: (listId: string, color: BoardBackground | null) => void;
  onArchiveList?: (listId: string) => void;
  onQuickCreateCard?: (title: string) => Promise<void>;
  children?: React.ReactNode;
  footerSlot?: React.ReactNode;
  isOverlay?: boolean;
  disabled?: boolean;
}

/**
 * Organism ListColumn - Cột danh sách trên bảng Kanban
 * Chiều rộng 272px, hỗ trợ kéo thả bằng header, sửa tên inline, lưu trữ và tạo thẻ nhanh (SRS §1, §3, §4, §5)
 */
export function ListColumn({
  list,
  onUpdateTitle,
  onUpdateWipLimit,
  onUpdateColor,
  onArchiveList,
  onQuickCreateCard,
  children,
  footerSlot,
  isOverlay = false,
  disabled = false,
}: ListColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.name);
  const [isEditingWip, setIsEditingWip] = useState(false);
  const [wipValue, setWipValue] = useState(list.wipLimit?.toString() ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Cấu hình Sortable cho Cột danh sách (SRS §4)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
    disabled: isEditingTitle || isOverlay || disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(list.color ? {
      backgroundColor: `${BOARD_BACKGROUND_COLORS[list.color].hex}33`,
      borderColor: BOARD_BACKGROUND_COLORS[list.color].hex,
    } : {}),
  };

  useEffect(() => {
    setTitleValue(list.name);
  }, [list.name]);
  useEffect(() => setWipValue(list.wipLimit?.toString() ?? ''), [list.wipLimit]);

  const saveWipLimit = () => {
    const value = wipValue.trim();
    if (value === '' || (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)))) {
      onUpdateWipLimit?.(list.id, value === '' ? null : Number(value));
      setIsEditingWip(false);
    }
  };

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleFinishEditing = () => {
    setIsEditingTitle(false);
    const trimmed = titleValue.trim();
    if (!trimmed) {
      setTitleValue(list.name);
      return;
    }
    if (trimmed !== list.name && onUpdateTitle) {
      onUpdateTitle(list.id, trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEditing();
    } else if (e.key === 'Escape') {
      setTitleValue(list.name);
      setIsEditingTitle(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex max-h-full w-[272px] shrink-0 flex-col rounded-xl border border-transparent bg-muted/90 p-2 shadow-sm transition-opacity duration-150',
        isDragging && 'border-2 border-dashed border-primary/70 bg-primary/10 shadow-none [&>*]:invisible',
        isOverlay && 'shadow-2xl ring-2 ring-primary rotate-1'
      )}
    >
      {/* Header của Cột danh sách: cầm header để kéo thả (SRS §4) */}
      <div
        className="flex items-center justify-between gap-1 px-1 py-1 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className="flex-1 min-w-0" onPointerDown={(e) => isEditingTitle && e.stopPropagation()}>
          {isEditingTitle ? (
            <Input
              ref={inputRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleFinishEditing}
              onKeyDown={handleKeyDown}
              maxLength={100}
              className="h-10 text-base font-semibold text-foreground px-2 py-1.5 bg-background"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="w-full text-left truncate rounded px-1.5 py-1 text-base font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {list.name}
            </button>
          )}
        </div>

        {list.wipLimit != null && (
          <span className={cn('text-xs font-semibold', list.cards.length >= list.wipLimit ? 'text-destructive' : 'text-muted-foreground')}>
            {list.cards.length}/{list.wipLimit}
          </span>
        )}

        {/* Menu tuỳ chọn của List (Lưu trữ danh sách - BR-04) */}
        {onArchiveList && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Tuỳ chọn danh sách"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                sideOffset={4}
                className="z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md animate-in fade-in-80"
              >
                {onUpdateWipLimit && <DropdownMenu.Item
                  onSelect={() => setIsEditingWip(true)}
                  className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-muted focus:bg-muted"
                >Giới hạn thẻ</DropdownMenu.Item>}
                {onUpdateColor && (
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-muted focus:bg-muted">
                      <Palette className="mr-2 h-3.5 w-3.5" /> Màu cột
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.SubContent sideOffset={4} className="z-[60] w-48 rounded-md border bg-popover p-2 shadow-lg">
                        <p className="mb-2 text-xs text-muted-foreground">Chọn màu cột</p>
                        <div className="grid grid-cols-4 gap-2">
                          {BOARD_BACKGROUND_OPTIONS.map((color) => {
                            const option = BOARD_BACKGROUND_COLORS[color];
                            return <DropdownMenu.Item key={color} aria-label={`Chọn màu ${option.label}`}
                              onSelect={() => onUpdateColor(list.id, color)}
                              className="flex h-8 items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              style={{ backgroundColor: option.hex }}>
                              {list.color === color && <Check className="h-4 w-4 text-white" />}
                            </DropdownMenu.Item>;
                          })}
                        </div>
                        <DropdownMenu.Item onSelect={() => onUpdateColor(list.id, null)}
                          className="mt-2 cursor-pointer rounded px-2 py-1 text-xs outline-none focus:bg-muted">
                          Bỏ màu cột
                        </DropdownMenu.Item>
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                )}
                <DropdownMenu.Item
                  onSelect={() => onArchiveList(list.id)}
                  className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-xs text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10"
                >
                  <Archive className="mr-2 h-3.5 w-3.5" />
                  <span>Lưu trữ danh sách</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>

      {isEditingWip && <div className="flex gap-1 px-1 pb-1" onPointerDown={(event) => event.stopPropagation()}>
        <Input type="number" min={1} aria-label="Giới hạn thẻ, để trống để bỏ giới hạn" value={wipValue}
          onChange={(event) => setWipValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') saveWipLimit(); if (event.key === 'Escape') setIsEditingWip(false); }} />
        <Button size="sm" onClick={saveWipLimit}>Lưu</Button>
      </div>}

      {/* Vùng chứa các thẻ công việc (cuộn dọc riêng - SRS §1) */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-1 py-1.5 max-h-[calc(100vh-14rem)] min-h-[10px]">
        {children}
      </div>

      {/* Chân cột: Form thêm thẻ nhanh hoặc slot tuỳ biến (SRS §5, BR-06) */}
      <div className="px-1 pt-1">
        {footerSlot ? (
          footerSlot
        ) : onQuickCreateCard ? (
          <QuickCardCreator listId={list.id} onSubmit={onQuickCreateCard} />
        ) : null}
      </div>
    </div>
  );
}
