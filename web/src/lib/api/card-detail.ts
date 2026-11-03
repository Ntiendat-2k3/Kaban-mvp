import { apiClient } from './client';
import { CardDetail, CardPatchInput, Checklist, ChecklistItem, Comment } from '@/types/card-detail';
import { BoardLabel } from '@/types/board-detail';
import type { components } from '@/types/api';

export type ArchivedCard = components['schemas']['ArchivedCard'];

/** Liệt kê các thẻ có thể tìm lại từ kho lưu trữ của bảng. */
export async function getArchivedCards(boardId: string): Promise<ArchivedCard[]> {
  const response = await apiClient.get<ArchivedCard[]>(`/boards/${boardId}/archived-cards`);
  return response.data;
}

/**
 * Lấy chi tiết thẻ (API-08, BR-01)
 */
export async function getCardDetail(cardId: string): Promise<CardDetail> {
  const response = await apiClient.get<CardDetail>(`/cards/${cardId}`);
  return response.data;
}

/**
 * Cập nhật thông tin thẻ (API-09, BR-02, BR-05)
 */
export async function updateCard(cardId: string, patch: CardPatchInput): Promise<CardDetail> {
  const response = await apiClient.patch<CardDetail>(`/cards/${cardId}`, patch);
  return response.data;
}

/**
 * Lưu trữ thẻ (API-10, BR-08)
 */
export async function archiveCard(cardId: string): Promise<void> {
  await apiClient.post(`/cards/${cardId}/archive`);
}

/** Xóa vĩnh viễn thẻ và nội dung của thẻ. */
export async function deleteCard(cardId: string): Promise<void> {
  await apiClient.delete(`/cards/${cardId}`);
}

/**
 * Khôi phục thẻ vào cuối list gốc (API-11, BR-08)
 */
export async function restoreCard(cardId: string): Promise<any> {
  const response = await apiClient.post(`/cards/${cardId}/restore`);
  return response.data;
}

/**
 * Gán nhãn cho thẻ (API-12, BR-03)
 */
export async function addCardLabel(cardId: string, labelId: string): Promise<void> {
  await apiClient.put(`/cards/${cardId}/labels/${labelId}`);
}

/**
 * Gỡ nhãn khỏi thẻ (API-13, BR-03)
 */
export async function removeCardLabel(cardId: string, labelId: string): Promise<void> {
  await apiClient.delete(`/cards/${cardId}/labels/${labelId}`);
}

/**
 * Tạo nhãn mới cho bảng (API-16, BR-03)
 */
export async function createBoardLabel(
  boardId: string,
  color: string,
  name = ''
): Promise<BoardLabel> {
  const response = await apiClient.post<BoardLabel>(`/boards/${boardId}/labels`, {
    color,
    name,
  });
  return response.data;
}

/**
 * Cập nhật nhãn bảng (API-17, BR-03)
 */
export async function updateBoardLabel(
  labelId: string,
  patch: { color?: string; name?: string }
): Promise<BoardLabel> {
  const response = await apiClient.patch<BoardLabel>(`/labels/${labelId}`, patch);
  return response.data;
}

/**
 * Xoá nhãn bảng (API-18, BR-03, RISK-01)
 */
export async function deleteBoardLabel(labelId: string): Promise<void> {
  await apiClient.delete(`/labels/${labelId}`);
}

/**
 * Gán thành viên vào thẻ (API-14, BR-04)
 */
export async function addCardMember(cardId: string, userId: string): Promise<void> {
  await apiClient.put(`/cards/${cardId}/members/${userId}`);
}

/**
 * Gỡ thành viên khỏi thẻ (API-15, BR-04)
 */
export async function removeCardMember(cardId: string, userId: string): Promise<void> {
  await apiClient.delete(`/cards/${cardId}/members/${userId}`);
}

/**
 * Tạo checklist mới (API-19, BR-06)
 */
export async function createChecklist(cardId: string, title: string): Promise<Checklist> {
  const response = await apiClient.post<Checklist>(`/cards/${cardId}/checklists`, { title });
  return response.data;
}

/**
 * Xoá checklist (API-20, BR-06)
 */
export async function deleteChecklist(checklistId: string): Promise<void> {
  await apiClient.delete(`/checklists/${checklistId}`);
}

/**
 * Thêm mục vào checklist (API-21, BR-06)
 */
export async function createChecklistItem(
  checklistId: string,
  text: string
): Promise<ChecklistItem> {
  const response = await apiClient.post<ChecklistItem>(`/checklists/${checklistId}/items`, {
    text,
  });
  return response.data;
}

/**
 * Sửa mục checklist (API-22, BR-06)
 */
export async function updateChecklistItem(
  itemId: string,
  patch: { text?: string; done?: boolean }
): Promise<ChecklistItem> {
  const response = await apiClient.patch<ChecklistItem>(`/checklist-items/${itemId}`, patch);
  return response.data;
}

/**
 * Xoá mục checklist (API-23, BR-06)
 */
export async function deleteChecklistItem(itemId: string): Promise<void> {
  await apiClient.delete(`/checklist-items/${itemId}`);
}

/**
 * Tạo bình luận (API-24, BR-07)
 */
export async function createComment(cardId: string, text: string): Promise<Comment> {
  const response = await apiClient.post<Comment>(`/cards/${cardId}/comments`, { text });
  return response.data;
}

/**
 * Sửa bình luận (API-25, BR-07)
 */
export async function updateComment(commentId: string, text: string): Promise<Comment> {
  const response = await apiClient.patch<Comment>(`/comments/${commentId}`, { text });
  return response.data;
}

/**
 * Xoá bình luận (API-26, BR-07)
 */
export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}
