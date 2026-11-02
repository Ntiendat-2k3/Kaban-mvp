import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email không đúng định dạng'),
    name: z.string().min(1, 'Tên không được để trống'),
    password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email không đúng định dạng'),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
  }),
});

