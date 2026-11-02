import { IBaseRepository } from './IBaseRepository.js';

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserRepository extends IBaseRepository<UserEntity> {
  findByEmail(email: string): Promise<UserEntity | null>;
}

