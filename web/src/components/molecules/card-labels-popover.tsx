'use client';

import React, { useState } from 'react';
import { Tag, Check, Plus, Edit2, Trash2, ArrowLeft, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { BoardLabel } from '@/types/board-detail';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { cn } from '@/lib/utils';
import { LABEL_COLOR_CONFIG } from '@/lib/label-colors';

interface CardLabelsPopoverProps {
  boardLabels: BoardLabel[];
  cardLabelIds: string[];
  onToggleLabel: (labelId: string, isAssigned: boolean) => Promise<void>;
  onCreateLabel: (color: string, name?: string) => Promise<void>;
  onUpdateLabel: (labelId: string, patch: { color?: string; name?: string }) => Promise<void>;
  onDeleteLabel: (labelId: string) => Promise<void>;
}

/**
 * Molecule CardLabelsPopover - Quản lý và gán nhãn thẻ (SRS §3, BR-03)
 */
export function CardLabelsPopover({
  boardLabels,
  cardLabelIds,
  onToggleLabel,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}: CardLabelsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingLabel, setEditingLabel] = useState<BoardLabel | null>(null);
  const [colorInput, setColorInput] = useState<string>('green');
  const [nameInput, setNameInput] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setColorInput('green');
    setNameInput('');
    setView('create');
  };

  const handleOpenEdit = (label: BoardLabel) => {
    setEditingLabel(label);
    setColorInput(label.color);
    setNameInput(label.name || '');
    setView('edit');
  };

  const handleSaveCreate = async () => {
    await onCreateLabel(colorInput, nameInput.trim());
    setView('list');
  };

  const handleSaveEdit = async () => {
    if (!editingLabel) return;
    await onUpdateLabel(editingLabel.id, {
      color: colorInput,
      name: nameInput.trim(),
    });
    setView('list');
  };

  const handleDelete = async (labelId: string) => {
    await onDeleteLabel(labelId);
    setConfirmDeleteId(null);
    if (view === 'edit') setView('list');
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs">
          <Tag className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Nhãn</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-72 rounded-lg border bg-popover p-3 shadow-lg outline-none animate-in fade-in-50"
        >
          {/* 1. Màn hình danh sách nhãn */}
          {view === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-semibold text-foreground">Nhãn của bảng</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {boardLabels.map((label) => {
                  const isAssigned = cardLabelIds.includes(label.id);
                  const cfg = LABEL_COLOR_CONFIG[label.color] || LABEL_COLOR_CONFIG.green;
                  return (
                    <div key={label.id} className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleLabel(label.id, isAssigned)}
                        className={cn(
                          'flex flex-1 items-center justify-between rounded px-2.5 py-1.5 text-xs font-medium transition-opacity',
                          cfg.bg,
                          cfg.text,
                          'hover:opacity-90'
                        )}
                      >
                        <span className="truncate">{label.name || cfg.name}</span>
                        {isAssigned && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(label)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Sửa nhãn"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenCreate}
                className="w-full text-xs h-7 mt-2"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                <span>Tạo nhãn mới</span>
              </Button>
            </div>
          )}

          {/* 2. Màn hình Tạo / Sửa nhãn */}
          {(view === 'create' || view === 'edit') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-semibold text-foreground">
                  {view === 'create' ? 'Tạo nhãn mới' : 'Sửa nhãn'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Ô nhập tên */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tên nhãn:</label>
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={50}
                  placeholder="Nhập tên nhãn (tuỳ chọn)..."
                  className="h-7 text-xs"
                />
              </div>

              {/* Bảng chọn 10 màu */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Chọn màu:</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {Object.entries(LABEL_COLOR_CONFIG).map(([col, cfg]) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColorInput(col)}
                      className={cn(
                        'h-7 rounded flex items-center justify-center transition-transform',
                        cfg.bg,
                        colorInput === col && 'ring-2 ring-primary ring-offset-1 scale-105'
                      )}
                      title={cfg.name}
                    >
                      {colorInput === col && <Check className={cn('h-3.5 w-3.5', cfg.text)} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  size="sm"
                  onClick={view === 'create' ? handleSaveCreate : handleSaveEdit}
                  className="flex-1 h-7 text-xs"
                >
                  {view === 'create' ? 'Tạo nhãn' : 'Lưu thay đổi'}
                </Button>
                {view === 'edit' && editingLabel && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteId(editingLabel.id)}
                    className="h-7 px-2 text-xs"
                    title="Xoá nhãn"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Xác nhận xoá nhãn (BR-03, TC-03.3-03) */}
              {confirmDeleteId && (
                <div className="rounded border border-destructive/30 bg-destructive/10 p-2 text-center text-xs space-y-2 mt-2 animate-in fade-in-50">
                  <p className="text-destructive font-medium text-xs">
                    Xoá nhãn này sẽ gỡ nhãn khỏi mọi thẻ trong bảng. Tiếp tục?
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(confirmDeleteId)}
                      className="h-6 px-2 text-xs"
                    >
                      Xác nhận xoá
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDeleteId(null)}
                      className="h-6 px-2 text-xs"
                    >
                      Huỷ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
