/**
 * REPOSITORY CONTAINER / FACTORY
 * =========================================================================
 * Đây là lớp trừu tượng hóa toàn bộ việc truy xuất dữ liệu (Data Access Layer).
 * Nếu sau này bạn muốn đổi sang MongoDB, Prisma, SQLite, hay Raw SQL:
 * BẠN CHỈ CẦN THAY ĐỔI CÁC IMPLEMENTATION TRONG THƯ MỤC NÀY.
 * Toàn bộ Services, Controllers và Views phía trên sẽ giữ nguyên 100%!
 * =========================================================================
 */

import { IUserRepository } from './interfaces/IUserRepository.js';
import { IBoardRepository } from './interfaces/IBoardRepository.js';
import { IListRepository } from './interfaces/IListRepository.js';
import { ICardRepository } from './interfaces/ICardRepository.js';

import { SequelizeUserRepository } from './sequelize/user.repository.js';
import { SequelizeBoardRepository } from './sequelize/board.repository.js';
import { SequelizeListRepository } from './sequelize/list.repository.js';
import { SequelizeCardRepository } from './sequelize/card.repository.js';

export class RepositoryContainer {
  public static user: IUserRepository = new SequelizeUserRepository();
  public static board: IBoardRepository = new SequelizeBoardRepository();
  public static list: IListRepository = new SequelizeListRepository();
  public static card: ICardRepository = new SequelizeCardRepository();
}

export const repositories = RepositoryContainer;
export default repositories;

