import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { commentInputSchema } from '../validations/comment.schema.js';

export const commentRouter = Router();

commentRouter.post(
  '/cards/:cardId/comments',
  authMiddleware,
  validate(commentInputSchema as any),
  CommentController.createComment
);

commentRouter.patch(
  '/comments/:commentId',
  authMiddleware,
  validate(commentInputSchema as any),
  CommentController.updateComment
);

commentRouter.delete(
  '/comments/:commentId',
  authMiddleware,
  CommentController.deleteComment
);
