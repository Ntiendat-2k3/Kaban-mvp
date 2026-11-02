import { Router } from 'express';
import { BoardController } from '../controllers/board.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createBoardSchema,
  updateBoardSchema,
  addMemberSchema,
} from '../validations/board.schema.js';

export const boardRouter = Router();

// CRUD bảng
boardRouter.get('/boards', authMiddleware, BoardController.getBoards);
boardRouter.post(
  '/boards',
  authMiddleware,
  validate(createBoardSchema as any),
  BoardController.createBoard
);
boardRouter.get('/boards/:boardId', authMiddleware, BoardController.getBoardDetail);
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
  validate(addMemberSchema as any),
  BoardController.addMember
);
boardRouter.delete(
  '/boards/:boardId/members/:userId',
  authMiddleware,
  BoardController.removeMember
);
