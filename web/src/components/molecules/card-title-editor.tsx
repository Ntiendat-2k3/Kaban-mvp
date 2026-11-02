'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/atoms/input';
import { cn } from '@/lib/utils';

interface CardTitleEditorProps {
  title: string;
  onSave: (newTitle: string) => Promise<void>;
  className?: string;
}

/**
 * Molecule CardTitleEditor - Chỉnh sửa tiêu đề thẻ tại chỗ (SRS §2, BR-02)
 * 1-512 ký tự, Enter/blur lưu, Esc huỷ
 */
export function CardTitleEditor({ title, onSave, className }: CardTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(title);
      return;
    }
    if (trimmed !== title) {
      await onSave(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(title);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        maxLength={512}
        className={cn('h-12 py-1.5 text-xl font-semibold bg-background', className)}
      />
    );
  }

  return (
    <h2
      onClick={() => setIsEditing(true)}
      className={cn(
        'cursor-pointer rounded px-1.5 py-0.5 text-xl font-semibold tracking-tight text-foreground hover:bg-muted/80 transition-colors truncate',
        className
      )}
      title="Bấm để sửa tiêu đề"
    >
      {title}
    </h2>
  );
}
