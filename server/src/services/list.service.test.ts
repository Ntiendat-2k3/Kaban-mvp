import { afterEach, describe, expect, it, vi } from 'vitest';
import { List } from '../models/index.js';
import type { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import type { IListRepository } from '../repositories/interfaces/IListRepository.js';
import { emitBoardChanged } from '../realtime/socket.js';
import { ListService } from './list.service.js';

vi.mock('../realtime/socket.js', () => ({ emitBoardChanged: vi.fn() }));
afterEach(() => vi.restoreAllMocks());

describe('khôi phục danh sách', () => {
  it('không liệt kê kho lưu trữ cho người ngoài bảng', async () => {
    const getArchivedLists = vi.fn();
    const boardRepo = { getUserRole: vi.fn().mockResolvedValue(null) } as unknown as IBoardRepository;
    const service = new ListService({ getArchivedLists } as unknown as IListRepository, boardRepo);

    await expect(service.getArchivedLists('board', 'outsider')).rejects.toMatchObject({ statusCode: 404 });
    expect(getArchivedLists).not.toHaveBeenCalled();
  });

  it('khôi phục danh sách của thành viên và thông báo bảng', async () => {
    vi.mocked(emitBoardChanged).mockClear();
    vi.spyOn(List, 'findByPk').mockResolvedValue({ id: 'list', boardId: 'board', isArchived: true } as List);
    const restored = { id: 'list', boardId: 'board', name: 'Doing', position: 65535, isArchived: false };
    const restoreList = vi.fn().mockResolvedValue(restored);
    const boardRepo = { getUserRole: vi.fn().mockResolvedValue('member') } as unknown as IBoardRepository;
    const service = new ListService({ restoreList } as unknown as IListRepository, boardRepo);

    await expect(service.restoreList('list', 'member')).resolves.toEqual(restored);
    expect(restoreList).toHaveBeenCalledWith('list');
    expect(emitBoardChanged).toHaveBeenCalledWith('board', { type: 'list.restored', actorId: 'member' });
  });
});
