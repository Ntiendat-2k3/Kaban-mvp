import {
  ICommentRepository,
  CommentEntity,
} from '../repositories/interfaces/ICommentRepository.js';
import { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import { Card, Comment } from '../models/index.js';
import { emitBoardChanged } from '../realtime/socket.js';
import { logActivity } from './activity.service.js';

export class CommentService {
  constructor(
    private commentRepo: ICommentRepository,
    private boardRepo: IBoardRepository
  ) {}

  async createComment(cardId: string, userId: string, text: string): Promise<CommentEntity> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(card.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền');
      error.statusCode = 404;
      throw error;
    }

    const created = await this.commentRepo.createComment(cardId, userId, text);
    await logActivity({ boardId: card.boardId, cardId, userId, type: 'comment.added' });
    emitBoardChanged(card.boardId, { type: 'card.updated', actorId: userId, cardId });
    return created;
  }

  async updateComment(
    commentId: string,
    userId: string,
    text: string
  ): Promise<CommentEntity> {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      const error: any = new Error('Không tìm thấy bình luận');
      error.statusCode = 404;
      throw error;
    }

    // Chỉ tác giả được sửa bình luận (RISK-03, BR-07, TC-02.2-04)
    if (comment.userId !== userId) {
      const error: any = new Error('Chỉ tác giả mới có quyền chỉnh sửa bình luận');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const updated = await this.commentRepo.updateComment(commentId, text);
    const card = await Card.findByPk(comment.cardId);
    if (card) emitBoardChanged(card.boardId, { type: 'card.updated', actorId: userId, cardId: card.id });
    return updated;
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      const error: any = new Error('Không tìm thấy bình luận');
      error.statusCode = 404;
      throw error;
    }

    // Chỉ tác giả được xoá bình luận (RISK-03, BR-07, TC-02.2-05)
    if (comment.userId !== userId) {
      const error: any = new Error('Chỉ tác giả mới có quyền xoá bình luận');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    await this.commentRepo.deleteComment(commentId);
    const card = await Card.findByPk(comment.cardId);
    if (card) emitBoardChanged(card.boardId, { type: 'card.updated', actorId: userId, cardId: card.id });
  }
}
