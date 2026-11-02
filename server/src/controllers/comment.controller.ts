import { Request, Response } from 'express';
import { CommentService } from '../services/comment.service.js';
import { SequelizeCommentRepository } from '../repositories/sequelize/comment.repository.js';
import { SequelizeBoardRepository } from '../repositories/sequelize/board.repository.js';
import { ResponseView } from '../views/response.view.js';

const commentRepo = new SequelizeCommentRepository();
const boardRepo = new SequelizeBoardRepository();
export const commentService = new CommentService(commentRepo, boardRepo);

export class CommentController {
  static async createComment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { cardId } = req.params;
      const { text } = req.body;

      const comment = await commentService.createComment(cardId, userId, text);
      res.status(201).json(comment);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi tạo bình luận', error.statusCode || 400);
    }
  }

  static async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { commentId } = req.params;
      const { text } = req.body;

      const comment = await commentService.updateComment(commentId, userId, text);
      res.status(200).json(comment);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi cập nhật bình luận', error.statusCode || 400);
    }
  }

  static async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { commentId } = req.params;

      await commentService.deleteComment(commentId, userId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi xoá bình luận', error.statusCode || 400);
    }
  }
}
