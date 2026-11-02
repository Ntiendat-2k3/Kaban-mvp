import { apiClient } from './client';
import { Attachment } from '@/types/attachment';

/**
 * Tải lên tệp ảnh hoặc video đính kèm cho thẻ (API-27, REQ-ATT-01)
 */
export async function uploadAttachment(
  cardId: string,
  file: File,
  isCover?: boolean
): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);
  if (isCover !== undefined) {
    formData.append('isCover', String(isCover));
  }

  const response = await apiClient.post<Attachment>(
    `/cards/${cardId}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Lấy danh sách tệp đính kèm của thẻ (API-28, REQ-ATT-02)
 */
export async function getAttachments(cardId: string): Promise<Attachment[]> {
  const response = await apiClient.get<Attachment[]>(`/cards/${cardId}/attachments`);
  return response.data;
}

/**
 * Xoá tệp đính kèm (API-29, REQ-ATT-02)
 */
export async function deleteAttachment(
  cardId: string,
  attachmentId: string
): Promise<void> {
  await apiClient.delete(`/cards/${cardId}/attachments/${attachmentId}`);
}

/** Nhân bản tệp đính kèm trong cùng thẻ mà không tải lại tệp gốc. */
export async function duplicateAttachment(cardId: string, attachmentId: string): Promise<Attachment> {
  const response = await apiClient.post<Attachment>(`/cards/${cardId}/attachments/${attachmentId}/duplicate`);
  return response.data;
}

/**
 * Thiết lập hoặc gỡ ảnh/video bìa (API-30, REQ-ATT-04)
 */
export async function setAttachmentCover(
  cardId: string,
  attachmentId: string,
  isCover: boolean
): Promise<Attachment> {
  const response = await apiClient.patch<Attachment>(
    `/cards/${cardId}/attachments/${attachmentId}/cover`,
    { isCover }
  );
  return response.data;
}
