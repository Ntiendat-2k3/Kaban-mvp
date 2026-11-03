import { IListRepository, ListEntity, ArchivedListEntity } from '../interfaces/IListRepository.js';
import { List } from '../../models/index.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { computePosition, POSITION_STEP } from '../../utils/position.js';
import type { BoardBackground } from '../interfaces/IBoardRepository.js';

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
      wipLimit: list.wipLimit,
      color: list.color as BoardBackground | null,
    };
  }

  async updateList(listId: string, patch: { name?: string; wipLimit?: number | null; color?: BoardBackground | null }): Promise<ListEntity | null> {
    const list = await List.findByPk(listId);
    if (!list) return null;

    if (patch.name !== undefined) list.title = patch.name;
    if (patch.wipLimit !== undefined) list.wipLimit = patch.wipLimit;
    if (patch.color !== undefined) list.color = patch.color;
    await list.save();

    return {
      id: list.id,
      boardId: list.boardId,
      name: list.title,
      position: list.position,
      isArchived: list.isArchived,
      wipLimit: list.wipLimit,
      color: list.color as BoardBackground | null,
    };
  }

  async archiveList(listId: string): Promise<boolean> {
    const list = await List.findByPk(listId);
    if (!list) return false;

    list.isArchived = true;
    await list.save();
    return true;
  }

  async getArchivedLists(boardId: string): Promise<ArchivedListEntity[]> {
    const lists = await List.findAll({
      attributes: ['id', 'title'],
      where: { boardId, isArchived: true },
      order: [['updatedAt', 'DESC']],
    });
    return lists.map((list) => ({ id: list.id, name: list.title }));
  }

  /** Khôi phục danh sách ở cuối bảng để tránh trùng vị trí với các cột đang hiển thị. */
  async restoreList(listId: string): Promise<ListEntity | null> {
    return sequelize.transaction(async (transaction) => {
      const list = await List.findByPk(listId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!list || !list.isArchived) return null;
      const lastList = await List.findOne({
        where: { boardId: list.boardId, isArchived: false },
        order: [['position', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      await list.update({ isArchived: false, position: lastList ? lastList.position + POSITION_STEP : POSITION_STEP }, { transaction });
      return {
        id: list.id,
        boardId: list.boardId,
        name: list.title,
        position: list.position,
        isArchived: list.isArchived,
        wipLimit: list.wipLimit,
        color: list.color as BoardBackground | null,
      };
    });
  }

  async moveList(listId: string, toIndex: number): Promise<boolean> {
    return sequelize.transaction(async (transaction) => {
      const target = await List.findByPk(listId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!target) return false;
      const siblings = await List.findAll({
        where: { boardId: target.boardId, isArchived: false, id: { [Op.ne]: listId } },
        order: [['position', 'ASC']], transaction, lock: transaction.LOCK.UPDATE,
      });
      const index = Math.max(0, Math.min(toIndex, siblings.length));
      const { position, needsRebalance } = computePosition(siblings[index - 1]?.position, siblings[index]?.position);
      if (!needsRebalance) {
        await target.update({ position }, { transaction });
        return true;
      }
      siblings.splice(index, 0, target);
      for (const [i, sibling] of siblings.entries()) {
        await sibling.update({ position: (i + 1) * POSITION_STEP }, { transaction });
      }
      return true;
    });
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
      wipLimit: l.wipLimit,
      color: l.color as BoardBackground | null,
    }));
  }
}
