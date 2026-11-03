import { Op } from 'sequelize';
import { Activity, User } from '../../models/index.js';
import type { ActivityEntity, ActivityInput, IActivityRepository } from '../interfaces/IActivityRepository.js';

export class SequelizeActivityRepository implements IActivityRepository {
  async create(input: ActivityInput): Promise<void> {
    await Activity.create({ ...input, cardId: input.cardId ?? null, data: input.data ?? {} });
  }

  async findByBoard(boardId: string, limit: number, before?: Date): Promise<ActivityEntity[]> {
    const rows = await Activity.findAll({
      where: { boardId, ...(before ? { createdAt: { [Op.lt]: before } } : {}) },
      include: [{ model: User, as: 'actor', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit,
    });
    return rows.map((row) => {
      const actor = row.get('actor') as User;
      return {
        id: row.id, boardId: row.boardId, cardId: row.cardId, userId: row.userId,
        type: row.type, data: row.data, createdAt: row.createdAt,
        actor: { id: actor.id, name: actor.name },
      };
    });
  }
}
