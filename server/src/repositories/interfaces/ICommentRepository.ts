export interface CommentEntity {
  id: string;
  cardId: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  text: string;
  createdAt: Date;
  editedAt: Date | null;
}

export interface ICommentRepository {
  createComment(cardId: string, userId: string, text: string): Promise<CommentEntity>;
  updateComment(commentId: string, text: string): Promise<CommentEntity>;
  deleteComment(commentId: string): Promise<void>;
  getCommentById(commentId: string): Promise<CommentEntity | null>;
}
