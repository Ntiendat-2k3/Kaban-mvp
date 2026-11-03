import { createHash, randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { ENV } from '../config/env.js';
import { Board, BoardInvitation, BoardMember, User } from '../models/index.js';
import type { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import { repositories } from '../repositories/index.js';
import { emitBoardChanged } from '../realtime/socket.js';
import { isMailConfigured, sendEmail } from './mail.service.js';

const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function invitationError(message: string, statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Lời mời được gửi tới cả email chưa đăng ký. Token chỉ tồn tại trong thư, DB giữ bản băm;
 * quyền bảng chỉ được cấp khi người nhận đăng nhập bằng đúng email và chấp nhận lời mời.
 */
export class BoardInvitationService {
  constructor(
    private readonly boardRepo: IBoardRepository = repositories.board,
    private readonly mailer: typeof sendEmail = sendEmail
  ) {}

  async invite(boardId: string, callerUserId: string, rawEmail: string): Promise<{ email: string }> {
    const callerRole = await this.boardRepo.getUserRole(boardId, callerUserId);
    if (callerRole !== 'owner') {
      throw invitationError(callerRole ? 'Chỉ chủ sở hữu mới có quyền mời thành viên' : 'Không tìm thấy bảng', callerRole ? 403 : 404);
    }
    const board = await Board.findByPk(boardId);
    if (!board || board.isArchived) throw invitationError('Bảng không còn hoạt động', 409);

    const email = rawEmail.trim().toLowerCase();
    const existingUser = await User.findOne({ where: { email }, attributes: ['id'] });
    if (existingUser && await this.boardRepo.getUserRole(boardId, existingUser.id)) {
      throw invitationError('Người dùng đã là thành viên bảng', 409);
    }
    if (!isMailConfigured()) {
      console.warn('Chưa cấu hình SMTP để gửi lời mời thành viên.');
      throw invitationError('Chưa cấu hình SMTP để gửi lời mời', 503);
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);
    const url = new URL('/invite', ENV.APP_URL);
    url.searchParams.set('token', token);
    await BoardInvitation.upsert({ boardId, email, tokenHash, expiresAt });
    try {
      await this.mailer(
        email,
        `Lời mời tham gia bảng ${board.title}`,
        `Bạn được mời tham gia bảng "${board.title}" trên Kaban Flow.\n\nMở link để đăng nhập hoặc đăng ký rồi tham gia bảng: ${url.toString()}\n\nLời mời có hiệu lực trong 7 ngày. Nếu bạn không mong đợi lời mời này, có thể bỏ qua email.`
      );
    } catch (error) {
      const smtpError = error as { code?: string; responseCode?: number };
      console.error('Không gửi được email mời:', smtpError.code || 'UNKNOWN', smtpError.responseCode || '');
      await BoardInvitation.destroy({ where: { boardId, email, tokenHash } });
      if (smtpError.responseCode === 525) {
        throw invitationError('Brevo đang chặn IP gửi thư. Hãy cấp quyền IP máy chủ trong Settings → Security → Authorized IPs.', 424);
      }
      if (smtpError.responseCode === 535) {
        throw invitationError('Brevo từ chối SMTP login hoặc SMTP key. Hãy kiểm tra lại thông tin trong SMTP & API.', 424);
      }
      if (smtpError.code === 'INVALID_SENDER') {
        throw invitationError('MAIL_FROM đang dùng địa chỉ SMTP kỹ thuật của Brevo. Hãy chọn email người gửi đã xác thực.', 424);
      }
      throw invitationError('Không gửi được email mời. Vui lòng kiểm tra cấu hình SMTP và thử lại.', 503);
    }
    return { email };
  }

  async getInvitation(token: string): Promise<{ boardName: string; email: string; expiresAt: Date }> {
    const invitation = await BoardInvitation.findOne({
      where: { tokenHash: hashToken(token), expiresAt: { [Op.gt]: new Date() } },
    });
    if (!invitation) throw invitationError('Lời mời không tồn tại hoặc đã hết hạn', 404);
    const board = await Board.findByPk(invitation.boardId);
    if (!board || board.isArchived) throw invitationError('Bảng không còn hoạt động', 410);
    return { boardName: board.title, email: invitation.email, expiresAt: invitation.expiresAt };
  }

  async accept(token: string, userId: string): Promise<{ boardId: string }> {
    const tokenHash = hashToken(token);
    const boardId = await sequelize.transaction(async (transaction) => {
      const invitation = await BoardInvitation.findOne({
        where: { tokenHash }, transaction, lock: transaction.LOCK.UPDATE,
      });
      if (!invitation || invitation.expiresAt <= new Date()) {
        throw invitationError('Lời mời không tồn tại hoặc đã hết hạn', 404);
      }
      const user = await User.findByPk(userId, { transaction });
      if (!user || user.email.toLowerCase() !== invitation.email) {
        throw invitationError('Hãy đăng nhập bằng đúng email được mời', 403);
      }
      const board = await Board.findByPk(invitation.boardId, { transaction });
      if (!board || board.isArchived) throw invitationError('Bảng không còn hoạt động', 410);

      if (board.ownerId !== userId) {
        await BoardMember.findOrCreate({
          where: { boardId: invitation.boardId, userId },
          defaults: { role: 'member' },
          transaction,
        });
      }
      await invitation.destroy({ transaction });
      return invitation.boardId;
    });
    emitBoardChanged(boardId, { type: 'board.updated', actorId: userId });
    return { boardId };
  }
}

export const boardInvitationService = new BoardInvitationService();
