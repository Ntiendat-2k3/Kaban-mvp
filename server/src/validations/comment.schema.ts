import { z } from 'zod';

export const commentInputSchema = z.object({
  body: z.object({
    text: z
      .string({ required_error: 'Nội dung bình luận là bắt buộc' })
      .trim()
      .min(1, 'Nội dung bình luận không được để trống')
      .max(4096, 'Nội dung bình luận không được vượt quá 4096 ký tự'),
  }),
});
