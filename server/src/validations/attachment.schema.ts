import { z } from 'zod';

export const uploadAttachmentSchema = z.object({
  params: z.object({
    cardId: z.string().uuid('ID thẻ không hợp lệ'),
  }),
  body: z.object({
    isCover: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((val) => {
        if (typeof val === 'string') return val === 'true';
        return val;
      }),
  }),
});

export const setCoverSchema = z.object({
  params: z.object({
    cardId: z.string().uuid('ID thẻ không hợp lệ'),
    attachmentId: z.string().uuid('ID tệp đính kèm không hợp lệ'),
  }),
  body: z.object({
    isCover: z.boolean({ required_error: 'Trường isCover là bắt buộc' }),
  }),
});

export const attachmentParamsSchema = z.object({
  params: z.object({
    cardId: z.string().uuid('ID thẻ không hợp lệ'),
    attachmentId: z.string().uuid('ID tệp đính kèm không hợp lệ'),
  }),
});

export const cardParamSchema = z.object({
  params: z.object({
    cardId: z.string().uuid('ID thẻ không hợp lệ'),
  }),
});
