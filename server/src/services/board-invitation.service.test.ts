import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sequelize } from '../config/database.js';
import { Board, BoardInvitation, BoardMember, User } from '../models/index.js';
import type { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import { BoardInvitationService } from './board-invitation.service.js';

vi.mock('./mail.service.js', () => ({ isMailConfigured: () => true, sendEmail: vi.fn() }));
afterEach(() => vi.restoreAllMocks());

function ownerRepo(): IBoardRepository {
  return {
    getUserRole: vi.fn().mockImplementation(async (_boardId: string, userId: string) =>
      userId === 'owner' ? 'owner' : null
    ),
  } as unknown as IBoardRepository;
}

describe('lời mời thành viên bảng', () => {
  it('gửi link cho email chưa có tài khoản và chỉ lưu bản băm token', async () => {
    vi.spyOn(Board, 'findByPk').mockResolvedValue({ title: 'Kế hoạch', isArchived: false } as Board);
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    const upsert = vi.spyOn(BoardInvitation, 'upsert').mockResolvedValue([{} as BoardInvitation, true]);
    const mailer = vi.fn().mockResolvedValue(undefined);

    const result = await new BoardInvitationService(ownerRepo(), mailer).invite('board', 'owner', '  NEW@Example.COM ');

    expect(result).toEqual({ email: 'new@example.com' });
    expect(mailer).toHaveBeenCalledOnce();
    expect(mailer.mock.calls[0][0]).toBe('new@example.com');
    const token = new URL(mailer.mock.calls[0][2].match(/https?:\/\/\S+/)![0]).searchParams.get('token');
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      boardId: 'board', email: 'new@example.com',
      tokenHash: createHash('sha256').update(token!).digest('hex'),
    }));
  });

  it('không giữ lời mời khi SMTP không gửi được', async () => {
    vi.spyOn(Board, 'findByPk').mockResolvedValue({ title: 'Kế hoạch', isArchived: false } as Board);
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(BoardInvitation, 'upsert').mockResolvedValue([{} as BoardInvitation, true]);
    const destroy = vi.spyOn(BoardInvitation, 'destroy').mockResolvedValue(1);
    const mailer = vi.fn().mockRejectedValue(new Error('SMTP down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(new BoardInvitationService(ownerRepo(), mailer).invite('board', 'owner', 'new@example.com'))
      .rejects.toMatchObject({ statusCode: 503 });
    expect(destroy).toHaveBeenCalledWith({ where: expect.objectContaining({ boardId: 'board', email: 'new@example.com' }) });

    mailer.mockRejectedValue({ code: 'EAUTH', responseCode: 525 });
    await expect(new BoardInvitationService(ownerRepo(), mailer).invite('board', 'owner', 'new@example.com'))
      .rejects.toMatchObject({ statusCode: 424, message: expect.stringContaining('Brevo đang chặn IP') });

    mailer.mockRejectedValue({ code: 'INVALID_SENDER' });
    await expect(new BoardInvitationService(ownerRepo(), mailer).invite('board', 'owner', 'new@example.com'))
      .rejects.toMatchObject({ statusCode: 424, message: expect.stringContaining('MAIL_FROM') });
  });

  it('chỉ cho tài khoản đúng email chấp nhận lời mời', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    vi.spyOn(sequelize, 'transaction').mockImplementation((async (callback: any) => callback(transaction)) as any);
    const destroy = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(BoardInvitation, 'findOne').mockResolvedValue({
      boardId: 'board', email: 'invited@example.com', expiresAt: new Date(Date.now() + 60_000), destroy,
    } as unknown as BoardInvitation);
    vi.spyOn(User, 'findByPk').mockResolvedValue({ email: 'other@example.com' } as User);
    const addMember = vi.spyOn(BoardMember, 'findOrCreate');

    await expect(new BoardInvitationService().accept('a'.repeat(43), 'other'))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(addMember).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });

  it('không cấp quyền từ link đã hết hạn', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    vi.spyOn(sequelize, 'transaction').mockImplementation((async (callback: any) => callback(transaction)) as any);
    vi.spyOn(BoardInvitation, 'findOne').mockResolvedValue({
      boardId: 'board', email: 'invited@example.com', expiresAt: new Date(Date.now() - 60_000),
    } as BoardInvitation);
    const findUser = vi.spyOn(User, 'findByPk');
    const addMember = vi.spyOn(BoardMember, 'findOrCreate');

    await expect(new BoardInvitationService().accept('a'.repeat(43), 'invited'))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(findUser).not.toHaveBeenCalled();
    expect(addMember).not.toHaveBeenCalled();
  });

  it('cấp quyền sau khi xác thực email và tiêu thụ token một lần', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    vi.spyOn(sequelize, 'transaction').mockImplementation((async (callback: any) => callback(transaction)) as any);
    const destroy = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(BoardInvitation, 'findOne').mockResolvedValue({
      boardId: 'board', email: 'invited@example.com', expiresAt: new Date(Date.now() + 60_000), destroy,
    } as unknown as BoardInvitation);
    vi.spyOn(User, 'findByPk').mockResolvedValue({ email: 'invited@example.com' } as User);
    vi.spyOn(Board, 'findByPk').mockResolvedValue({ ownerId: 'owner', isArchived: false } as Board);
    const addMember = vi.spyOn(BoardMember, 'findOrCreate').mockResolvedValue([{} as BoardMember, true]);

    await expect(new BoardInvitationService().accept('a'.repeat(43), 'invited'))
      .resolves.toEqual({ boardId: 'board' });
    expect(addMember).toHaveBeenCalledWith(expect.objectContaining({
      where: { boardId: 'board', userId: 'invited' }, transaction,
    }));
    expect(destroy).toHaveBeenCalledWith({ transaction });
  });
});
