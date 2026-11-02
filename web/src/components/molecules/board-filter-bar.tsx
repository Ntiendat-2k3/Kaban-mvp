'use client';

import React from 'react';
import { Search, X, AlertCircle, Check, Tags, Users } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { BoardLabel } from '@/types/board-detail';
import { BoardMember } from '@/types/board';
import { BoardFilterState } from '@/hooks/use-board-filter';
import { Input } from '@/components/atoms/input';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { LABEL_COLOR_CONFIG } from '@/lib/label-colors';
import { cn } from '@/lib/utils';

interface BoardFilterBarProps {
  filters: BoardFilterState;
  onFiltersChange: React.Dispatch<React.SetStateAction<BoardFilterState>>;
  onReset: () => void;
  isFilterActive: boolean;
  totalMatches: number;
  totalCards: number;
  labels: BoardLabel[];
  members: BoardMember[];
}

interface FilterPickerProps {
  title: string;
  icon: React.ReactNode;
  options: { id: string; name: string; color?: BoardLabel['color'] }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

function FilterPicker({ title, icon, options, selectedIds, onToggle }: FilterPickerProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 border-white/25 bg-slate-950/25 text-white hover:bg-white/15 hover:text-white"
        >
          {icon}
          {title}{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-64 rounded-lg border bg-popover p-2 text-popover-foreground shadow-lg outline-none"
        >
          <p className="px-2 py-1 text-sm font-semibold">Lọc theo {title.toLowerCase()}</p>
          <div className="max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Chưa có {title.toLowerCase()}.</p>
            ) : options.map((option) => {
              const selected = selectedIds.includes(option.id);
              const color = option.color ? LABEL_COLOR_CONFIG[option.color] : undefined;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => onToggle(option.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <span className={cn('h-4 w-4 shrink-0 rounded-sm border border-input', selected && 'border-primary bg-primary text-primary-foreground')}>
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>
                  {color && <span className={cn('h-3 w-3 shrink-0 rounded-full', color.bg)} />}
                  <span className="truncate">{option.name || color?.name || 'Không tên'}</span>
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * Molecule BoardFilterBar - Thanh lọc thẻ phía client (SRS §8, BR-09)
 * Lọc từ khoá, nhãn, thành viên, hạn; hiển thị số thẻ khớp và nút xoá bộ lọc
 */
export function BoardFilterBar({
  filters,
  onFiltersChange,
  onReset,
  isFilterActive,
  totalMatches,
  totalCards,
  labels,
  members,
}: BoardFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-slate-950/20 px-4 py-3 backdrop-blur-sm text-white sm:px-6">
      {/* Vùng tìm kiếm từ khoá và các bộ lọc */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Ô tìm kiếm từ khoá không phân biệt hoa thường và dấu (BR-09, TC-03.2-04) */}
        <div className="relative w-44 sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/60" />
          <Input
            aria-label="Tìm kiếm thẻ"
            placeholder="Tìm kiếm thẻ..."
            value={filters.keyword}
            onChange={(e) =>
              onFiltersChange((prev) => ({ ...prev, keyword: e.target.value }))
            }
            className="h-9 border-white/25 bg-white/10 pl-9 text-sm text-white placeholder-white/60 focus-visible:border-white/70"
          />
          {filters.keyword && (
            <button
              type="button"
              aria-label="Xoá từ khoá tìm kiếm"
              onClick={() => onFiltersChange((prev) => ({ ...prev, keyword: '' }))}
              className="absolute right-3 top-2.5 text-white/60 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <FilterPicker
          title="Nhãn"
          icon={<Tags className="mr-2 h-4 w-4" />}
          options={labels.map((label) => ({ id: label.id, name: label.name, color: label.color }))}
          selectedIds={filters.selectedLabelIds}
          onToggle={(id) => onFiltersChange((prev) => ({
            ...prev,
            selectedLabelIds: prev.selectedLabelIds.includes(id)
              ? prev.selectedLabelIds.filter((selectedId) => selectedId !== id)
              : [...prev.selectedLabelIds, id],
          }))}
        />

        <FilterPicker
          title="Thành viên"
          icon={<Users className="mr-2 h-4 w-4" />}
          options={members.map((member) => ({ id: member.userId, name: member.name || member.email }))}
          selectedIds={filters.selectedMemberIds}
          onToggle={(id) => onFiltersChange((prev) => ({
            ...prev,
            selectedMemberIds: prev.selectedMemberIds.includes(id)
              ? prev.selectedMemberIds.filter((selectedId) => selectedId !== id)
              : [...prev.selectedMemberIds, id],
          }))}
        />

        {/* Lọc Hạn chót */}
        <select
          aria-label="Lọc theo hạn chót"
          value={filters.dueFilter}
          onChange={(e) =>
            onFiltersChange((prev) => ({
              ...prev,
              dueFilter: e.target.value as BoardFilterState['dueFilter'],
            }))
          }
          className="h-9 rounded-md border border-white/25 bg-slate-950/25 px-3 text-sm text-white focus:border-white/70 focus:outline-none"
        >
          <option value="all" className="bg-popover text-popover-foreground">Tất cả hạn chót</option>
          <option value="overdue" className="bg-popover text-popover-foreground">Đã quá hạn</option>
          <option value="today" className="bg-popover text-popover-foreground">Đến hạn hôm nay</option>
          <option value="noDue" className="bg-popover text-popover-foreground">Không có hạn</option>
        </select>
      </div>

      {/* Vùng trạng thái kết quả lọc và Nút xoá bộ lọc */}
      <div className="flex items-center space-x-2 text-xs">
        {isFilterActive && (
          <>
            <Badge variant="secondary" className="h-6 bg-white/20 text-white border-white/20">
              {totalMatches}/{totalCards} thẻ khớp
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-6 px-2 text-xs text-white hover:bg-white/20"
            >
              <X className="mr-1 h-3 w-3" />
              <span>Xoá bộ lọc</span>
            </Button>

            {/* Cảnh báo vô hiệu hoá kéo thả khi đang lọc (RISK-02, BR-09, TC-03.2-06) */}
            <div
              className="hidden lg:flex items-center space-x-1 text-xs text-yellow-300/90 bg-yellow-950/30 px-2 py-0.5 rounded border border-yellow-500/30"
              title="Vô hiệu hoá kéo thả thẻ khi đang bật lọc để đảm bảo tính toán vị trí chính xác"
            >
              <AlertCircle className="h-3 w-3" />
              <span>Đang khoá kéo thả thẻ</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
