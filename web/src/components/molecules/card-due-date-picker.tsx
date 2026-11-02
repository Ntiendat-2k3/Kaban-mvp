'use client';

import React, { useState } from 'react';
import { Clock, Calendar, CheckSquare, Trash2, ChevronDown } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { cn } from '@/lib/utils';

interface CardDueDatePickerProps {
  dueDate: string | null;
  dueComplete: boolean;
  onUpdateDueDate: (dueDate: string | null, dueComplete?: boolean) => Promise<void>;
  onToggleComplete: (complete: boolean) => Promise<void>;
}

/**
 * Molecule CardDueDatePicker - Quản lý ngày hạn và trạng thái hoàn thành (SRS §5, BR-05)
 */
export function CardDueDatePicker({
  dueDate,
  dueComplete,
  onUpdateDueDate,
  onToggleComplete,
}: CardDueDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (!dueDate) return '';
    const d = new Date(dueDate);
    // Định dạng YYYY-MM-DDTHH:mm cho datetime-local
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  });

  const getStatus = () => {
    if (!dueDate) return null;
    if (dueComplete) {
      return {
        label: 'Đã hoàn thành',
        className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
    }
    const dueTime = new Date(dueDate).getTime();
    const now = Date.now();
    const diffHours = (dueTime - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return {
        label: 'Quá hạn',
        className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-medium',
      };
    }
    if (diffHours <= 24) {
      return {
        label: 'Sắp hết hạn',
        className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium',
      };
    }
    return {
      label: 'Đang thực hiện',
      className: 'bg-muted text-muted-foreground border-border',
    };
  };

  const status = getStatus();

  const handleSaveDate = async () => {
    if (!selectedDate) {
      await onUpdateDueDate(null, false);
      return;
    }
    const isoString = new Date(selectedDate).toISOString();
    await onUpdateDueDate(isoString, dueComplete);
  };

  const handleRemoveDate = async () => {
    setSelectedDate('');
    await onUpdateDueDate(null, false);
  };

  const formatDisplay = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Ngày hết hạn
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {dueDate ? (
          <>
            {/* Checkbox hoàn thành */}
            <label className="flex items-center space-x-1.5 cursor-pointer rounded-md border p-1 px-2 hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={dueComplete}
                onChange={(e) => onToggleComplete(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs font-medium text-foreground">
                {formatDisplay(dueDate)}
              </span>
            </label>

            {/* Badge trạng thái */}
            {status && (
              <Badge variant="outline" className={cn('h-6 border', status.className)}>
                {status.label}
              </Badge>
            )}
          </>
        ) : null}

        {/* Popover chọn hoặc đổi ngày hạn */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <span>{dueDate ? 'Đổi hạn' : 'Thiết lập hạn chót'}</span>
              <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
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
                <p className="text-xs font-semibold text-foreground text-center border-b pb-2">
                  Ngày hết hạn
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Chọn ngày và giờ:
                  </label>
                  <input
                    type="datetime-local"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <Button size="sm" onClick={handleSaveDate} className="flex-1 h-7 text-xs">
                    Lưu
                  </Button>
                  {dueDate && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveDate}
                      className="h-7 px-2 text-xs"
                      title="Xoá ngày hạn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
