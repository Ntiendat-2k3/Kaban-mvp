import { describe, expect, it, vi } from 'vitest';
import { DueReminderService } from './due-reminder.service.js';
import type {
  DueReminderCandidate,
  DueReminderRecipient,
  IDueReminderRepository,
} from '../repositories/interfaces/IDueReminderRepository.js';

const dueDate = new Date('2026-11-05T01:00:00.000Z');
const assigned: DueReminderCandidate = { cardId: 'card', userId: 'assigned', dueDate };
const removed: DueReminderCandidate = { cardId: 'card', userId: 'removed', dueDate };
const recipient: DueReminderRecipient = {
  ...assigned,
  boardId: 'board',
  email: 'assigned@example.com',
  name: 'Thành viên',
  cardTitle: 'Công việc',
  boardName: 'Bảng',
};

function createRepository() {
  return {
    claimDue: vi.fn().mockResolvedValue([assigned, removed]),
    getCurrentRecipient: vi.fn().mockImplementation(async (candidate: DueReminderCandidate) =>
      candidate.userId === assigned.userId ? recipient : null
    ),
    markSent: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
  };
}

describe('email nhắc hạn thẻ', () => {
  it('chỉ gửi cho người vẫn được gán vào thẻ tại thời điểm gửi', async () => {
    const repository = createRepository();
    const sendMail = vi.fn().mockResolvedValue(undefined);

    await new DueReminderService(repository as IDueReminderRepository, sendMail).runOnce();

    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail).toHaveBeenCalledWith(recipient);
    expect(repository.markSent).toHaveBeenCalledOnce();
    expect(repository.markSent).toHaveBeenCalledWith(assigned);
    expect(repository.release).toHaveBeenCalledOnce();
    expect(repository.release).toHaveBeenCalledWith(removed);
  });

  it('không đánh dấu đã gửi khi SMTP báo lỗi', async () => {
    const repository = createRepository();
    repository.claimDue.mockResolvedValue([assigned]);
    const sendMail = vi.fn().mockRejectedValue(new Error('SMTP unavailable'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await new DueReminderService(repository as IDueReminderRepository, sendMail).runOnce();

    expect(repository.markSent).not.toHaveBeenCalled();
    expect(repository.release).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});
