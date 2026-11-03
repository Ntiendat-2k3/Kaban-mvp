import { apiClient } from './client';

export interface BoardInvitationInfo {
  boardName: string;
  email: string;
  expiresAt: string;
}

export async function getBoardInvitation(token: string): Promise<BoardInvitationInfo> {
  const response = await apiClient.get<BoardInvitationInfo>(`/invitations/${encodeURIComponent(token)}`);
  return response.data;
}

export async function acceptBoardInvitation(token: string): Promise<{ boardId: string }> {
  const response = await apiClient.post<{ boardId: string }>(`/invitations/${encodeURIComponent(token)}/accept`);
  return response.data;
}
