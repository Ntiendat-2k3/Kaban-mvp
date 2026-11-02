export interface AttachmentEntity {
  id: string;
  cardId: string;
  boardId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  mimeType: string;
  publicId: string | null;
  size: number;
  isCover: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachmentRepository {
  findByCardId(cardId: string): Promise<AttachmentEntity[]>;
  findById(attachmentId: string): Promise<AttachmentEntity | null>;
  createAttachment(data: {
    cardId: string;
    boardId: string;
    fileName: string;
    fileUrl: string;
    fileType: 'image' | 'video';
    mimeType: string;
    publicId?: string | null;
    size: number;
    isCover?: boolean;
  }): Promise<AttachmentEntity>;
  deleteAttachment(attachmentId: string): Promise<boolean>;
  setCover(cardId: string, attachmentId: string, isCover: boolean): Promise<AttachmentEntity | null>;
  getCoverByCardId(cardId: string): Promise<AttachmentEntity | null>;
  countByCardId(cardId: string): Promise<number>;
  countByPublicId(publicId: string): Promise<number>;
}
