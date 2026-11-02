'use client';

import { useState, useMemo } from 'react';
import { ListWithCards, CardSummary } from '@/types/board-detail';

export interface BoardFilterState {
  keyword: string;
  selectedLabelIds: string[];
  selectedMemberIds: string[];
  dueFilter: 'all' | 'overdue' | 'today' | 'noDue';
}

/**
 * Hàm chuẩn hoá chuỗi tiếng Việt không dấu để tìm kiếm từ khoá (SRS §8, BR-09)
 */
export function normalizeVietnamese(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Hook quản lý bộ lọc thẻ phía client (SRS §8, BR-09)
 */
export function useBoardFilter(lists: ListWithCards[]) {
  const [filters, setFilters] = useState<BoardFilterState>({
    keyword: '',
    selectedLabelIds: [],
    selectedMemberIds: [],
    dueFilter: 'all',
  });

  const isFilterActive = useMemo(() => {
    return (
      filters.keyword.trim().length > 0 ||
      filters.selectedLabelIds.length > 0 ||
      filters.selectedMemberIds.length > 0 ||
      filters.dueFilter !== 'all'
    );
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      keyword: '',
      selectedLabelIds: [],
      selectedMemberIds: [],
      dueFilter: 'all',
    });
  };

  // Lọc thẻ cho từng cột
  const { filteredLists, totalMatches, totalCards } = useMemo(() => {
    let matchesCount = 0;
    let cardCount = 0;

    const normKeyword = normalizeVietnamese(filters.keyword);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000;

    const resultLists = lists.map((list) => {
      cardCount += list.cards.length;

      const matchedCards = list.cards.filter((card) => {
        // 1. Lọc từ khoá tiêu đề không dấu
        if (normKeyword) {
          const normTitle = normalizeVietnamese(card.title);
          if (!normTitle.includes(normKeyword)) return false;
        }

        // 2. Lọc theo nhãn
        if (filters.selectedLabelIds.length > 0) {
          const hasLabel = filters.selectedLabelIds.some((id) =>
            card.labelIds?.includes(id)
          );
          if (!hasLabel) return false;
        }

        // 3. Lọc theo thành viên
        if (filters.selectedMemberIds.length > 0) {
          const hasMember = filters.selectedMemberIds.some((id) =>
            card.memberIds?.includes(id)
          );
          if (!hasMember) return false;
        }

        // 4. Lọc theo hạn chót
        if (filters.dueFilter !== 'all') {
          if (filters.dueFilter === 'noDue') {
            if (card.dueDate) return false;
          } else if (filters.dueFilter === 'overdue') {
            if (!card.dueDate || card.dueComplete) return false;
            if (new Date(card.dueDate).getTime() >= now.getTime()) return false;
          } else if (filters.dueFilter === 'today') {
            if (!card.dueDate) return false;
            const dueTime = new Date(card.dueDate).getTime();
            if (dueTime < startOfToday || dueTime > endOfToday) return false;
          }
        }

        return true;
      });

      matchesCount += matchedCards.length;

      return {
        ...list,
        cards: isFilterActive ? matchedCards : list.cards,
      };
    });

    return {
      filteredLists: resultLists,
      totalMatches: matchesCount,
      totalCards: cardCount,
    };
  }, [lists, filters, isFilterActive]);

  return {
    filters,
    setFilters,
    isFilterActive,
    resetFilters,
    filteredLists,
    totalMatches,
    totalCards,
  };
}
