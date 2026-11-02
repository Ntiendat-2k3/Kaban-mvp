import { Request, Response } from 'express';
import { LabelService } from '../services/label.service.js';
import { SequelizeLabelRepository } from '../repositories/sequelize/label.repository.js';
import { SequelizeBoardRepository } from '../repositories/sequelize/board.repository.js';
import { ResponseView } from '../views/response.view.js';

const labelRepo = new SequelizeLabelRepository();
const boardRepo = new SequelizeBoardRepository();
export const labelService = new LabelService(labelRepo, boardRepo);

export class LabelController {
  static async createLabel(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { boardId } = req.params;
      const { color, name } = req.body;

      const label = await labelService.createLabel(boardId, userId, color, name);
      res.status(201).json(label);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi tạo nhãn', error.statusCode || 400);
    }
  }

  static async updateLabel(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { labelId } = req.params;
      const { color, name } = req.body;

      const label = await labelService.updateLabel(labelId, userId, { color, name });
      res.status(200).json(label);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi cập nhật nhãn', error.statusCode || 400);
    }
  }

  static async deleteLabel(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { labelId } = req.params;

      await labelService.deleteLabel(labelId, userId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi xoá nhãn', error.statusCode || 400);
    }
  }

  static async addCardLabel(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId, labelId } = req.params;

      await labelService.addCardLabel(cardId, labelId, userId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi gán nhãn cho thẻ', error.statusCode || 400);
    }
  }

  static async removeCardLabel(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId, labelId } = req.params;

      await labelService.removeCardLabel(cardId, labelId, userId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi gỡ nhãn khỏi thẻ', error.statusCode || 400);
    }
  }
}
