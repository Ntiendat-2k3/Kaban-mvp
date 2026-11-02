import { z } from 'zod';

export const LABEL_COLORS = [
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'blue',
  'sky',
  'lime',
  'pink',
  'black',
] as const;

export const createLabelSchema = z.object({
  body: z.object({
    color: z.enum(LABEL_COLORS, {
      required_error: 'Màu nhãn là bắt buộc',
      invalid_type_error: 'Màu nhãn không hợp lệ',
    }),
    name: z
      .string()
      .max(50, 'Tên nhãn không được vượt quá 50 ký tự')
      .optional()
      .default(''),
  }),
});

export const updateLabelSchema = z.object({
  body: z
    .object({
      color: z.enum(LABEL_COLORS).optional(),
      name: z.string().max(50, 'Tên nhãn không được vượt quá 50 ký tự').optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Cần ít nhất một thuộc tính để cập nhật nhãn',
    }),
});
