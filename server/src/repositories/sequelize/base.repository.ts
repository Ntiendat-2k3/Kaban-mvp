import { Model, ModelStatic } from 'sequelize';
import { IBaseRepository } from '../interfaces/IBaseRepository.js';

export abstract class SequelizeBaseRepository<T extends { id: string }, M extends Model>
  implements IBaseRepository<T>
{
  constructor(protected model: ModelStatic<M>) {}

  async findById(id: string): Promise<T | null> {
    const record = await this.model.findByPk(id);
    return record ? (record.toJSON() as T) : null;
  }

  async findAll(filter: Record<string, unknown> = {}): Promise<T[]> {
    const records = await this.model.findAll({ where: filter as any });
    return records.map((r) => r.toJSON() as T);
  }

  async create(data: Partial<T>): Promise<T> {
    const record = await this.model.create(data as any);
    return record.toJSON() as T;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const record = await this.model.findByPk(id);
    if (!record) return null;
    await record.update(data as any);
    return record.toJSON() as T;
  }

  async delete(id: string): Promise<boolean> {
    const count = await this.model.destroy({ where: { id } as any });
    return count > 0;
  }
}

