import {
  ICommentRepository,
  CommentEntity,
} from '../interfaces/ICommentRepository.js';
import { Comment, User } from '../../models/index.js';

export class SequelizeCommentRepository implements ICommentRepository {
  async createComment(
    cardId: string,
    userId: string,
    text: string
  ): Promise<CommentEntity> {
    const comment = await Comment.create({
      cardId,
      userId,
      content: text,
      editedAt: null,
    });

    const user = await User.findByPk(userId);

    return {
      id: comment.id,
      cardId: comment.cardId,
      author: {
        id: user ? user.id : userId,
        name: user ? user.name : '',
        email: user ? user.email : '',
      },
      text: comment.content,
      createdAt: comment.createdAt,
      editedAt: comment.editedAt,
    };
  }

  async updateComment(commentId: string, text: string): Promise<CommentEntity> {
    const comment = await Comment.findByPk(commentId, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }],
    });
    if (!comment) {
      const error: any = new Error('Không tìm thấy bình luận');
      error.statusCode = 404;
      throw error;
    }

    comment.content = text;
    comment.editedAt = new Date();
    await comment.save();

    const author = (comment as any).author;

    return {
      id: comment.id,
      cardId: comment.cardId,
      author: {
        id: author ? author.id : comment.userId,
        name: author ? author.name : '',
        email: author ? author.email : '',
      },
      text: comment.content,
      createdAt: comment.createdAt,
      editedAt: comment.editedAt,
    };
  }

  async deleteComment(commentId: string): Promise<void> {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      const error: any = new Error('Không tìm thấy bình luận');
      error.statusCode = 404;
      throw error;
    }

    await comment.destroy();
  }

  async getCommentById(commentId: string): Promise<CommentEntity | null> {
    const comment = await Comment.findByPk(commentId, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }],
    });
    if (!comment) return null;

    const author = (comment as any).author;

    return {
      id: comment.id,
      cardId: comment.cardId,
      author: {
        id: author ? author.id : comment.userId,
        name: author ? author.name : '',
        email: author ? author.email : '',
      },
      text: comment.content,
      createdAt: comment.createdAt,
      editedAt: comment.editedAt,
    };
  }
}
