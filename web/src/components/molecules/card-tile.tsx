'use client';

import React from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, CheckSquare, MessageSquare } from 'lucide-react';
import { CardSummary, BoardLabel } from '@/types/board-detail';
import { BoardMember } from '@/types/board';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Badge } from '@/components/atoms/badge';
import { cn } from '@/lib/utils';
import { LABEL_COLOR_CONFIG } from '@/lib/label-colors';
import { getCardDetail } from '@/lib/api/card-detail';

export interface CardTileProps {
  card: CardSummary;
  boardId: string;
  labelsMap?: Map<string, BoardLabel>;
  membersMap?: Map<string, BoardMember>;
  dragProps?: Record<string, any>;
  isDragging?: boolean;
  titleEditor?: React.ReactNode;
  editingMinHeight?: number;
}

/**
 * Molecule CardTile - Hiển thị thẻ tóm tắt trên cột danh sách Kanban
 * Dải nhãn, tiêu đề, hạn chót màu trạng thái, checklist, bình luận, avatars (SRS §7, BR-08)
 */
export function CardTile({
  card,
  boardId,
  labelsMap,
  membersMap,
  dragProps,
  isDragging,
  titleEditor,
  editingMinHeight,
}: CardTileProps) {
  const queryClient = useQueryClient();
  const prefetchDetail = () => {
    void queryClient.prefetchQuery({
      queryKey: ['card', card.id],
      queryFn: () => getCardDetail(card.id),
    });
  };
  // Tính màu sắc cảnh báo của Ngày hạn theo SRS §7, BR-08 và TC-03.1-04
  const getDueDateStatus = () => {
    if (!card.dueDate) return null;
    if (card.dueComplete) {
      return {
        label: 'Đã hoàn thành',
        className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      };
    }
    const dueTime = new Date(card.dueDate).getTime();
    const now = Date.now();
    const diffHours = (dueTime - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      // Quá hạn và chưa hoàn thành: màu đỏ
      return {
        label: 'Quá hạn',
        className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium',
      };
    }
    if (diffHours <= 24) {
      // Dưới 24 giờ: màu vàng
      return {
        label: 'Sắp hết hạn',
        className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium',
      };
    }
    return {
      label: 'Đang thực hiện',
      className: 'bg-muted text-muted-foreground',
    };
  };

  const dueStatus = getDueDateStatus();

  const className = cn(
    'group relative flex flex-col gap-2 rounded-lg border bg-card p-2.5 text-card-foreground shadow-sm transition-all duration-150 hover:border-primary/50 hover:shadow focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer',
    isDragging && 'opacity-40 ring-2 ring-primary shadow-lg',
    titleEditor && 'cursor-text border-primary ring-2 ring-primary/70'
  );

  const content = (
    <>
      {/* 0. Video bìa hoặc Ảnh bìa trên thẻ Kanban (REQ-ATT-03, REQ-ATT-04, BR-04, RISK-03, TC-02.2-01, TC-02.2-02, TC-02.2-03, TC-02.2-04) */}
      {card.coverUrl && (
        <div className="-mx-2.5 -mt-2.5 overflow-hidden rounded-t-lg bg-black/5 dark:bg-black/40">
          {card.coverType === 'video' ? (
            <div
              className="relative w-full overflow-hidden bg-black"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <video
                src={card.coverUrl}
                controls
                preload="metadata"
                className="w-full max-h-48 rounded-t-md object-contain bg-black fullscreen:h-screen fullscreen:w-screen fullscreen:max-h-none fullscreen:object-contain"
              />
            </div>
          ) : (
            <div className="relative w-full max-h-48 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.coverUrl}
                alt={card.title}
                className="w-full max-h-48 object-cover rounded-t-md"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      {/* 1. Dải nhãn màu (SRS §7) */}
      {card.labelIds && card.labelIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labelIds.map((labelId) => {
            const labelObj = labelsMap?.get(labelId);
            const colorClass = labelObj
              ? LABEL_COLOR_CONFIG[labelObj.color].bg
              : 'bg-muted-foreground';
            return (
              <span
                key={labelId}
                className={cn('h-2 min-w-[36px] rounded-full px-1.5', colorClass)}
                title={labelObj?.name || ''}
              />
            );
          })}
        </div>
      )}

      {/* 2. Tiêu đề thẻ (1–512 ký tự) */}
      <h4 data-card-title className="text-base font-medium leading-snug break-words text-foreground">
        {titleEditor ?? card.title}
      </h4>

      {/* 3. Dòng thông tin trạng thái: Hạn, Checklist, Comment, Avatars */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          {/* Hạn chót kèm màu sắc theo trạng thái (SRS §7, TC-03.1-04) */}
          {dueStatus && (
            <Badge variant="outline" className={cn('min-h-6 px-1.5 font-normal border-transparent', dueStatus.className)}>
              <Clock className="mr-1 h-3 w-3" />
              <span>
                {new Date(card.dueDate!).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'numeric',
                })}
              </span>
            </Badge>
          )}

          {/* Tiến độ checklist x/y */}
          {card.checklistTotal > 0 && (
            <div
              className={cn(
                'flex items-center space-x-1 text-xs',
                card.checklistDone === card.checklistTotal && 'text-emerald-600 dark:text-emerald-400 font-medium'
              )}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>
                {card.checklistDone}/{card.checklistTotal}
              </span>
            </div>
          )}

          {/* Số bình luận */}
          {card.commentCount > 0 && (
            <div className="flex items-center space-x-1 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{card.commentCount}</span>
            </div>
          )}
        </div>

        {/* 4. Avatars thành viên được giao (tối đa 3 và "+n") */}
        {card.memberIds && card.memberIds.length > 0 && (
          <div className="flex items-center -space-x-1.5 overflow-hidden ml-auto">
            {card.memberIds.slice(0, 3).map((memberId) => {
              const member = membersMap?.get(memberId);
              const initial = member?.name
                ? member.name.charAt(0).toUpperCase()
                : 'U';
              return (
                <Avatar key={memberId} className="h-5 w-5 border border-background">
                  <AvatarFallback className="bg-primary/20 text-[9px] font-semibold text-primary">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {card.memberIds.length > 3 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground border border-background">
                +{card.memberIds.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  return titleEditor
    ? <div {...dragProps} className={className} style={{ minHeight: editingMinHeight }}>{content}</div>
    : <Link href={`/b/${boardId}/c/${card.id}`} onMouseEnter={prefetchDetail} onFocus={prefetchDetail} {...dragProps} className={className}>{content}</Link>;
}
