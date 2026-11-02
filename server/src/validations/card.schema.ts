import { z } from 'zod';

export const createCardSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Tiêu đề thẻ là bắt buộc' })
      .trim()
      .min(1, 'Tiêu đề thẻ không được để trống')
      .max(512, 'Tiêu đề thẻ không được vượt quá 512 ký tự'),
  }),
});

export const moveCardSchema = z.object({
  body: z.object({
    toListId: z.string({ required_error: 'toListId là bắt buộc' }).uuid('toListId phải là UUID hợp lệ'),
    toIndex: z.number({ required_error: 'toIndex là bắt buộc' }).int(),
  }),
});

export const updateCardSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(1, 'Tiêu đề thẻ không được để trống')
        .max(512, 'Tiêu đề thẻ không được vượt quá 512 ký tự')
        .optional(),
      description: z
        .string()
        .max(16384, 'Mô tả không được vượt quá 16384 ký tự')
        .optional(),
      dueDate: z
        .string()
        .datetime()
        .nullable()
        .optional(),
      dueComplete: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Cần ít nhất một thuộc tính để cập nhật',
    }),
});
