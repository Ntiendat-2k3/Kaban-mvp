import {
  IAttachmentRepository,
  AttachmentEntity,
} from '../repositories/interfaces/IAttachmentRepository.js';
import { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import { CloudinaryService } from './cloudinary.service.js';
import { Card } from '../models/index.js';

export class AttachmentService {
  constructor(
    private attachmentRepo: IAttachmentRepository,
    private boardRepo: IBoardRepository
  ) {}

  private async verifyCardAccess(cardId: string, userId: string): Promise<Card> {
    const card = await Card.findByPk(cardId);
    if (!card || card.isArchived) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(card.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    return card;
  }

  /**
   * Tải lên tệp ảnh hoặc video đính kèm cho thẻ (API-27, REQ-ATT-01, BR-03)
   */
  async uploadAttachment(
    userId: string,
    cardId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    isCover?: boolean
  ): Promise<AttachmentEntity> {
    const card = await this.verifyCardAccess(cardId, userId);

    // 1. Tải tệp lên Cloudinary (hoặc mock fallback an toàn khi thiếu key)
    const uploadResult = await CloudinaryService.uploadBuffer(fileBuffer, fileName, mimeType);

    // 2. Lưu thông tin vào CSDL PostgreSQL
    return this.attachmentRepo.createAttachment({
      cardId,
      boardId: card.boardId,
      fileName,
      fileUrl: uploadResult.fileUrl,
      fileType: uploadResult.fileType,
      mimeType,
      publicId: uploadResult.publicId,
      size: uploadResult.size,
      isCover,
    });
  }

  /**
   * Lấy danh sách tệp đính kèm của thẻ (API-28, REQ-ATT-02)
   */
  async getAttachments(userId: string, cardId: string): Promise<AttachmentEntity[]> {
    await this.verifyCardAccess(cardId, userId);
    return this.attachmentRepo.findByCardId(cardId);
  }

  /** Tạo bản sao metadata, dùng chung tệp gốc để không tải lại video hoặc ảnh lớn. */
  async duplicateAttachment(userId: string, cardId: string, attachmentId: string): Promise<AttachmentEntity> {
    await this.verifyCardAccess(cardId, userId);
    const attachment = await this.attachmentRepo.findById(attachmentId);
    if (!attachment || attachment.cardId !== cardId) {
      const error: any = new Error('Không tìm thấy tệp đính kèm');
      error.statusCode = 404;
      throw error;
    }

    return this.attachmentRepo.createAttachment({
      cardId,
      boardId: attachment.boardId,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      mimeType: attachment.mimeType,
      publicId: attachment.publicId,
      size: attachment.size,
      isCover: false,
    });
  }

  /**
   * Xoá tệp đính kèm khỏi DB và Cloudinary (API-29, REQ-ATT-02, BR-03)
   */
  async deleteAttachment(
    userId: string,
    cardId: string,
    attachmentId: string
  ): Promise<void> {
    await this.verifyCardAccess(cardId, userId);

    const attachment = await this.attachmentRepo.findById(attachmentId);
    if (!attachment || attachment.cardId !== cardId) {
      const error: any = new Error('Không tìm thấy tệp đính kèm');
      error.statusCode = 404;
      throw error;
    }

    // Chỉ xoá tệp gốc khi không còn bản sao nào cùng tham chiếu.
    await this.attachmentRepo.deleteAttachment(attachmentId);
    if (attachment.publicId && await this.attachmentRepo.countByPublicId(attachment.publicId) === 0) {
      await CloudinaryService.deleteFile(attachment.publicId, attachment.fileType);
    }
  }

  /**
   * Thiết lập hoặc gỡ ảnh/video bìa của thẻ (API-30, REQ-ATT-04, BR-05)
   */
  async setCover(
    userId: string,
    cardId: string,
    attachmentId: string,
    isCover: boolean
  ): Promise<AttachmentEntity> {
    await this.verifyCardAccess(cardId, userId);

    const updated = await this.attachmentRepo.setCover(cardId, attachmentId, isCover);
    if (!updated) {
      const error: any = new Error('Không tìm thấy tệp đính kèm');
      error.statusCode = 404;
      throw error;
    }

    return updated;
  }
}
