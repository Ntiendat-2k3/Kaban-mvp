'use client';

import React, { useState, useEffect } from 'react';
import { AlignLeft } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Textarea } from '@/components/atoms/textarea';
import { cn } from '@/lib/utils';

interface CardDescriptionEditorProps {
  description: string;
  onSave: (newDesc: string) => Promise<void>;
}

/**
 * Molecule CardDescriptionEditor - Sửa mô tả thẻ văn bản thuần giữ xuống dòng (SRS §2, BR-02)
 * Tối đa 16384 ký tự, có nút Lưu và Huỷ
 */
export function CardDescriptionEditor({ description, onSave }: CardDescriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(description);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(description);
  }, [description]);

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      await onSave(value);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(description);
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-base font-semibold text-foreground">
        <AlignLeft className="h-4 w-4 text-muted-foreground" />
        <span>Mô tả</span>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={16384}
            rows={4}
            placeholder="Thêm mô tả chi tiết hơn..."
            className="p-3 whitespace-pre-wrap"
          />
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Huỷ
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className={cn(
            'min-h-[60px] cursor-pointer rounded-lg p-3 text-base transition-colors',
            description
              ? 'bg-muted/40 hover:bg-muted/70 text-foreground whitespace-pre-wrap'
              : 'bg-muted/30 hover:bg-muted/60 text-muted-foreground italic'
          )}
          title="Bấm để chỉnh sửa mô tả"
        >
          {description || 'Thêm mô tả chi tiết hơn…'}
        </div>
      )}
    </div>
  );
}
