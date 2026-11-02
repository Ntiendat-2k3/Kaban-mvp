import { apiClient } from './client';
import { ListWithCards, CardSummary } from '@/types/board-detail';

/**
 * Thêm danh sách mới vào cuối bảng (API-02, BR-03)
 */
export async function createList(boardId: string, name: string): Promise<ListWithCards> {
  const response = await apiClient.post<ListWithCards>(`/boards/${boardId}/lists`, { name });
  return { ...response.data, cards: response.data.cards || [] };
}

/**
 * Đổi tên danh sách (API-03, BR-04)
 */
export async function updateList(listId: string, name: string): Promise<ListWithCards> {
  const response = await apiClient.patch<ListWithCards>(`/lists/${listId}`, { name });
  return response.data;
}

/**
 * Lưu trữ danh sách và ẩn khỏi bảng (API-04, BR-04)
 */
export async function archiveList(listId: string): Promise<void> {
  await apiClient.post(`/lists/${listId}/archive`);
}

/**
 * Kéo thả di chuyển danh sách sang toIndex (API-05, BR-05)
 */
export async function moveList(listId: string, toIndex: number): Promise<void> {
  await apiClient.post(`/lists/${listId}/move`, { toIndex });
}

/**
 * Tạo thẻ mới ở cuối danh sách (API-06, BR-06)
 */
export async function createCard(listId: string, title: string): Promise<CardSummary> {
  const response = await apiClient.post<CardSummary>(`/lists/${listId}/cards`, { title });
  return response.data;
}

/** Nhân bản thẻ cùng danh sách, bao gồm nội dung và tệp đính kèm. */
export async function duplicateCard(cardId: string): Promise<CardSummary> {
  const response = await apiClient.post<CardSummary>(`/cards/${cardId}/duplicate`);
  return response.data;
}

/**
 * Kéo thả di chuyển thẻ (API-07, BR-07)
 */
export async function moveCard(
  cardId: string,
  toListId: string,
  toIndex: number
): Promise<void> {
  await apiClient.post(`/cards/${cardId}/move`, { toListId, toIndex });
}

