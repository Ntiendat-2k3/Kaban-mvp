import { z } from 'zod';

export const createChecklistSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Tiêu đề checklist là bắt buộc' })
      .trim()
      .min(1, 'Tiêu đề checklist không được để trống')
      .max(100, 'Tiêu đề checklist không được vượt quá 100 ký tự'),
  }),
});

export const createChecklistItemSchema = z.object({
  body: z.object({
    text: z
      .string({ required_error: 'Nội dung mục checklist là bắt buộc' })
      .trim()
      .min(1, 'Nội dung mục không được để trống')
      .max(512, 'Nội dung mục không được vượt quá 512 ký tự'),
  }),
});

export const updateChecklistItemSchema = z.object({
  body: z
    .object({
      text: z
        .string()
        .trim()
        .min(1, 'Nội dung mục không được để trống')
        .max(512, 'Nội dung mục không được vượt quá 512 ký tự')
        .optional(),
      done: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Cần ít nhất một thuộc tính để cập nhật mục checklist',
    }),
});
