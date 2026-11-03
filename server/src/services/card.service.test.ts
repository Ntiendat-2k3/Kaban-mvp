import { afterEach, describe, expect, it, vi } from 'vitest';
import { CardService } from './card.service.js';
import { Card, List } from '../models/index.js';
import type { ICardRepository } from '../repositories/interfaces/ICardRepository.js';
import type { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import type { IAttachmentRepository } from '../repositories/interfaces/IAttachmentRepository.js';
import { sequelize } from '../config/database.js';
import { logActivity } from './activity.service.js';
import { CloudinaryService } from './cloudinary.service.js';

vi.mock('./activity.service.js', () => ({ logActivity: vi.fn().mockResolvedValue(undefined) }));

afterEach(() => vi.restoreAllMocks());

describe('giới hạn WIP', () => {
  const boardRepo = () => ({ getUserRole: vi.fn().mockResolvedValue('member') }) as unknown as IBoardRepository;

  it('chặn tạo thẻ khi cột đủ số thẻ', async () => {
    vi.spyOn(List, 'findByPk').mockResolvedValue({ id: 'list', boardId: 'board', title: 'Doing', wipLimit: 2 } as List);
    vi.spyOn(sequelize, 'transaction').mockImplementation((async (callback: any) => callback({})) as any);
    vi.spyOn(sequelize, 'query').mockResolvedValue([] as any);
    vi.spyOn(Card, 'count').mockResolvedValue(2);
    const createCard = vi.fn();
    const service = new CardService({ createCard } as unknown as ICardRepository, boardRepo());
    await expect(service.createCard('list', 'user', 'Thẻ mới')).rejects.toMatchObject({ statusCode: 409, code: 'WIP_LIMIT_EXCEEDED' });
    expect(createCard).not.toHaveBeenCalled();
  });

  it('cho đổi thứ tự trong cột đã đầy', async () => {
    vi.spyOn(Card, 'findByPk').mockResolvedValue({ id: 'card', listId: 'list', boardId: 'board' } as Card);
    vi.spyOn(List, 'findByPk').mockResolvedValue({ id: 'list', boardId: 'board', wipLimit: 1 } as List);
    const count = vi.spyOn(Card, 'count');
    const moveCard = vi.fn().mockResolvedValue(true);
    const service = new CardService({ moveCard } as unknown as ICardRepository, boardRepo());
    await service.moveCard('card', 'user', 'list', 0);
    expect(count).not.toHaveBeenCalled();
    expect(moveCard).toHaveBeenCalledOnce();
  });

  it('ghi đúng một lần tên cột nguồn và cột đích khi chuyển thẻ', async () => {
    vi.mocked(logActivity).mockClear();
    vi.spyOn(Card, 'findByPk').mockResolvedValue({ id: 'card', listId: 'source', boardId: 'board' } as Card);
    vi.spyOn(List, 'findByPk').mockImplementation(async (id) => ({
      id, boardId: 'board', title: id === 'source' ? 'Doing' : 'Review', wipLimit: null,
    }) as List);
    const moveCard = vi.fn().mockResolvedValue(true);
    const service = new CardService({ moveCard } as unknown as ICardRepository, boardRepo());
    await service.moveCard('card', 'user', 'target', 0);
    expect(logActivity).toHaveBeenCalledOnce();
    expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
      type: 'card.moved', data: { fromList: 'Doing', toList: 'Review' },
    }));
  });
});

describe('xóa thẻ', () => {
  it('chặn người không thuộc bảng trước khi xóa', async () => {
    vi.spyOn(Card, 'findByPk').mockResolvedValue({ id: 'card', boardId: 'board' } as Card);
    const deleteCard = vi.fn();
    const boardRepo = { getUserRole: vi.fn().mockResolvedValue(null) } as unknown as IBoardRepository;
    const service = new CardService({ deleteCard } as unknown as ICardRepository, boardRepo);

    await expect(service.deleteCard('card', 'outsider')).rejects.toMatchObject({ statusCode: 404 });
    expect(deleteCard).not.toHaveBeenCalled();
  });

  it('dọn tệp không còn dùng chung sau khi xóa và ghi nhật ký', async () => {
    vi.mocked(logActivity).mockClear();
    vi.spyOn(Card, 'findByPk').mockResolvedValue({ id: 'card', boardId: 'board', title: 'Việc A' } as Card);
    const deleteCard = vi.fn().mockResolvedValue([
      { publicId: 'solo', fileType: 'image' },
      { publicId: 'solo', fileType: 'image' },
      { publicId: 'shared', fileType: 'video' },
    ]);
    const countByPublicId = vi.fn().mockImplementation(async (id: string) => id === 'shared' ? 1 : 0);
    const deleteFile = vi.spyOn(CloudinaryService, 'deleteFile').mockResolvedValue(undefined);
    const boardRepo = { getUserRole: vi.fn().mockResolvedValue('member') } as unknown as IBoardRepository;
    const attachmentRepo = { countByPublicId } as unknown as IAttachmentRepository;
    const service = new CardService({ deleteCard } as unknown as ICardRepository, boardRepo, undefined, attachmentRepo);

    await service.deleteCard('card', 'member');

    expect(deleteCard).toHaveBeenCalledWith('card');
    expect(countByPublicId).toHaveBeenCalledTimes(2);
    expect(deleteFile).toHaveBeenCalledTimes(1);
    expect(deleteFile).toHaveBeenCalledWith('solo', 'image');
    expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
      boardId: 'board', userId: 'member', type: 'card.deleted', data: { title: 'Việc A' },
    }));
  });
});

describe('thẻ đã lưu trữ', () => {
  it('chỉ liệt kê cho thành viên của bảng', async () => {
    const getArchivedCards = vi.fn().mockResolvedValue([]);
    const boardRepo = { getUserRole: vi.fn().mockResolvedValue(null) } as unknown as IBoardRepository;
    const service = new CardService({ getArchivedCards } as unknown as ICardRepository, boardRepo);

    await expect(service.getArchivedCards('board', 'outsider')).rejects.toMatchObject({ statusCode: 404 });
    expect(getArchivedCards).not.toHaveBeenCalled();
  });

  it('trả danh sách thẻ đã lưu trữ cho thành viên', async () => {
    const archived = [{ id: 'card', title: 'Việc A', listId: 'list', listName: 'Doing', listArchived: false }];
    const getArchivedCards = vi.fn().mockResolvedValue(archived);
    const boardRepo = { getUserRole: vi.fn().mockResolvedValue('member') } as unknown as IBoardRepository;
    const service = new CardService({ getArchivedCards } as unknown as ICardRepository, boardRepo);

    await expect(service.getArchivedCards('board', 'member')).resolves.toEqual(archived);
    expect(getArchivedCards).toHaveBeenCalledWith('board');
  });
});
