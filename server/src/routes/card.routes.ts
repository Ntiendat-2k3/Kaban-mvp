import { Router } from 'express';
import { CardController } from '../controllers/card.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createCardSchema,
  moveCardSchema,
  updateCardSchema,
} from '../validations/card.schema.js';

export const cardRouter = Router();

cardRouter.post(
  '/lists/:listId/cards',
  authMiddleware,
  validate(createCardSchema as any),
  CardController.createCard
);

cardRouter.post(
  '/cards/:cardId/move',
  authMiddleware,
  validate(moveCardSchema as any),
  CardController.moveCard
);

cardRouter.post('/cards/:cardId/duplicate', authMiddleware, CardController.duplicateCard);

cardRouter.get('/boards/:boardId/archived-cards', authMiddleware, CardController.getArchivedCards);

cardRouter.get('/cards/:cardId', authMiddleware, CardController.getCard);

cardRouter.patch(
  '/cards/:cardId',
  authMiddleware,
  validate(updateCardSchema as any),
  CardController.updateCard
);

cardRouter.post('/cards/:cardId/archive', authMiddleware, CardController.archiveCard);

cardRouter.delete('/cards/:cardId', authMiddleware, CardController.deleteCard);

cardRouter.post('/cards/:cardId/restore', authMiddleware, CardController.restoreCard);

cardRouter.put('/cards/:cardId/members/:userId', authMiddleware, CardController.addCardMember);

cardRouter.delete('/cards/:cardId/members/:userId', authMiddleware, CardController.removeCardMember);
