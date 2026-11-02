import { Router } from 'express';
import { ChecklistController } from '../controllers/checklist.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createChecklistSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from '../validations/checklist.schema.js';

export const checklistRouter = Router();

checklistRouter.post(
  '/cards/:cardId/checklists',
  authMiddleware,
  validate(createChecklistSchema as any),
  ChecklistController.createChecklist
);

checklistRouter.delete(
  '/checklists/:checklistId',
  authMiddleware,
  ChecklistController.deleteChecklist
);

checklistRouter.post(
  '/checklists/:checklistId/items',
  authMiddleware,
  validate(createChecklistItemSchema as any),
  ChecklistController.createChecklistItem
);

checklistRouter.patch(
  '/checklist-items/:itemId',
  authMiddleware,
  validate(updateChecklistItemSchema as any),
  ChecklistController.updateChecklistItem
);

checklistRouter.delete(
  '/checklist-items/:itemId',
  authMiddleware,
  ChecklistController.deleteChecklistItem
);
