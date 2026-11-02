import { Op } from 'sequelize';
import { SequelizeBaseRepository } from './base.repository.js';
import {
  IBoardRepository,
  BoardEntity,
  BoardMemberEntity,
  BoardBackground,
} from '../interfaces/IBoardRepository.js';
import { Board, BoardMember, BoardStar, User, Label } from '../../models/index.js';

export class SequelizeBoardRepository
  extends SequelizeBaseRepository<any, Board>
  implements IBoardRepository
{
  constructor() {
    super(Board);
  }

  async findUserBoards(userId: string, includeClosed = false): Promise<BoardEntity[]> {
    // 1. Tìm các bảng mà user là thành viên
    const memberships = await BoardMember.findAll({
      where: { userId },
      attributes: ['boardId'],
    });
    const memberBoardIds = memberships.map((m) => m.boardId);

    // 2. Tìm danh sách bảng user đã gắn sao
    const stars = await BoardStar.findAll({
      where: { userId },
      attributes: ['boardId'],
    });
    const starredSet = new Set(stars.map((s) => s.boardId));

    // 3. Query các bảng
    const boards = await this.model.findAll({
      where: {
        isArchived: includeClosed,
        [Op.or]: [{ ownerId: userId }, { id: { [Op.in]: memberBoardIds } }],
      },
      order: [['updatedAt', 'DESC']],
    });

    return boards.map((b) => ({
      id: b.id,
      name: b.name || b.title,
      background: (b.background as BoardBackground) || 'blue',
      archived: b.isArchived,
      isStarred: starredSet.has(b.id),
      role: b.ownerId === userId ? 'owner' : 'member',
      ownerId: b.ownerId,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));
  }

  async getBoardDetail(boardId: string, userId: string): Promise<BoardEntity | null> {
    const board = await this.model.findByPk(boardId);
    if (!board) return null;

    // Kiểm tra membership: phải là owner hoặc member
    const role = await this.getUserRole(boardId, userId);
    if (!role) return null;

    // Kiểm tra trạng thái star của user
    const star = await BoardStar.findOne({
      where: { boardId, userId },
    });

    return {
      id: board.id,
      name: board.name || board.title,
      background: (board.background as BoardBackground) || 'blue',
      archived: board.isArchived,
      isStarred: !!star,
      role,
      ownerId: board.ownerId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }

  async createBoard(data: {
    name: string;
    background?: BoardBackground;
    ownerId: string;
  }): Promise<BoardEntity> {
    const board = await this.model.create({
      title: data.name,
      background: data.background || 'blue',
      ownerId: data.ownerId,
      isArchived: false,
    });

    // Thêm owner vào board_members với vai trò admin
    await BoardMember.create({
      boardId: board.id,
      userId: data.ownerId,
      role: 'admin',
    });

    return {
      id: board.id,
      name: board.name || board.title,
      background: (board.background as BoardBackground) || 'blue',
      archived: false,
      isStarred: false,
      role: 'owner',
      ownerId: board.ownerId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }

  async updateBoard(
    boardId: string,
    data: { name?: string; background?: BoardBackground }
  ): Promise<BoardEntity | null> {
    const board = await this.model.findByPk(boardId);
    if (!board) return null;

    if (data.name !== undefined) {
      board.title = data.name;
    }
    if (data.background !== undefined) {
      board.background = data.background;
    }
    await board.save();

    return {
      id: board.id,
      name: board.name || board.title,
      background: (board.background as BoardBackground) || 'blue',
      archived: board.isArchived,
      isStarred: false,
      role: 'member',
      ownerId: board.ownerId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }

  async setStar(boardId: string, userId: string, isStarred: boolean): Promise<void> {
    if (isStarred) {
      await BoardStar.findOrCreate({
        where: { boardId, userId },
      });
    } else {
      await BoardStar.destroy({
        where: { boardId, userId },
      });
    }
  }

  async setArchived(boardId: string, archived: boolean): Promise<BoardEntity | null> {
    const board = await this.model.findByPk(boardId);
    if (!board) return null;

    board.isArchived = archived;
    await board.save();

    return {
      id: board.id,
      name: board.name || board.title,
      background: (board.background as BoardBackground) || 'blue',
      archived: board.isArchived,
      isStarred: false,
      role: 'owner',
      ownerId: board.ownerId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }

  async getMembers(boardId: string): Promise<BoardMemberEntity[]> {
    const board = await this.model.findByPk(boardId);
    if (!board) return [];

    const members = await BoardMember.findAll({
      where: { boardId },
    });

    const userIds = members.map((m) => m.userId);
    // Luôn bao gồm cả ownerId nếu chưa có
    if (!userIds.includes(board.ownerId)) {
      userIds.push(board.ownerId);
    }

    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const result: BoardMemberEntity[] = [];

    // Thêm Owner trước
    const ownerUser = userMap.get(board.ownerId);
    if (ownerUser) {
      result.push({
        userId: ownerUser.id,
        name: ownerUser.name,
        email: ownerUser.email,
        role: 'owner',
      });
    }

    // Thêm các Member khác
    for (const m of members) {
      if (m.userId === board.ownerId) continue;
      const u = userMap.get(m.userId);
      if (u) {
        result.push({
          userId: u.id,
          name: u.name,
          email: u.email,
          role: 'member',
        });
      }
    }

    return result;
  }

  async addMember(
    boardId: string,
    userId: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<void> {
    await BoardMember.create({ boardId, userId, role });
  }

  async removeMember(boardId: string, userId: string): Promise<boolean> {
    const deletedCount = await BoardMember.destroy({
      where: { boardId, userId },
    });
    return deletedCount > 0;
  }

  async getUserRole(boardId: string, userId: string): Promise<'owner' | 'member' | null> {
    const board = await this.model.findByPk(boardId);
    if (!board) return null;
    if (board.ownerId === userId) return 'owner';

    const member = await BoardMember.findOne({ where: { boardId, userId } });
    if (member) return 'member';

    return null;
  }
}
