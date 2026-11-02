import { IListRepository, ListEntity } from '../interfaces/IListRepository.js';
import { List } from '../../models/index.js';

export class SequelizeListRepository implements IListRepository {
  async createList(boardId: string, name: string): Promise<ListEntity> {
    // Tìm position lớn nhất hiện tại của board để đặt list mới ở cuối
    const lastList = await List.findOne({
      where: { boardId, isArchived: false },
      order: [['position', 'DESC']],
    });

    const nextPosition = lastList ? lastList.position + 65535 : 65535;

    const list = await List.create({
      boardId,
      title: name,
      position: nextPosition,
      isArchived: false,
    });

    return {
      id: list.id,
      boardId: list.boardId,
      name: list.title,
      position: list.position,
      isArchived: list.isArchived,
    };
  }

  async updateList(listId: string, name: string): Promise<ListEntity | null> {
    const list = await List.findByPk(listId);
    if (!list) return null;

    list.title = name;
    await list.save();

    return {
      id: list.id,
      boardId: list.boardId,
      name: list.title,
      position: list.position,
      isArchived: list.isArchived,
    };
  }

  async archiveList(listId: string): Promise<boolean> {
    const list = await List.findByPk(listId);
    if (!list) return false;

    list.isArchived = true;
    await list.save();
    return true;
  }

  async moveList(listId: string, toIndex: number): Promise<boolean> {
    const target = await List.findByPk(listId);
    if (!target) return false;

    // Lấy tất cả list đang hoạt động của bảng theo thứ tự position
    const lists = await List.findAll({
      where: { boardId: target.boardId, isArchived: false },
      order: [['position', 'ASC']],
    });

    if (lists.length === 0) return false;

    // Kẹp toIndex trong khoảng [0, lists.length - 1] theo OpenAPI spec
    const clampedIndex = Math.max(0, Math.min(toIndex, lists.length - 1));

    // Loại bỏ list hiện tại và chèn vào clampedIndex
    const remaining = lists.filter((l) => l.id !== listId);
    remaining.splice(clampedIndex, 0, target);

    // Cập nhật lại position cho tất cả các list
    await Promise.all(
      remaining.map((l, idx) => {
        l.position = (idx + 1) * 65535;
        return l.save();
      })
    );

    return true;
  }

  async getBoardLists(boardId: string): Promise<ListEntity[]> {
    const lists = await List.findAll({
      where: { boardId, isArchived: false },
      order: [['position', 'ASC']],
    });

    return lists.map((l) => ({
      id: l.id,
      boardId: l.boardId,
      name: l.title,
      position: l.position,
      isArchived: l.isArchived,
    }));
  }
}
