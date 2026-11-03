import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { BoardController } from '../controllers/board.controller.js';
import { BoardInvitationController } from '../controllers/board-invitation.controller.js';
import { ActivityController } from '../controllers/activity.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createBoardSchema,
  updateBoardSchema,
  addMemberSchema,
  boardInvitationTokenSchema,
} from '../validations/board.schema.js';

export const boardRouter = Router();
const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Gửi quá nhiều lời mời, vui lòng thử lại sau' } },
});

// Link mời có thể xem khi chưa đăng nhập; chấp nhận lời mời cần tài khoản đúng email.
boardRouter.get('/invitations/:token', validate(boardInvitationTokenSchema), BoardInvitationController.get);
boardRouter.post('/invitations/:token/accept', authMiddleware, validate(boardInvitationTokenSchema), BoardInvitationController.accept);

// CRUD bảng
boardRouter.get('/boards', authMiddleware, BoardController.getBoards);
boardRouter.post(
  '/boards',
  authMiddleware,
  validate(createBoardSchema as any),
  BoardController.createBoard
);
boardRouter.get('/boards/:boardId', authMiddleware, BoardController.getBoardDetail);
boardRouter.get('/boards/:boardId/activities', authMiddleware, ActivityController.getBoardActivities);
boardRouter.patch(
  '/boards/:boardId',
  authMiddleware,
  validate(updateBoardSchema as any),
  BoardController.updateBoard
);

// Gắn sao & Đóng/mở bảng
boardRouter.put('/boards/:boardId/star', authMiddleware, BoardController.starBoard);
boardRouter.delete('/boards/:boardId/star', authMiddleware, BoardController.unstarBoard);
boardRouter.post('/boards/:boardId/archive', authMiddleware, BoardController.archiveBoard);
boardRouter.post('/boards/:boardId/restore', authMiddleware, BoardController.restoreBoard);

// Thành viên
boardRouter.get('/boards/:boardId/members', authMiddleware, BoardController.getMembers);
boardRouter.post(
  '/boards/:boardId/members',
  authMiddleware,
  inviteLimiter,
  validate(addMemberSchema as any),
  BoardController.addMember
);
boardRouter.delete(
  '/boards/:boardId/members/:userId',
  authMiddleware,
  BoardController.removeMember
);
