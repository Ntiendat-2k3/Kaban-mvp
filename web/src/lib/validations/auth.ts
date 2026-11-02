import { z } from 'zod';

/**
 * Validation schema cho Đăng ký tài khoản (BR-01)
 * - Email: đúng định dạng email
 * - Tên: 1–50 ký tự sau khi trim
 * - Mật khẩu: 8–72 ký tự, chứa ít nhất 1 chữ cái và 1 chữ số
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không đúng định dạng')
    .toLowerCase(),
  name: z
    .string()
    .trim()
    .min(1, 'Họ và tên không được để trống')
    .max(50, 'Họ và tên không được vượt quá 50 ký tự'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải từ 8 ký tự trở lên')
    .max(72, 'Mật khẩu không được vượt quá 72 ký tự')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số'),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * Validation schema cho Đăng nhập
 * - Email: đúng định dạng email
 * - Mật khẩu: không được để trống
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không đúng định dạng')
    .toLowerCase(),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
