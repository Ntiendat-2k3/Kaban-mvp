'use client';

import { useEffect, useRef, useState } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragMoveEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { ListWithCards } from '@/types/board-detail';
import { getConflictMessage } from '@/lib/api/client';
import { moveList, moveCard } from '@/lib/api/board-detail';

interface UseBoardDndProps {
  initialLists: ListWithCards[];
  onListsChange: (lists: ListWithCards[]) => void;
  disabled?: boolean;
}

/**
 * Giữ thứ tự xem trước qua cả lúc thả cho đến khi cache hiển thị đúng vị trí đích.
 * Chỉ lưu một lần mỗi thao tác và giữ dữ liệu gốc để hoàn tác nếu yêu cầu thất bại.
 */
export function useBoardDnd({ initialLists, onListsChange, disabled = false }: UseBoardDndProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'list' | 'card' | null>(null);
  const [previewLists, setPreviewLists] = useState<ListWithCards[] | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const originalListsRef = useRef<ListWithCards[] | null>(null);
  const previewListsRef = useRef<ListWithCards[] | null>(null);
  const settlingListsRef = useRef<ListWithCards[] | null>(null);
  const dropTargetRef = useRef<{ listId: string; index: number } | null>(null);

  useEffect(() => {
    const settlingLists = settlingListsRef.current;
    if (!settlingLists || settlingLists.length !== initialLists.length) return;

    const isSynchronized = settlingLists.every((list, index) => {
      const current = initialLists[index];
      return current?.id === list.id &&
        current.cards.length === list.cards.length &&
        current.cards.every((card, cardIndex) => card.id === list.cards[cardIndex].id);
    });
    if (isSynchronized) {
      settlingListsRef.current = null;
      previewListsRef.current = null;
      setPreviewLists(null);
    }
  }, [initialLists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (disabled) return;
    const id = String(event.active.id);
    originalListsRef.current = initialLists;
    previewListsRef.current = initialLists;
    settlingListsRef.current = null;
    dropTargetRef.current = null;
    setActiveId(id);
    setActiveType(event.active.data.current?.type === 'list' ? 'list' : 'card');
    setMoveError(null);
  };

  const handleDragCancel = () => {
    originalListsRef.current = null;
    previewListsRef.current = null;
    settlingListsRef.current = null;
    dropTargetRef.current = null;
    setPreviewLists(null);
    setActiveId(null);
    setActiveType(null);
  };

  const projectCard = (cardId: string) => {
    const current = previewListsRef.current;
    const destination = dropTargetRef.current;
    if (!current || !destination) return current;

    const source = current.find((list) => list.cards.some((card) => card.id === cardId));
    const target = current.find((list) => list.id === destination.listId);
    if (!source || !target) return current;

    const sourceIndex = source.cards.findIndex((card) => card.id === cardId);
    const remainingCount = target.cards.length - (source.id === target.id ? 1 : 0);
    const insertIndex = Math.max(0, Math.min(destination.index, remainingCount));
    if (source.id === target.id && sourceIndex === insertIndex) return current;

    const card = source.cards[sourceIndex];
    const next = current.map((list) => {
      if (list.id !== source.id && list.id !== target.id) return list;
      const cards = list.cards.filter((item) => item.id !== cardId);
      if (list.id === target.id) {
        cards.splice(insertIndex, 0, { ...card, listId: target.id });
      }
      return { ...list, cards };
    });
    previewListsRef.current = next;
    setPreviewLists(next);
    return next;
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!disabled && activeType === 'card') projectCard(String(event.active.id));
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!disabled && activeType === 'card') projectCard(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const type = activeType;
    const previousLists = originalListsRef.current;
    const nextLists = type === 'card' && event.over
      ? projectCard(String(event.active.id))
      : previewListsRef.current;
    if (disabled || !event.over || !previousLists) {
      handleDragCancel();
      return;
    }

    const finishDrag = (next: ListWithCards[]) => {
      originalListsRef.current = null;
      dropTargetRef.current = null;
      previewListsRef.current = next;
      settlingListsRef.current = next;
      setPreviewLists(next);
      setActiveId(null);
      setActiveType(null);
      onListsChange(next);
    };

    const id = String(event.active.id);
    if (type === 'list') {
      const oldIndex = previousLists.findIndex((list) => list.id === id);
      const newIndex = previousLists.findIndex((list) => list.id === String(event.over?.id));
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        handleDragCancel();
        return;
      }

      finishDrag(arrayMove(previousLists, oldIndex, newIndex));
      try {
        await moveList(id, newIndex);
      } catch {
        settlingListsRef.current = previousLists;
        previewListsRef.current = previousLists;
        setPreviewLists(previousLists);
        onListsChange(previousLists);
        setMoveError('Không thể di chuyển danh sách. Vui lòng thử lại.');
      }
      return;
    }

    if (type !== 'card' || !nextLists) {
      handleDragCancel();
      return;
    }
    const originalList = previousLists.find((list) => list.cards.some((card) => card.id === id));
    const targetList = nextLists.find((list) => list.cards.some((card) => card.id === id));
    if (!originalList || !targetList) {
      handleDragCancel();
      return;
    }

    const originalIndex = originalList.cards.findIndex((card) => card.id === id);
    const targetIndex = targetList.cards.findIndex((card) => card.id === id);
    if (originalList.id === targetList.id && originalIndex === targetIndex) {
      handleDragCancel();
      return;
    }

    finishDrag(nextLists);
    try {
      await moveCard(id, targetList.id, targetIndex);
    } catch (error) {
      settlingListsRef.current = previousLists;
      previewListsRef.current = previousLists;
      setPreviewLists(previousLists);
      onListsChange(previousLists);
      setMoveError(getConflictMessage(error) || 'Không thể di chuyển thẻ. Vui lòng thử lại.');
    }
  };

  return {
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
  };
}
