'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, ListPlus } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  MeasuringStrategy,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { ListWithCards, CardSummary, BoardLabel } from '@/types/board-detail';
import { BoardMember } from '@/types/board';
import { ListColumn } from '@/components/organisms/list-column';
import { CardTile } from '@/components/molecules/card-tile';
import { CardActionsMenu } from '@/components/molecules/card-actions-menu';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { useBoardDnd } from '@/hooks/use-board-dnd';
import { cn } from '@/lib/utils';

export interface BoardCanvasProps {
  boardId: string;
  lists: ListWithCards[];
  labelsMap?: Map<string, BoardLabel>;
  membersMap?: Map<string, BoardMember>;
  onListsChange?: (lists: ListWithCards[]) => void;
  onCreateList: (name: string) => Promise<void>;
  onUpdateListTitle: (listId: string, name: string) => void;
  onArchiveList: (listId: string) => void;
  onQuickCreateCard?: (listId: string, title: string) => Promise<void>;
  onDuplicateCard?: (cardId: string) => Promise<void>;
  onArchiveCard?: (cardId: string) => Promise<void>;
  childrenRenderer?: (list: ListWithCards) => React.ReactNode;
  footerRenderer?: (list: ListWithCards) => React.ReactNode;
  isFilterActive?: boolean;
}

/**
 * Item thẻ hỗ trợ kéo thả Sortable
 */
function SortableCardItem({
  card,
  boardId,
  labelsMap,
  membersMap,
  disabled,
  onDuplicateCard,
  onArchiveCard,
}: {
  card: CardSummary;
  boardId: string;
  labelsMap?: Map<string, BoardLabel>;
  membersMap?: Map<string, BoardMember>;
  disabled?: boolean;
  onDuplicateCard?: (cardId: string) => Promise<void>;
  onArchiveCard?: (cardId: string) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled,
    data: {
      type: 'card',
      card,
    },
  });

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    transition,
  };

  const tile = (
    <CardTile card={card} boardId={boardId} labelsMap={labelsMap} membersMap={membersMap} />
  );

  const item = (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'rounded-lg border-2 border-dashed border-primary/70 bg-primary/10')}
      {...attributes}
      {...listeners}
    >
      <div className={cn('transition-opacity duration-150', isDragging && 'pointer-events-none opacity-0')}>
        {tile}
      </div>
    </div>
  );

  return onDuplicateCard && onArchiveCard ? (
    <CardActionsMenu
      card={card}
      boardId={boardId}
      disabled={isDragging}
      onDuplicate={onDuplicateCard}
      onArchive={onArchiveCard}
    >
      {item}
    </CardActionsMenu>
  ) : item;
}

/**
 * Organism BoardCanvas - Khung hiển thị chính các cột danh sách và thẻ Kanban
 * Bố cục cuộn ngang, kéo thả danh sách và thẻ bằng @dnd-kit/sortable (SRS §1, §2, §4, §6)
 */
export function BoardCanvas({
  boardId,
  lists,
  labelsMap,
  membersMap,
  onListsChange,
  onCreateList,
  onUpdateListTitle,
  onArchiveList,
  onQuickCreateCard,
  onDuplicateCard,
  onArchiveCard,
  childrenRenderer,
  footerRenderer,
  isFilterActive = false,
}: BoardCanvasProps) {
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo DnD cho Danh sách và Thẻ
  const {
    sensors,
    activeId,
    activeType,
    previewLists,
    dropTargetRef,
    moveError,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragCancel,
    handleDragEnd,
  } = useBoardDnd({
    initialLists: lists,
    onListsChange: onListsChange || (() => {}),
    disabled: isFilterActive,
  });

  useEffect(() => {
    if (isAddingList && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAddingList]);

  useEffect(() => {
    if (moveError) toast.error(moveError);
  }, [moveError]);

  const handleCreateList = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreateList(trimmed);
      toast.success('Đã tạo danh sách.');
      // Giữ lại ô nhập để thêm tiếp theo SRS §2, BR-03 và TC-02.1-03
      setNewListName('');
      if (addInputRef.current) {
        addInputRef.current.focus();
      }
    } catch {
      toast.error('Không thể tạo danh sách. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateList();
    } else if (e.key === 'Escape') {
      // Phím Esc huỷ và đóng ô nhập (BR-03, TC-02.1-04)
      setNewListName('');
      setIsAddingList(false);
    }
  };

  const activeList = activeId ? lists.find((l) => l.id === activeId) : null;
  const activeCard = activeId
    ? lists.flatMap((l) => l.cards).find((c) => c.id === activeId)
    : null;
  const displayedLists = previewLists ?? lists;

  /** Tính chỉ số chèn từ tâm các thẻ đang hiển thị, bỏ qua chính thẻ đang kéo. */
  const collisionDetection: CollisionDetection = (args) => {
    const columns = args.droppableContainers.filter((item) => item.data.current?.type === 'list');
    if (args.active.data.current?.type === 'list') {
      const pointerHits = pointerWithin({ ...args, droppableContainers: columns });
      return pointerHits.length
        ? pointerHits
        : closestCenter({ ...args, droppableContainers: columns });
    }

    const pointerHits = pointerWithin({ ...args, droppableContainers: columns });
    const listId = pointerHits[0]?.id ??
      rectIntersection({ ...args, droppableContainers: columns })[0]?.id;
    if (!listId) {
      dropTargetRef.current = null;
      return [];
    }

    const cursorY = args.pointerCoordinates?.y ??
      args.collisionRect.top + args.collisionRect.height / 2;
    const index = args.droppableContainers.reduce((count, item) => {
      if (
        item.data.current?.type !== 'card' ||
        item.id === args.active.id ||
        item.data.current?.card?.listId !== listId
      ) return count;

      const rect = args.droppableRects.get(item.id);
      return count + (rect && cursorY > rect.top + rect.height / 2 ? 1 : 0);
    }, 0);
    dropTargetRef.current = { listId: String(listId), index };
    return [{ id: listId }];
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full flex-1 items-start gap-4 overflow-x-auto p-4 pb-6">
        {/* Thông báo gợi ý khi bảng chưa có danh sách nào (BR-02, TC-02.1-02) */}
        {displayedLists.length === 0 && !isAddingList && (
          <div className="flex h-40 w-[272px] shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-white/30 bg-slate-950/25 p-4 text-center text-white shadow-sm backdrop-blur-sm">
            <ListPlus className="mb-2 h-6 w-6 text-white/80" />
            <p className="text-sm font-medium text-white">Thêm danh sách đầu tiên</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsAddingList(true)}
              className="mt-3 h-9 bg-white text-slate-900 hover:bg-white/90"
            >
              <Plus className="mr-1 h-3 w-3" />
              <span>Thêm danh sách</span>
            </Button>
          </div>
        )}

        {/* Danh sách các cột hỗ trợ Kéo thả sắp xếp (SortableContext - SRS §4) */}
        <SortableContext
          items={displayedLists.map((l) => l.id)}
          strategy={horizontalListSortingStrategy}
        >
          {displayedLists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              onUpdateTitle={onUpdateListTitle}
              onArchiveList={onArchiveList}
              disabled={isFilterActive}
              onQuickCreateCard={
                onQuickCreateCard
                  ? (title) => onQuickCreateCard(list.id, title)
                  : undefined
              }
              footerSlot={footerRenderer ? footerRenderer(list) : undefined}
            >
              {childrenRenderer ? (
                childrenRenderer(list)
              ) : (
                <SortableContext
                  items={list.cards.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {list.cards.map((card) => (
                    <SortableCardItem
                      key={card.id}
                      card={card}
                      boardId={boardId}
                      labelsMap={labelsMap}
                      membersMap={membersMap}
                      disabled={isFilterActive}
                      onDuplicateCard={onDuplicateCard}
                      onArchiveCard={onArchiveCard}
                    />
                  ))}
                </SortableContext>
              )}
            </ListColumn>
          ))}
        </SortableContext>

        {/* Form thêm danh sách mới ở cuối hàng (SRS §2, BR-03) */}
        <div className="w-[272px] shrink-0">
          {isAddingList ? (
            <form
              onSubmit={handleCreateList}
              className="rounded-xl bg-muted/95 p-2 shadow-md backdrop-blur"
            >
              <Input
                ref={addInputRef}
                placeholder="Nhập tên danh sách..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                maxLength={100}
                className="h-10 py-1.5 text-base bg-background font-medium"
              />
              <div className="mt-2 flex items-center space-x-1.5">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newListName.trim() || isSubmitting}
                  className="h-8 text-xs"
                >
                  Thêm danh sách
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setNewListName('');
                    setIsAddingList(false);
                  }}
                  disabled={isSubmitting}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setIsAddingList(true)}
              className={cn(
                'h-10 w-full justify-start rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-medium text-white shadow-sm backdrop-blur-sm hover:bg-white/20',
                displayedLists.length === 0 && 'hidden'
              )}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Thêm danh sách khác</span>
            </Button>
          )}
        </div>
      </div>

      {/* Không chạy hoạt ảnh thả mặc định vì nó có thể kéo bản sao về vị trí cũ trước khi cache cập nhật. */}
      <DragOverlay dropAnimation={null}>
        {activeType === 'list' && activeList ? (
          <ListColumn list={activeList} isOverlay />
        ) : activeType === 'card' && activeCard ? (
          <CardTile
            card={activeCard}
            boardId={boardId}
            labelsMap={labelsMap}
            membersMap={membersMap}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
