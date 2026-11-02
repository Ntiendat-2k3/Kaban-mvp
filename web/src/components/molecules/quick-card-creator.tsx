'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Spinner } from '@/components/atoms/spinner';

interface QuickCardCreatorProps {
  listId: string;
  onSubmit: (title: string) => Promise<void>;
  disabled?: boolean;
}

/**
 * Molecule QuickCardCreator - Form tạo thẻ nhanh ở cuối cột danh sách
 * Tiêu đề 1-512 ký tự, phím Enter tạo và giữ lại ô nhập, phím Esc huỷ (SRS §5, BR-06)
 */
export function QuickCardCreator({
  listId,
  onSubmit,
  disabled = false,
}: QuickCardCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(trimmed);
      // Giữ lại ô nhập để thêm tiếp theo SRS §5, BR-06 và TC-03.1-01
      setTitle('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      // Phím Esc huỷ và đóng form (BR-06, TC-03.1-02)
      setTitle('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="w-full justify-start rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        <span>Thêm thẻ</span>
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 pt-1">
      <Input
        ref={inputRef}
        placeholder="Nhập tiêu đề cho thẻ này..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting || disabled}
        maxLength={512}
        className="text-base h-10 py-1.5 bg-background shadow-sm"
      />
      <div className="flex items-center space-x-1.5">
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim() || isSubmitting || disabled}
          className="h-7 px-2.5 text-xs"
        >
          {isSubmitting ? (
            <span className="flex items-center space-x-1">
              <Spinner size="sm" />
              <span>Đang thêm...</span>
            </span>
          ) : (
            'Thêm thẻ'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setTitle('');
            setIsOpen(false);
          }}
          disabled={isSubmitting}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
