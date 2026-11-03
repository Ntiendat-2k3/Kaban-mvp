import { apiClient } from './client';
import { Board, BoardMember, BoardBackground } from '@/types/board';
import type { BoardDetail } from '@/types/board-detail';

/**
 * Lấy danh sách bảng của người dùng hiện tại (API-01, REQ-BD-01)
 */
export async function getBoards(includeClosed = false): Promise<Board[]> {
  const response = await apiClient.get<Board[]>('/boards', {
    params: { includeClosed },
  });
  return response.data;
}

/**
 * Lấy chi tiết thông tin bảng (API-03, REQ-BD-03)
 */
export async function getBoardDetail(boardId: string): Promise<BoardDetail> {
  const response = await apiClient.get<BoardDetail>(`/boards/${boardId}`);
  return response.data;
}

/**
 * Tạo bảng làm việc mới (API-02, REQ-BD-02)
 */
export async function createBoard(data: {
  name: string;
  background?: BoardBackground;
}): Promise<Board> {
  const response = await apiClient.post<Board>('/boards', data);
  return response.data;
}

/**
 * Cập nhật tên hoặc màu nền bảng (API-04, REQ-BD-03)
 */
export async function updateBoard(
  boardId: string,
  data: { name?: string; background?: BoardBackground }
): Promise<Board> {
  const response = await apiClient.patch<Board>(`/boards/${boardId}`, data);
  return response.data;
}

/**
 * Gắn sao bảng (API-07, REQ-BD-04)
 */
export async function starBoard(boardId: string): Promise<void> {
  await apiClient.put(`/boards/${boardId}/star`);
}

/**
 * Bỏ gắn sao bảng (API-08, REQ-BD-04)
 */
export async function unstarBoard(boardId: string): Promise<void> {
  await apiClient.delete(`/boards/${boardId}/star`);
}

/**
 * Đóng bảng lưu trữ (API-05, REQ-BD-05)
 */
export async function archiveBoard(boardId: string): Promise<Board> {
  const response = await apiClient.post<Board>(`/boards/${boardId}/archive`);
  return response.data;
}

/**
 * Khôi phục bảng đã đóng (API-06, REQ-BD-05)
 */
export async function restoreBoard(boardId: string): Promise<Board> {
  const response = await apiClient.post<Board>(`/boards/${boardId}/restore`);
  return response.data;
}

/**
 * Lấy danh sách thành viên của bảng (API-09, REQ-BD-06)
 */
export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  const response = await apiClient.get<BoardMember[]>(`/boards/${boardId}/members`);
  return response.data;
}

/** Gửi link mời tới email; người nhận chỉ xuất hiện trong bảng sau khi chấp nhận. */
export async function inviteBoardMember(boardId: string, email: string): Promise<{ email: string }> {
  const response = await apiClient.post<{ email: string }>(`/boards/${boardId}/members`, { email });
  return response.data;
}

/**
 * Xoá thành viên hoặc tự rời khỏi bảng (API-11, REQ-BD-07)
 */
export async function removeBoardMember(boardId: string, userId: string): Promise<void> {
  await apiClient.delete(`/boards/${boardId}/members/${userId}`);
}
