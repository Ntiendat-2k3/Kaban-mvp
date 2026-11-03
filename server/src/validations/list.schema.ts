import { z } from 'zod';
import { backgroundEnum } from './board.schema.js';

export const createListSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Tên danh sách là bắt buộc' })
      .trim()
      .min(1, 'Tên danh sách không được để trống')
      .max(100, 'Tên danh sách không được vượt quá 100 ký tự'),
  }),
});

export const updateListSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Tên danh sách không được để trống')
      .max(100, 'Tên danh sách không được vượt quá 100 ký tự').optional(),
    wipLimit: z.number().int().min(1).nullable().optional(),
    color: backgroundEnum.nullable().optional(),
  }).refine((data) => data.name !== undefined || data.wipLimit !== undefined || data.color !== undefined),
});

export const moveListSchema = z.object({
  body: z.object({
    toIndex: z.number({ required_error: 'toIndex là bắt buộc' }).int(),
  }),
});
