import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActivityService, logActivity } from './activity.service.js';
import { Activity } from '../models/index.js';
import type { IActivityRepository } from '../repositories/interfaces/IActivityRepository.js';
import type { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';

afterEach(() => vi.restoreAllMocks());

describe('nhật ký hoạt động', () => {
  it('không làm hỏng thao tác chính khi ghi nhật ký thất bại', async () => {
    vi.spyOn(Activity, 'create').mockRejectedValue(new Error('DB lỗi'));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(logActivity({ boardId: 'board', userId: 'user', type: 'card.moved' })).resolves.toBeUndefined();
    expect(errorLog).toHaveBeenCalledOnce();
  });

  it('từ chối người ngoài bảng trước khi truy vấn', async () => {
    const findByBoard = vi.fn();
    const service = new ActivityService(
      { findByBoard } as unknown as IActivityRepository,
      { getUserRole: vi.fn().mockResolvedValue(null) } as unknown as IBoardRepository
    );
    await expect(service.getBoardActivities('board', 'outsider', 30)).rejects.toMatchObject({ statusCode: 404 });
    expect(findByBoard).not.toHaveBeenCalled();
  });
});
