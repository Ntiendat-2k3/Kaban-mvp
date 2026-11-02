import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { repositories } from '../repositories/index.js';
import { ENV } from '../config/env.js';

export class AuthService {
  async register(input: { email: string; name: string; password: string }) {
    const existing = await repositories.user.findByEmail(input.email);
    if (existing) {
      const error: any = new Error('Email đã được sử dụng');
      error.code = 'EMAIL_TAKEN';
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await repositories.user.create({
      email: input.email.toLowerCase(),
      name: input.name,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user.id, email: user.email }, ENV.JWT_SECRET, { expiresIn: '7d' });
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async login(input: { email: string; password: string }) {
    const user = await repositories.user.findByEmail(input.email);
    if (!user || !user.password) {
      const error: any = new Error('Email hoặc mật khẩu không chính xác');
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) {
      const error: any = new Error('Email hoặc mật khẩu không chính xác');
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, ENV.JWT_SECRET, { expiresIn: '7d' });
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async getMe(userId: string) {
    const user = await repositories.user.findById(userId);
    if (!user) {
      const error: any = new Error('Người dùng không tồn tại');
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }
    return { id: user.id, email: user.email, name: user.name };
  }
}

export const authService = new AuthService();

