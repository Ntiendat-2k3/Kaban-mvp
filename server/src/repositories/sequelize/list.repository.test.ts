import { afterEach, describe, expect, it, vi } from 'vitest';
import { sequelize } from '../../config/database.js';
import { List } from '../../models/index.js';
import { SequelizeListRepository } from './list.repository.js';

afterEach(() => vi.restoreAllMocks());

describe('danh sách đã lưu trữ', () => {
  it('chỉ liệt kê danh sách đã lưu trữ của bảng', async () => {
    vi.spyOn(List, 'findAll').mockResolvedValue([{ id: 'list', title: 'Doing' }] as List[]);

    await expect(new SequelizeListRepository().getArchivedLists('board')).resolves.toEqual([
      { id: 'list', name: 'Doing' },
    ]);
    expect(List.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { boardId: 'board', isArchived: true } }));
  });

  it('khôi phục danh sách vào cuối bảng trong một giao dịch', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    vi.spyOn(sequelize, 'transaction').mockImplementation((async (callback: any) => callback(transaction)) as any);
    const list = { id: 'list', boardId: 'board', title: 'Doing', position: 100, isArchived: true, wipLimit: null, color: null, update: vi.fn() };
    list.update.mockImplementation(async (patch) => { Object.assign(list, patch); });
    vi.spyOn(List, 'findByPk').mockResolvedValue(list as unknown as List);
    vi.spyOn(List, 'findOne').mockResolvedValue({ position: 65535 } as List);

    const restored = await new SequelizeListRepository().restoreList('list');

    expect(list.update).toHaveBeenCalledWith({ isArchived: false, position: 131070 }, { transaction });
    expect(restored).toMatchObject({ id: 'list', position: 131070, isArchived: false });
  });
});
