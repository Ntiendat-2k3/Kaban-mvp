import { Request, Response } from 'express';
import { ChecklistService } from '../services/checklist.service.js';
import { SequelizeChecklistRepository } from '../repositories/sequelize/checklist.repository.js';
import { SequelizeBoardRepository } from '../repositories/sequelize/board.repository.js';
import { ResponseView } from '../views/response.view.js';

const checklistRepo = new SequelizeChecklistRepository();
const boardRepo = new SequelizeBoardRepository();
export const checklistService = new ChecklistService(checklistRepo, boardRepo);

export class ChecklistController {
  static async createChecklist(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;
      const { title } = req.body;

      const checklist = await checklistService.createChecklist(cardId, userId, title);
      res.status(201).json(checklist);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi tạo checklist', error.statusCode || 400);
    }
  }

  static async deleteChecklist(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { checklistId } = req.params;

      await checklistService.deleteChecklist(checklistId, userId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi xoá checklist', error.statusCode || 400);
    }
  }

  static async createChecklistItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { checklistId } = req.params;
      const { text } = req.body;

      const item = await checklistService.createChecklistItem(checklistId, userId, text);
      res.status(201).json(item);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi thêm mục checklist', error.statusCode || 400);
    }
  }

  static async updateChecklistItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { itemId } = req.params;
      const { text, done } = req.body;

      const item = await checklistService.updateChecklistItem(itemId, userId, { text, done });
      res.status(200).json(item);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi cập nhật mục checklist', error.statusCode || 400);
    }
  }

  static async deleteChecklistItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { itemId } = req.params;

      await checklistService.deleteChecklistItem(itemId, userId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi xoá mục checklist', error.statusCode || 400);
    }
  }
}
