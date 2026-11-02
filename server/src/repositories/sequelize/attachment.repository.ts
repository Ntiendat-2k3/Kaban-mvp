import {
  IAttachmentRepository,
  AttachmentEntity,
} from '../interfaces/IAttachmentRepository.js';
import { Attachment } from '../../models/index.js';

export class SequelizeAttachmentRepository implements IAttachmentRepository {
  private toEntity(record: Attachment): AttachmentEntity {
    return {
      id: record.id,
      cardId: record.cardId,
      boardId: record.boardId,
      fileName: record.fileName,
      fileUrl: record.fileUrl,
      fileType: record.fileType,
      mimeType: record.mimeType,
      publicId: record.publicId,
      size: record.size,
      isCover: record.isCover,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async findByCardId(cardId: string): Promise<AttachmentEntity[]> {
    const records = await Attachment.findAll({
      where: { cardId },
      order: [['createdAt', 'DESC']],
    });
    return records.map((r) => this.toEntity(r));
  }

  async findById(attachmentId: string): Promise<AttachmentEntity | null> {
    const record = await Attachment.findByPk(attachmentId);
    return record ? this.toEntity(record) : null;
  }

  async countByCardId(cardId: string): Promise<number> {
    return Attachment.count({ where: { cardId } });
  }

  async countByPublicId(publicId: string): Promise<number> {
    return Attachment.count({ where: { publicId } });
  }

  async createAttachment(data: {
    cardId: string;
    boardId: string;
    fileName: string;
    fileUrl: string;
    fileType: 'image' | 'video';
    mimeType: string;
    publicId?: string | null;
    size: number;
    isCover?: boolean;
  }): Promise<AttachmentEntity> {
    // Nếu chưa chỉ định isCover, tệp đầu tiên của thẻ tự động đặt làm bìa (BR-05)
    let shouldBeCover = data.isCover;
    if (shouldBeCover === undefined) {
      const existingCount = await this.countByCardId(data.cardId);
      shouldBeCover = existingCount === 0;
    }

    if (shouldBeCover) {
      await Attachment.update(
        { isCover: false },
        { where: { cardId: data.cardId } }
      );
    }

    const record = await Attachment.create({
      cardId: data.cardId,
      boardId: data.boardId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      mimeType: data.mimeType,
      publicId: data.publicId || null,
      size: data.size,
      isCover: shouldBeCover,
    });

    return this.toEntity(record);
  }

  async deleteAttachment(attachmentId: string): Promise<boolean> {
    const count = await Attachment.destroy({ where: { id: attachmentId } });
    return count > 0;
  }

  async setCover(cardId: string, attachmentId: string, isCover: boolean): Promise<AttachmentEntity | null> {
    const target = await Attachment.findOne({
      where: { id: attachmentId, cardId },
    });
    if (!target) return null;

    if (isCover) {
      // Đặt các tệp khác của thẻ về false để chỉ có 1 cover duy nhất (BR-05)
      await Attachment.update(
        { isCover: false },
        { where: { cardId } }
      );
      target.isCover = true;
      await target.save();
    } else {
      target.isCover = false;
      await target.save();
    }

    return this.toEntity(target);
  }

  async getCoverByCardId(cardId: string): Promise<AttachmentEntity | null> {
    const cover = await Attachment.findOne({
      where: { cardId, isCover: true },
    });
    return cover ? this.toEntity(cover) : null;
  }
}
