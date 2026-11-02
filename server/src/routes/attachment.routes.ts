import { Router } from 'express';
import { AttachmentController } from '../controllers/attachment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadAttachmentMiddleware } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  uploadAttachmentSchema,
  setCoverSchema,
  attachmentParamsSchema,
  cardParamSchema,
} from '../validations/attachment.schema.js';

export const attachmentRouter = Router();

// Tải lên tệp ảnh hoặc video đính kèm (API-27, REQ-ATT-01)
attachmentRouter.post(
  '/cards/:cardId/attachments',
  authMiddleware,
  uploadAttachmentMiddleware,
  validate(uploadAttachmentSchema as any),
  AttachmentController.uploadAttachment
);

// Lấy danh sách tệp đính kèm của thẻ (API-28, REQ-ATT-02)
attachmentRouter.get(
  '/cards/:cardId/attachments',
  authMiddleware,
  validate(cardParamSchema as any),
  AttachmentController.getAttachments
);

// Xoá tệp đính kèm (API-29, REQ-ATT-02)
attachmentRouter.delete(
  '/cards/:cardId/attachments/:attachmentId',
  authMiddleware,
  validate(attachmentParamsSchema as any),
  AttachmentController.deleteAttachment
);

attachmentRouter.post(
  '/cards/:cardId/attachments/:attachmentId/duplicate',
  authMiddleware,
  validate(attachmentParamsSchema as any),
  AttachmentController.duplicateAttachment
);

// Đặt hoặc gỡ ảnh/video bìa (API-30, REQ-ATT-04)
attachmentRouter.patch(
  '/cards/:cardId/attachments/:attachmentId/cover',
  authMiddleware,
  validate(setCoverSchema as any),
  AttachmentController.setCover
);

