import type { Request, Response } from 'express';
import { boardInvitationService } from '../services/board-invitation.service.js';
import { ResponseView } from '../views/response.view.js';

export class BoardInvitationController {
  /** Hiển thị lời mời trước khi người nhận đăng nhập hoặc đăng ký. */
  static async get(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await boardInvitationService.getInvitation(req.params.token));
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Không tải được lời mời', error.statusCode || 400);
    }
  }

  /** Chỉ tài khoản có đúng email được mời mới có thể nhận quyền bảng. */
  static async accept(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await boardInvitationService.accept(req.params.token, (req as any).user.id));
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Không thể tham gia bảng', error.statusCode || 400);
    }
  }
}
