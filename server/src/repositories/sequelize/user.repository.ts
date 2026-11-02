import { SequelizeBaseRepository } from './base.repository.js';
import { IUserRepository, UserEntity } from '../interfaces/IUserRepository.js';
import { User } from '../../models/index.js';

export class SequelizeUserRepository
  extends SequelizeBaseRepository<UserEntity, User>
  implements IUserRepository
{
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await this.model.findOne({
      where: { email: email.toLowerCase() },
    });
    return record ? (record.toJSON() as UserEntity) : null;
  }
}

