import { Router } from 'express';
import { LabelController } from '../controllers/label.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createLabelSchema, updateLabelSchema } from '../validations/label.schema.js';

export const labelRouter = Router();

labelRouter.post(
  '/boards/:boardId/labels',
  authMiddleware,
  validate(createLabelSchema as any),
  LabelController.createLabel
);

labelRouter.patch(
  '/labels/:labelId',
  authMiddleware,
  validate(updateLabelSchema as any),
  LabelController.updateLabel
);

labelRouter.delete(
  '/labels/:labelId',
  authMiddleware,
  LabelController.deleteLabel
);

labelRouter.put(
  '/cards/:cardId/labels/:labelId',
  authMiddleware,
  LabelController.addCardLabel
);

labelRouter.delete(
  '/cards/:cardId/labels/:labelId',
  authMiddleware,
  LabelController.removeCardLabel
);
