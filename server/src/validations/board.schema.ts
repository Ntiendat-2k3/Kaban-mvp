import { z } from 'zod';

export const backgroundEnum = z.enum([
  'blue',
  'orange',
  'green',
  'red',
  'purple',
  'pink',
  'lime',
  'sky',
]);

/**
 * Schema xác thực khi tạo bảng mới (POST /boards)
 */
export const createBoardSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Tên bảng là bắt buộc' })
      .trim()
      .min(1, 'Tên bảng không được để trống')
      .max(100, 'Tên bảng không được vượt quá 100 ký tự'),
    background: backgroundEnum.default('blue').optional(),
  }),
});

/**
 * Schema xác thực khi cập nhật bảng (PATCH /boards/:boardId)
 */
export const updateBoardSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Tên bảng không được để trống')
        .max(100, 'Tên bảng không được vượt quá 100 ký tự')
        .optional(),
      background: backgroundEnum.optional(),
    })
    .refine((data) => data.name !== undefined || data.background !== undefined, {
      message: 'Phải cung cấp ít nhất một trường cần cập nhật (name hoặc background)',
    }),
});

/**
 * Schema xác thực khi mời thành viên mới (POST /boards/:boardId/members)
 */
export const addMemberSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email là bắt buộc' })
      .email('Email không đúng định dạng'),
  }),
});
