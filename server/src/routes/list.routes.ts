import { Router } from 'express';
import { ListController } from '../controllers/list.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createListSchema,
  updateListSchema,
  moveListSchema,
} from '../validations/list.schema.js';

export const listRouter = Router();

listRouter.post(
  '/boards/:boardId/lists',
  authMiddleware,
  validate(createListSchema as any),
  ListController.createList
);
listRouter.patch(
  '/lists/:listId',
  authMiddleware,
  validate(updateListSchema as any),
  ListController.updateList
);
listRouter.post('/lists/:listId/archive', authMiddleware, ListController.archiveList);
listRouter.post(
  '/lists/:listId/move',
  authMiddleware,
  validate(moveListSchema as any),
  ListController.moveList
);
