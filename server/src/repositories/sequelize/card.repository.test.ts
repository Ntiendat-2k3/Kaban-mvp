import { afterEach, describe, expect, it, vi } from 'vitest';
import { sequelize } from '../../config/database.js';
import { Activity, Attachment, Card, CardDueReminder, CardLabel, CardMember, Checklist, ChecklistItem, Comment, List } from '../../models/index.js';
import { SequelizeCardRepository } from './card.repository.js';

afterEach(() => vi.restoreAllMocks());

describe('xóa thẻ và dữ liệu phụ thuộc', () => {
  it('xóa nội dung trong cùng giao dịch trước khi xóa thẻ', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    vi.spyOn(sequelize, 'transaction').mockImplementation((async (callback: any) => callback(transaction)) as any);
    const destroyCard = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(Card, 'findByPk').mockResolvedValue({ destroy: destroyCard } as unknown as Card);
    vi.spyOn(Attachment, 'findAll').mockResolvedValue([
      { publicId: 'file', fileType: 'image' },
      { publicId: null, fileType: 'image' },
    ] as Attachment[]);
    vi.spyOn(Checklist, 'findAll').mockResolvedValue([{ id: 'checklist' }] as Checklist[]);
    const destroyItems = vi.spyOn(ChecklistItem, 'destroy').mockResolvedValue(1);
    const destroyChecklists = vi.spyOn(Checklist, 'destroy').mockResolvedValue(1);
    const destroyComments = vi.spyOn(Comment, 'destroy').mockResolvedValue(1);
    const destroyLabels = vi.spyOn(CardLabel, 'destroy').mockResolvedValue(1);
    const destroyMembers = vi.spyOn(CardMember, 'destroy').mockResolvedValue(1);
    const destroyReminders = vi.spyOn(CardDueReminder, 'destroy').mockResolvedValue(1);
    const destroyAttachments = vi.spyOn(Attachment, 'destroy').mockResolvedValue(2);
    const clearActivityCard = vi.spyOn(Activity, 'update').mockResolvedValue([1]);

    const files = await new SequelizeCardRepository().deleteCard('card');

    expect(files).toEqual([{ publicId: 'file', fileType: 'image' }]);
    expect(destroyItems).toHaveBeenCalledWith(expect.objectContaining({ transaction }));
    for (const destroy of [destroyChecklists, destroyComments, destroyLabels, destroyMembers, destroyReminders, destroyAttachments]) {
      expect(destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { cardId: 'card' }, transaction }));
      expect(destroy.mock.invocationCallOrder[0]).toBeLessThan(destroyCard.mock.invocationCallOrder[0]);
    }
    expect(clearActivityCard).toHaveBeenCalledWith({ cardId: null }, { where: { cardId: 'card' }, transaction });
    expect(destroyCard).toHaveBeenCalledWith({ transaction });
  });
});

describe('liệt kê thẻ đã lưu trữ', () => {
  it('gắn tên và trạng thái danh sách gốc cho từng thẻ', async () => {
    vi.spyOn(Card, 'findAll').mockResolvedValue([
      { id: 'a', title: 'Việc A', listId: 'active' },
      { id: 'b', title: 'Việc B', listId: 'archived' },
    ] as Card[]);
    vi.spyOn(List, 'findAll').mockResolvedValue([
      { id: 'active', title: 'Đang làm', isArchived: false },
      { id: 'archived', title: 'Đã đóng', isArchived: true },
    ] as List[]);

    const cards = await new SequelizeCardRepository().getArchivedCards('board');

    expect(Card.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { boardId: 'board', isArchived: true } }));
    expect(cards).toEqual([
      { id: 'a', title: 'Việc A', listId: 'active', listName: 'Đang làm', listArchived: false },
      { id: 'b', title: 'Việc B', listId: 'archived', listName: 'Đã đóng', listArchived: true },
    ]);
  });
});
