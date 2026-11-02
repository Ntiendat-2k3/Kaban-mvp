'use client';

import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Checklist } from '@/types/card-detail';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { cn } from '@/lib/utils';

interface CardChecklistSectionProps {
  checklists: Checklist[];
  onCreateChecklist: (title: string) => Promise<void>;
  onDeleteChecklist: (checklistId: string) => Promise<void>;
  onCreateItem: (checklistId: string, text: string) => Promise<void>;
  onUpdateItem: (itemId: string, patch: { text?: string; done?: boolean }) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
}

/**
 * Molecule CardChecklistSection - Quản lý các danh sách công việc và mục con (SRS §6, BR-06)
 */
export function CardChecklistSection({
  checklists,
  onCreateChecklist,
  onDeleteChecklist,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}: CardChecklistSectionProps) {
  const [activeChecklistIdForNewItem, setActiveChecklistIdForNewItem] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  const [confirmDeleteChecklistId, setConfirmDeleteChecklistId] = useState<string | null>(null);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  const handleAddItem = async (checklistId: string) => {
    const trimmed = newItemText.trim();
    if (!trimmed || isSubmittingItem) return;

    try {
      setIsSubmittingItem(true);
      await onCreateItem(checklistId, trimmed);
      // Giữ lại ô nhập để thêm tiếp mục tiếp theo (TC-04.1-02)
      setNewItemText('');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleSaveEditItem = async (itemId: string) => {
    const trimmed = editingItemText.trim();
    setEditingItemId(null);
    if (!trimmed) return;
    await onUpdateItem(itemId, { text: trimmed });
  };

  return (
    <div className="space-y-6">
      {checklists.map((chk) => {
        const totalItems = chk.items.length;
        const doneItems = chk.items.filter((i) => i.done).length;
        const percent = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

        return (
          <div key={chk.id} className="space-y-3">
            {/* Header Checklist */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-base font-semibold text-foreground">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span>{chk.title}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteChecklistId(chk.id)}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                title="Xoá checklist"
              >
                <span>Xoá</span>
              </Button>
            </div>

            {/* Hộp thoại xác nhận xoá checklist (BR-06, TC-04.1-04) */}
            {confirmDeleteChecklistId === chk.id && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs space-y-2 animate-in fade-in-50">
                <p className="text-destructive font-medium">
                  Bạn có chắc chắn muốn xoá danh sách công việc &quot;{chk.title}&quot;? Toàn bộ các mục con sẽ bị xoá vĩnh viễn.
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      onDeleteChecklist(chk.id);
                      setConfirmDeleteChecklistId(null);
                    }}
                    className="h-7 text-xs"
                  >
                    Xác nhận xoá
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDeleteChecklistId(null)}
                    className="h-7 text-xs"
                  >
                    Huỷ
                  </Button>
                </div>
              </div>
            )}

            {/* Thanh tiến độ phần trăm (SRS §6, TC-04.1-01, TC-04.1-03) */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-muted-foreground w-8">
                {percent}%
              </span>
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    percent === 100 ? 'bg-emerald-500' : 'bg-primary'
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Danh sách các items */}
            <div className="space-y-1 pl-1">
              {chk.items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start justify-between rounded-md p-1.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start space-x-2.5 flex-1 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => onUpdateItem(item.id, { done: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                    />
                    {editingItemId === item.id ? (
                      <Input
                        value={editingItemText}
                        onChange={(e) => setEditingItemText(e.target.value)}
                        onBlur={() => handleSaveEditItem(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditItem(item.id);
                          if (e.key === 'Escape') setEditingItemId(null);
                        }}
                        autoFocus
                        className="h-10 py-1.5 text-base"
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingItemId(item.id);
                          setEditingItemText(item.text);
                        }}
                        className={cn(
                          'text-base text-foreground cursor-pointer break-words leading-relaxed',
                          item.done && 'line-through text-muted-foreground'
                        )}
                        title="Bấm để sửa mục"
                      >
                        {item.text}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteItem(item.id)}
                    className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    title="Xoá mục"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Nút hoặc form thêm mục con (SRS §6, TC-04.1-02) */}
            {activeChecklistIdForNewItem === chk.id ? (
              <div className="space-y-2 pt-1">
                <Input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem(chk.id);
                    if (e.key === 'Escape') {
                      setActiveChecklistIdForNewItem(null);
                      setNewItemText('');
                    }
                  }}
                  autoFocus
                  placeholder="Thêm một mục..."
                  maxLength={512}
                  disabled={isSubmittingItem}
                  className="h-10 py-1.5 text-base"
                />
                <div className="flex items-center space-x-1.5">
                  <Button
                    size="sm"
                    onClick={() => handleAddItem(chk.id)}
                    disabled={!newItemText.trim() || isSubmittingItem}
                    className="h-7 text-xs"
                  >
                    Thêm
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setActiveChecklistIdForNewItem(null);
                      setNewItemText('');
                    }}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setActiveChecklistIdForNewItem(chk.id);
                  setNewItemText('');
                }}
                className="h-7 text-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                <span>Thêm một mục</span>
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Nút tạo checklist mới với popover
 */
export function AddChecklistButton({
  onCreateChecklist,
}: {
  onCreateChecklist: (title: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('Việc cần làm');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreateChecklist(trimmed);
      setIsOpen(false);
      setTitle('Việc cần làm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs">
          <CheckSquare className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Việc cần làm</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-72 rounded-lg border bg-popover p-3 shadow-lg outline-none animate-in fade-in-50"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-semibold text-foreground">Thêm danh sách công việc</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tiêu đề:</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
                className="h-7 text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!title.trim() || isSubmitting}
              className="w-full h-7 text-xs"
            >
              Thêm
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
