import { Request, Response } from 'express';
import { ListService } from '../services/list.service.js';
import { SequelizeListRepository } from '../repositories/sequelize/list.repository.js';
import { SequelizeBoardRepository } from '../repositories/sequelize/board.repository.js';
import { ResponseView } from '../views/response.view.js';

const listRepo = new SequelizeListRepository();
const boardRepo = new SequelizeBoardRepository();
const listService = new ListService(listRepo, boardRepo);

export class ListController {
  static async createList(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { boardId } = req.params;
      const { name } = req.body;

      const list = await listService.createList(boardId, userId, name);
      res.status(201).json(list);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi tạo danh sách', error.statusCode || 400);
    }
  }

  static async updateList(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { listId } = req.params;
      const { name, wipLimit, color } = req.body;

      const updated = await listService.updateList(listId, userId, { name, wipLimit, color });
      res.status(200).json(updated);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi sửa danh sách', error.statusCode || 400);
    }
  }

  static async archiveList(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { listId } = req.params;

      await listService.archiveList(listId, userId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi lưu trữ danh sách', error.statusCode || 400);
    }
  }

  static async getArchivedLists(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const lists = await listService.getArchivedLists(req.params.boardId, userId);
      res.status(200).json(lists);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi tải danh sách đã lưu trữ', error.statusCode || 500);
    }
  }

  static async restoreList(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const list = await listService.restoreList(req.params.listId, userId);
      res.status(200).json(list);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi khôi phục danh sách', error.statusCode || 400);
    }
  }

  static async moveList(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { listId } = req.params;
      const { toIndex } = req.body;

      await listService.moveList(listId, userId, toIndex);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi di chuyển danh sách', error.statusCode || 400);
    }
  }
}
