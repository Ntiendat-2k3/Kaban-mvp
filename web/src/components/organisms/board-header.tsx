'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Star, Users, Palette, MoreHorizontal, Archive, Check } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Board, BoardBackground, BOARD_BACKGROUND_COLORS, BOARD_BACKGROUND_OPTIONS } from '@/types/board';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { BoardMembersDialog } from '@/components/organisms/board-members-dialog';
import { BoardArchiveDialog } from '@/components/organisms/board-archive-dialog';
import { cn } from '@/lib/utils';

export interface BoardHeaderProps {
  board: Board;
  onUpdateName?: (name: string) => void;
  onUpdateBackground?: (background: BoardBackground) => void;
  onToggleStar?: () => void;
  onArchive?: () => void;
  onOpenMembers?: () => void;
  isUpdating?: boolean;
}

/**
 * Organism BoardHeader - Thanh điều khiển trên cùng của trang chi tiết bảng
 * Hỗ trợ sửa tên inline, đổi 8 màu preset, gắn sao và menu đóng bảng (SRS §3, §4, §5)
 */
export function BoardHeader({
  board,
  onUpdateName,
  onUpdateBackground,
  onToggleStar,
  onArchive,
  onOpenMembers,
  isUpdating,
}: BoardHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(board.name);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameValue(board.name);
  }, [board.name]);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleFinishEditingName = () => {
    setIsEditingName(false);
    const trimmed = nameValue.trim();
    // Nếu rỗng: khôi phục tên cũ theo BR-04 và TC-03.1-02
    if (!trimmed) {
      setNameValue(board.name);
      return;
    }
    // Nếu có thay đổi: gọi callback cập nhật
    if (trimmed !== board.name && onUpdateName) {
      onUpdateName(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEditingName();
    } else if (e.key === 'Escape') {
      setNameValue(board.name);
      setIsEditingName(false);
    }
  };

  const handleOpenMembers = () => {
    setIsMembersOpen(true);
    if (onOpenMembers) {
      onOpenMembers();
    }
  };

  return (
    <>
      <div className="flex h-14 w-full items-center justify-between border-b border-white/15 bg-slate-950/30 px-4 backdrop-blur-md text-white sm:px-6">
        {/* Vùng bên trái: Tên bảng (inline edit) và Nút Sao */}
        <div className="flex items-center space-x-2">
          {isEditingName ? (
            <Input
              ref={inputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleFinishEditingName}
              onKeyDown={handleKeyDown}
              disabled={isUpdating}
              maxLength={100}
              className="h-11 min-w-[200px] border-white/40 bg-white/20 text-lg font-bold text-white placeholder-white/70 focus-visible:border-white/70"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="rounded px-2.5 py-1 text-lg font-bold tracking-tight text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {board.name}
            </button>
          )}

          {/* Nút gắn/bỏ sao (SRS §4) */}
          {onToggleStar && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={board.isStarred ? 'Bỏ gắn sao' : 'Gắn sao bảng'}
              onClick={onToggleStar}
              className="h-8 w-8 text-white/90 hover:bg-white/20 hover:text-yellow-300"
            >
              <Star
                className={cn(
                  'h-4 w-4 transition-transform',
                  board.isStarred ? 'fill-yellow-300 text-yellow-300' : 'text-white'
                )}
              />
            </Button>
          )}
        </div>

        {/* Vùng bên phải: Đổi màu nền, Thành viên và Menu tuỳ chọn */}
        <div className="flex items-center space-x-2">
          {/* Bộ chọn 8 màu nền preset (SRS §3) */}
          {onUpdateBackground && (
            <Popover.Root>
              <Popover.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-white hover:bg-white/20"
                >
                  <Palette className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Đổi nền</span>
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg animate-in fade-in-80"
                >
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Chọn màu nền bảng</p>
                  <div className="grid grid-cols-4 gap-2">
                    {BOARD_BACKGROUND_OPTIONS.map((color) => {
                      const conf = BOARD_BACKGROUND_COLORS[color];
                      const isSelected = board.background === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Chọn màu ${conf.label}`}
                          onClick={() => onUpdateBackground(color)}
                          className={cn(
                            'relative flex h-10 w-full items-center justify-center rounded-md transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                            isSelected && 'ring-2 ring-primary ring-offset-2'
                          )}
                          style={{ backgroundColor: conf.hex }}
                          disabled={isUpdating}
                        >
                          {isSelected && <Check className="h-4 w-4 stroke-[3] text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}

          {/* Nút mở panel Thành viên (SRS §6) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenMembers}
            className="h-8 text-white hover:bg-white/20"
          >
            <Users className="mr-1.5 h-4 w-4" />
            <span>Thành viên</span>
          </Button>

          {/* Menu bảng chứa kho lưu trữ cho thành viên và thao tác đóng bảng cho chủ sở hữu. */}
          <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Tuỳ chọn bảng"
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md animate-in fade-in-80"
                >
                  <DropdownMenu.Item
                    onSelect={() => setIsArchiveOpen(true)}
                    className="flex cursor-pointer items-center rounded-sm px-2.5 py-1.5 text-sm outline-none hover:bg-muted focus:bg-muted"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    <span>Kho lưu trữ</span>
                  </DropdownMenu.Item>
                  {board.role === 'owner' && onArchive && (
                    <DropdownMenu.Item
                      onSelect={onArchive}
                      className="flex cursor-pointer items-center rounded-sm px-2.5 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      <span>Đóng bảng</span>
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Dialog quản lý thành viên */}
      <BoardMembersDialog
        board={board}
        open={isMembersOpen}
        onOpenChange={setIsMembersOpen}
      />
      <BoardArchiveDialog boardId={board.id} open={isArchiveOpen} onOpenChange={setIsArchiveOpen} />
    </>
  );
}
