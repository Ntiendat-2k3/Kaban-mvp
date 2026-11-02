import { Request, Response } from 'express';
import { AttachmentService } from '../services/attachment.service.js';
import { SequelizeAttachmentRepository } from '../repositories/sequelize/attachment.repository.js';
import { SequelizeBoardRepository } from '../repositories/sequelize/board.repository.js';
import { ResponseView } from '../views/response.view.js';

const attachmentRepo = new SequelizeAttachmentRepository();
const boardRepo = new SequelizeBoardRepository();
export const attachmentService = new AttachmentService(attachmentRepo, boardRepo);

export class AttachmentController {
  static async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;
      const file = req.file!;
      const isCover = req.body.isCover !== undefined ? Boolean(req.body.isCover) : undefined;

      const attachment = await attachmentService.uploadAttachment(
        userId,
        cardId,
        file.buffer,
        file.originalname,
        file.mimetype,
        isCover
      );

      res.status(201).json(attachment);
    } catch (error: any) {
      ResponseView.error(
        res,
        error.code || 'ATTACHMENT_ERROR',
        error.message || 'Lỗi khi tải lên tệp đính kèm',
        error.statusCode || 400
      );
    }
  }

  static async getAttachments(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;

      const attachments = await attachmentService.getAttachments(userId, cardId);
      res.status(200).json(attachments);
    } catch (error: any) {
      ResponseView.error(
        res,
        error.code || 'ATTACHMENT_ERROR',
        error.message || 'Lỗi khi lấy danh sách tệp đính kèm',
        error.statusCode || 404
      );
    }
  }

  static async deleteAttachment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId, attachmentId } = req.params;

      await attachmentService.deleteAttachment(userId, cardId, attachmentId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(
        res,
        error.code || 'ATTACHMENT_ERROR',
        error.message || 'Lỗi khi xoá tệp đính kèm',
        error.statusCode || 400
      );
    }
  }

  static async duplicateAttachment(req: Request, res: Response): Promise<void> {
    try {
      const attachment = await attachmentService.duplicateAttachment(
        (req as any).user?.id,
        req.params.cardId,
        req.params.attachmentId
      );
      res.status(201).json(attachment);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi nhân bản tệp đính kèm', error.statusCode || 400);
    }
  }

  static async setCover(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId, attachmentId } = req.params;
      const { isCover } = req.body;

      const updated = await attachmentService.setCover(userId, cardId, attachmentId, isCover);
      res.status(200).json(updated);
    } catch (error: any) {
      ResponseView.error(
        res,
        error.code || 'ATTACHMENT_ERROR',
        error.message || 'Lỗi khi thiết lập bìa',
        error.statusCode || 400
      );
    }
  }
}

