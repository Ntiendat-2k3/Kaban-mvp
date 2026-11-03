import { Request, Response } from 'express';
import { CardService } from '../services/card.service.js';
import { SequelizeCardRepository } from '../repositories/sequelize/card.repository.js';
import { SequelizeBoardRepository } from '../repositories/sequelize/board.repository.js';
import { ResponseView } from '../views/response.view.js';
import { Attachment } from '../models/index.js';

const cardRepo = new SequelizeCardRepository();
const boardRepo = new SequelizeBoardRepository();
export const cardService = new CardService(cardRepo, boardRepo);

export class CardController {
  static async createCard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { listId } = req.params;
      const { title } = req.body;

      const card = await cardService.createCard(listId, userId, title);
      res.status(201).json(card);
    } catch (error: any) {
      error.code ? ResponseView.error(res, error.code, error.message || 'Lỗi tạo thẻ', error.statusCode || 400) : ResponseView.error(res, error.message || 'Lỗi tạo thẻ', error.statusCode || 400);
    }
  }

  static async duplicateCard(req: Request, res: Response): Promise<void> {
    try {
      const card = await cardService.duplicateCard(req.params.cardId, (req as any).user?.id);
      res.status(201).json(card);
    } catch (error: any) {
      error.code ? ResponseView.error(res, error.code, error.message || 'Lỗi nhân bản thẻ', error.statusCode || 400) : ResponseView.error(res, error.message || 'Lỗi nhân bản thẻ', error.statusCode || 400);
    }
  }

  static async moveCard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;
      const { toListId, toIndex } = req.body;

      await cardService.moveCard(cardId, userId, toListId, toIndex);
      res.status(204).send();
    } catch (error: any) {
      error.code ? ResponseView.error(res, error.code, error.message || 'Lỗi di chuyển thẻ', error.statusCode || 400) : ResponseView.error(res, error.message || 'Lỗi di chuyển thẻ', error.statusCode || 400);
    }
  }

  static async getCard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;

      const card = await cardService.getCardDetail(cardId, userId);

      // Lấy danh sách attachment đính kèm của thẻ (REQ-ATT-02)
      const attachments = await Attachment.findAll({
        where: { cardId },
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        ...card,
        attachments: attachments.map((att) => ({
          id: att.id,
          cardId: att.cardId,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          mimeType: att.mimeType,
          size: att.size,
          isCover: att.isCover,
          createdAt: att.createdAt,
        })),
      });
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi lấy chi tiết thẻ', error.statusCode || 404);
    }
  }

  static async updateCard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;
      const { title, description, dueDate, dueComplete } = req.body;

      const patch: any = {};
      if (title !== undefined) patch.title = title;
      if (description !== undefined) patch.description = description;
      if (dueDate !== undefined) patch.dueDate = dueDate ? new Date(dueDate) : null;
      if (dueComplete !== undefined) patch.dueComplete = dueComplete;

      const updated = await cardService.updateCard(cardId, userId, patch);
      res.status(200).json(updated);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi cập nhật thẻ', error.statusCode || 400);
    }
  }

  static async archiveCard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;

      await cardService.archiveCard(cardId, userId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi lưu trữ thẻ', error.statusCode || 400);
    }
  }

  static async getArchivedCards(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const cards = await cardService.getArchivedCards(req.params.boardId, userId);
      res.status(200).json(cards);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi tải thẻ đã lưu trữ', error.statusCode || 500);
    }
  }

  static async deleteCard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      await cardService.deleteCard(req.params.cardId, userId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi xóa thẻ', error.statusCode || 400);
    }
  }

  static async restoreCard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;

      const restored = await cardService.restoreCard(cardId, userId);
      res.status(200).json(restored);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi khôi phục thẻ', error.statusCode || 400);
    }
  }

  static async addCardMember(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = (req as any).user?.id;
      const { cardId, userId: targetUserId } = req.params;

      await cardService.addCardMember(cardId, targetUserId, currentUserId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi gán thành viên', error.statusCode || 400);
    }
  }

  static async removeCardMember(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = (req as any).user?.id;
      const { cardId, userId: targetUserId } = req.params;

      await cardService.removeCardMember(cardId, targetUserId, currentUserId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi gỡ thành viên', error.statusCode || 400);
    }
  }
}
