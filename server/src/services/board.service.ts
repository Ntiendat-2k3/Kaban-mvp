import {
  IBoardRepository,
  BoardEntity,
  BoardMemberEntity,
  BoardBackground,
} from '../repositories/interfaces/IBoardRepository.js';
import { IUserRepository } from '../repositories/interfaces/IUserRepository.js';
import { Label } from '../models/index.js';
import { emitBoardChanged, removeBoardMemberSocket } from '../realtime/socket.js';

export class BoardService {
  constructor(
    private boardRepo: IBoardRepository,
    private userRepo?: IUserRepository
  ) {}

  /**
   * Lấy danh sách bảng mà người dùng có quyền truy cập (API-01, BR-01)
   */
  async getUserBoards(userId: string, includeClosed = false): Promise<BoardEntity[]> {
    return this.boardRepo.findUserBoards(userId, includeClosed);
  }

  /**
   * Tạo bảng mới, phân quyền owner và tự động seed 6 nhãn màu mặc định (API-02, BR-03)
   */
  async createBoard(
    userId: string,
    data: { name: string; background?: BoardBackground }
  ): Promise<BoardEntity> {
    const board = await this.boardRepo.createBoard({
      name: data.name,
      background: data.background || 'blue',
      ownerId: userId,
    });

    // Seed 6 nhãn màu mặc định theo SRS §2
    const defaultLabels: Array<'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue'> = [
      'green',
      'yellow',
      'orange',
      'red',
      'purple',
      'blue',
    ];
    await Promise.all(
      defaultLabels.map((color) =>
        Label.create({
          boardId: board.id,
          name: '',
          color,
        })
      )
    );

    return board;
  }

  /**
   * Lấy chi tiết bảng; nếu không tìm thấy hoặc người dùng không thuộc bảng trả về null / 404 (API-03, BR-09)
   */
  async getBoardDetail(boardId: string, userId: string): Promise<BoardEntity> {
    const board = await this.boardRepo.getBoardDetail(boardId, userId);
    if (!board) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }
    return board;
  }

  /**
   * Đổi tên hoặc màu nền bảng; cho phép cả owner và member thực hiện (API-04, BR-04)
   */
  async updateBoard(
    boardId: string,
    userId: string,
    data: { name?: string; background?: BoardBackground }
  ): Promise<BoardEntity> {
    const role = await this.boardRepo.getUserRole(boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }

    const updated = await this.boardRepo.updateBoard(boardId, data);
    if (!updated) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }

    // Gán role chính xác của caller
    updated.role = role;
    emitBoardChanged(boardId, { type: 'board.updated', actorId: userId });
    return updated;
  }

  /**
   * Gắn hoặc bỏ gắn sao bảng (API-07, API-08, BR-05)
   */
  async toggleStar(boardId: string, userId: string, isStarred: boolean): Promise<void> {
    const role = await this.boardRepo.getUserRole(boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }
    await this.boardRepo.setStar(boardId, userId, isStarred);
  }

  /**
   * Đóng bảng (archive); chỉ cho phép owner thực hiện (API-05, BR-06)
   */
  async archiveBoard(boardId: string, userId: string): Promise<BoardEntity> {
    const role = await this.boardRepo.getUserRole(boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }
    if (role !== 'owner') {
      const error: any = new Error('Chỉ chủ sở hữu (Owner) mới có quyền đóng bảng');
      error.statusCode = 403;
      throw error;
    }

    const updated = await this.boardRepo.setArchived(boardId, true);
    if (!updated) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }
    updated.role = 'owner';
    return updated;
  }

  /**
   * Khôi phục bảng đã đóng (restore); chỉ cho phép owner thực hiện (API-06, BR-06)
   */
  async restoreBoard(boardId: string, userId: string): Promise<BoardEntity> {
    const role = await this.boardRepo.getUserRole(boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }
    if (role !== 'owner') {
      const error: any = new Error('Chỉ chủ sở hữu (Owner) mới có quyền mở lại bảng');
      error.statusCode = 403;
      throw error;
    }

    const updated = await this.boardRepo.setArchived(boardId, false);
    if (!updated) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }
    updated.role = 'owner';
    return updated;
  }

  /**
   * Lấy danh sách thành viên của bảng (API-09, BR-07)
   */
  async getMembers(boardId: string, userId: string): Promise<BoardMemberEntity[]> {
    const role = await this.boardRepo.getUserRole(boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }
    return this.boardRepo.getMembers(boardId);
  }

  /**
   * Xoá thành viên khỏi bảng hoặc tự rời bảng (API-11, BR-08)
   */
  async removeMember(
    boardId: string,
    callerUserId: string,
    targetUserId: string
  ): Promise<void> {
    const callerRole = await this.boardRepo.getUserRole(boardId, callerUserId);
    if (!callerRole) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }

    // Trường hợp 1: Owner thao tác
    if (callerRole === 'owner') {
      if (callerUserId === targetUserId) {
        const error: any = new Error('Owner không thể tự rời bảng. Vui lòng đóng bảng nếu không sử dụng nữa.');
        error.statusCode = 400;
        throw error;
      }
      await this.boardRepo.removeMember(boardId, targetUserId);
      await removeBoardMemberSocket(boardId, targetUserId);
      emitBoardChanged(boardId, { type: 'board.updated', actorId: callerUserId });
      return;
    }

    // Trường hợp 2: Member tự rời bảng
    if (callerUserId === targetUserId) {
      await this.boardRepo.removeMember(boardId, targetUserId);
      await removeBoardMemberSocket(boardId, targetUserId);
      emitBoardChanged(boardId, { type: 'board.updated', actorId: callerUserId });
      return;
    }

    // Trường hợp 3: Member cố tình xoá người khác
    const error: any = new Error('Chỉ chủ sở hữu (Owner) mới có quyền xoá thành viên khác');
    error.statusCode = 403;
    throw error;
  }
}
