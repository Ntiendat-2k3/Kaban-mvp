'use client';

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/atoms/dialog';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Spinner } from '@/components/atoms/spinner';
import { BoardBackground, BOARD_BACKGROUND_COLORS, BOARD_BACKGROUND_OPTIONS } from '@/types/board';
import { useBoardMutations } from '@/hooks/use-board-mutations';
import { cn } from '@/lib/utils';

interface CreateBoardDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

/**
 * Organism CreateBoardDialog - Hộp thoại tạo bảng làm việc mới
 * Chọn tên 1-100 ký tự và 8 màu nền preset (SRS §2, BR-03)
 */
export function CreateBoardDialog({ open, onOpenChange, trigger }: CreateBoardDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [name, setName] = useState('');
  const [background, setBackground] = useState<BoardBackground>('blue');
  const [error, setError] = useState<string | null>(null);

  const { createBoard, isCreating } = useBoardMutations();

  // Reset form khi mở hộp thoại
  useEffect(() => {
    if (isOpen) {
      setName('');
      setBackground('blue');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    // Validation (BR-03, TC-02.2-02)
    if (!trimmedName) {
      setError('Tên bảng không được để trống');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Tên bảng không được vượt quá 100 ký tự');
      return;
    }

    setError(null);
    try {
      await createBoard({ name: trimmedName, background });
      setName('');
      setBackground('blue');
      setOpen(false);
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      const errorMsg =
        apiError?.details?.[0]?.message ||
        apiError?.message ||
        (typeof apiError === 'string' ? apiError : null) ||
        err?.message ||
        'Lỗi khi tạo bảng mới';
      setError(errorMsg);
    }
  };

  const selectedBgConfig = BOARD_BACKGROUND_COLORS[background] || BOARD_BACKGROUND_COLORS.blue;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo bảng mới</DialogTitle>
          <DialogDescription>
            Bảng làm việc chứa các danh sách công việc và thẻ tác vụ của bạn.
          </DialogDescription>
        </DialogHeader>

        {/* Khung xem trước màu nền và tên */}
        <div
          className="board-surface flex h-24 w-full items-center justify-center rounded-lg p-3 text-center shadow-inner transition-colors duration-200"
          style={{ '--board-accent': selectedBgConfig.hex } as React.CSSProperties}
        >
          <span className="line-clamp-2 text-base font-bold drop-shadow">
            {name.trim() || 'Tên bảng của bạn'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Ô nhập tên bảng */}
          <div className="space-y-1.5">
            <Label htmlFor="board-name">
              Tên bảng <span className="text-destructive">*</span>
            </Label>
            <Input
              id="board-name"
              placeholder="Nhập tên bảng..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              disabled={isCreating}
              maxLength={100}
              autoFocus
              className={cn(error && 'border-destructive focus-visible:border-destructive')}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Bộ chọn 8 màu nền preset (SRS §2) */}
          <div className="space-y-1.5">
            <Label>Màu nền</Label>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {BOARD_BACKGROUND_OPTIONS.map((color) => {
                const conf = BOARD_BACKGROUND_COLORS[color];
                const isSelected = background === color;
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Chọn màu ${conf.label}`}
                    onClick={() => setBackground(color)}
                    className={cn(
                      'relative flex h-10 w-full items-center justify-center rounded-md transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                      isSelected && 'ring-2 ring-primary ring-offset-2 scale-105'
                    )}
                    style={{ backgroundColor: conf.hex }}
                  >
                    {isSelected && <Check className="h-4 w-4 stroke-[3] text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="min-w-[90px]"
            >
              {isCreating ? (
                <span className="flex items-center space-x-1.5">
                  <Spinner size="sm" />
                  <span>Đang tạo...</span>
                </span>
              ) : (
                'Tạo bảng'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
