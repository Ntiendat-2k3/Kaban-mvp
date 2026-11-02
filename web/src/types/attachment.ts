export interface Attachment {
  id: string;
  cardId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  mimeType: string;
  size: number;
  isCover: boolean;
  createdAt: string;
}

export interface UploadAttachmentOptions {
  isCover?: boolean;
}
