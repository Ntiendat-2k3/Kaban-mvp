'use client';

import React from 'react';
import Link from 'next/link';
import { Star, RotateCcw } from 'lucide-react';
import { Board, BOARD_BACKGROUND_COLORS } from '@/types/board';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { useBoardMutations } from '@/hooks/use-board-mutations';

interface BoardCardProps {
  board: Board;
  onToggleStar?: (boardId: string, currentStarred: boolean) => void;
  onRestore?: (boardId: string) => void;
  isStarLoading?: boolean;
  isRestoreLoading?: boolean;
}

/**
 * Molecule BoardCard - Thẻ đại diện cho một bảng làm việc
 * Hiển thị tên bảng, màu nền, nút gắn sao và nhãn trạng thái (SRS §1, §4, §5)
 */
export function BoardCard({
  board,
  onToggleStar,
  onRestore,
  isStarLoading,
  isRestoreLoading,
}: BoardCardProps) {
  const bgConfig = BOARD_BACKGROUND_COLORS[board.background] || BOARD_BACKGROUND_COLORS.blue;
  const { toggleStar, isTogglingStar } = useBoardMutations();

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleStar) {
      onToggleStar(board.id, board.isStarred);
    } else {
      toggleStar({ boardId: board.id, isStarred: board.isStarred });
    }
  };

  const handleRestoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRestore) {
      onRestore(board.id);
    }
  };

  const isStarring = isStarLoading || isTogglingStar;

  return (
    <Link
      href={`/b/${board.id}`}
      className="board-surface group relative flex h-28 flex-col justify-between rounded-lg p-3 shadow transition-all duration-200 hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      style={{ '--board-accent': bgConfig.hex } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug drop-shadow-sm">
          {board.name}
        </h3>

        {!board.archived && (
          <button
            type="button"
            aria-label={board.isStarred ? 'Bỏ gắn sao' : 'Gắn sao bảng'}
            onClick={handleStarClick}
            disabled={isStarring}
            className={cn(
              'rounded p-1 text-white/80 transition-all hover:text-yellow-300 hover:scale-110 focus:outline-none',
              board.isStarred && 'text-yellow-300'
            )}
          >
            <Star
              className={cn(
                'h-4 w-4 transition-transform',
                board.isStarred ? 'fill-yellow-300' : 'fill-transparent stroke-current'
              )}
            />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-white/90">
        <div className="flex items-center space-x-1.5">
          {board.role === 'owner' ? (
            <Badge variant="outline" className="border-white/40 bg-white/10 text-white">
              Chủ sở hữu
            </Badge>
          ) : (
            <Badge variant="outline" className="border-white/40 bg-white/10 text-white">
              Thành viên
            </Badge>
          )}

          {board.archived && (
            <Badge variant="destructive">
              Đã đóng
            </Badge>
          )}
        </div>

        {board.archived && board.role === 'owner' && onRestore && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRestoreClick}
            disabled={isRestoreLoading}
            className="h-7 text-xs bg-white/90 text-foreground hover:bg-white"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            <span>Mở lại</span>
          </Button>
        )}
      </div>
    </Link>
  );
}
