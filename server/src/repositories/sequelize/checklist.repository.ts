import {
  IChecklistRepository,
  ChecklistEntity,
  ChecklistItemEntity,
} from '../interfaces/IChecklistRepository.js';
import { Checklist, ChecklistItem } from '../../models/index.js';
import { sequelize } from '../../config/database.js';

export class SequelizeChecklistRepository implements IChecklistRepository {
  async createChecklist(cardId: string, title: string): Promise<ChecklistEntity> {
    const lastChecklist = await Checklist.findOne({
      where: { cardId },
      order: [['position', 'DESC']],
    });

    const nextPosition = lastChecklist ? lastChecklist.position + 65535 : 65535;

    const checklist = await Checklist.create({
      cardId,
      title,
      position: nextPosition,
    });

    return {
      id: checklist.id,
      cardId: checklist.cardId,
      title: checklist.title,
      items: [],
    };
  }

  async deleteChecklist(checklistId: string): Promise<void> {
    const checklist = await Checklist.findByPk(checklistId);
    if (!checklist) {
      const error: any = new Error('Không tìm thấy checklist');
      error.statusCode = 404;
      throw error;
    }

    await sequelize.transaction(async (t) => {
      await ChecklistItem.destroy({
        where: { checklistId },
        transaction: t,
      });

      await checklist.destroy({ transaction: t });
    });
  }

  async createChecklistItem(checklistId: string, text: string): Promise<ChecklistItemEntity> {
    const checklist = await Checklist.findByPk(checklistId);
    if (!checklist) {
      const error: any = new Error('Không tìm thấy checklist');
      error.statusCode = 404;
      throw error;
    }

    const lastItem = await ChecklistItem.findOne({
      where: { checklistId },
      order: [['position', 'DESC']],
    });

    const nextPosition = lastItem ? lastItem.position + 65535 : 65535;

    const item = await ChecklistItem.create({
      checklistId,
      title: text,
      isCompleted: false,
      position: nextPosition,
    });

    return {
      id: item.id,
      checklistId: item.checklistId,
      text: item.title,
      done: item.isCompleted,
    };
  }

  async updateChecklistItem(
    itemId: string,
    patch: { text?: string; done?: boolean }
  ): Promise<ChecklistItemEntity> {
    const item = await ChecklistItem.findByPk(itemId);
    if (!item) {
      const error: any = new Error('Không tìm thấy mục checklist');
      error.statusCode = 404;
      throw error;
    }

    if (patch.text !== undefined) {
      item.title = patch.text;
    }
    if (patch.done !== undefined) {
      item.isCompleted = patch.done;
    }

    await item.save();

    return {
      id: item.id,
      checklistId: item.checklistId,
      text: item.title,
      done: item.isCompleted,
    };
  }

  async deleteChecklistItem(itemId: string): Promise<void> {
    const item = await ChecklistItem.findByPk(itemId);
    if (!item) {
      const error: any = new Error('Không tìm thấy mục checklist');
      error.statusCode = 404;
      throw error;
    }

    await item.destroy();
  }
}
