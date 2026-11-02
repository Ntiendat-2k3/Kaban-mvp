import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { ResponseView } from '../views/response.view.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      return ResponseView.created(res, result);
    } catch (error: any) {
      return ResponseView.error(
        res,
        error.code || 'REGISTER_ERROR',
        error.message || 'Lỗi khi đăng ký',
        error.statusCode || 400
      );
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);
      return ResponseView.success(res, result);
    } catch (error: any) {
      return ResponseView.error(
        res,
        error.code || 'LOGIN_ERROR',
        error.message || 'Lỗi khi đăng nhập',
        error.statusCode || 401
      );
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return ResponseView.unauthorized(res);
      }
      const user = await authService.getMe(req.user.id);
      return ResponseView.success(res, user);
    } catch (error: any) {
      return ResponseView.error(
        res,
        error.code || 'GET_ME_ERROR',
        error.message || 'Lỗi lấy thông tin cá nhân',
        error.statusCode || 400
      );
    }
  }
}

export const authController = new AuthController();

