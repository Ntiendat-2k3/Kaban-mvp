import { IListRepository, ListEntity, ArchivedListEntity } from '../repositories/interfaces/IListRepository.js';
import { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import { List } from '../models/index.js';
import { emitBoardChanged } from '../realtime/socket.js';
import type { BoardBackground } from '../repositories/interfaces/IBoardRepository.js';

export class ListService {
  constructor(
    private listRepo: IListRepository,
    private boardRepo: IBoardRepository
  ) {}

  async createList(boardId: string, userId: string, name: string): Promise<ListEntity> {
    const role = await this.boardRepo.getUserRole(boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    const created = await this.listRepo.createList(boardId, name);
    emitBoardChanged(boardId, { type: 'list.created', actorId: userId });
    return created;
  }

  async updateList(listId: string, userId: string, patch: { name?: string; wipLimit?: number | null; color?: BoardBackground | null }): Promise<ListEntity> {
    const list = await List.findByPk(listId);
    if (!list || list.isArchived) {
      const error: any = new Error('Không tìm thấy danh sách');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(list.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    const updated = await this.listRepo.updateList(listId, patch);
    if (!updated) {
      const error: any = new Error('Không tìm thấy danh sách');
      error.statusCode = 404;
      throw error;
    }
    emitBoardChanged(list.boardId, { type: 'list.updated', actorId: userId });
    return updated;
  }

  async archiveList(listId: string, userId: string): Promise<void> {
    const list = await List.findByPk(listId);
    if (!list || list.isArchived) {
      const error: any = new Error('Không tìm thấy danh sách');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(list.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    await this.listRepo.archiveList(listId);
    emitBoardChanged(list.boardId, { type: 'list.archived', actorId: userId });
  }

  async getArchivedLists(boardId: string, userId: string): Promise<ArchivedListEntity[]> {
    if (!await this.boardRepo.getUserRole(boardId, userId)) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }
    return this.listRepo.getArchivedLists(boardId);
  }

  async restoreList(listId: string, userId: string): Promise<ListEntity> {
    const list = await List.findByPk(listId);
    if (!list || !list.isArchived || !await this.boardRepo.getUserRole(list.boardId, userId)) {
      const error: any = new Error('Không tìm thấy danh sách hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }
    const restored = await this.listRepo.restoreList(listId);
    if (!restored) {
      const error: any = new Error('Không tìm thấy danh sách');
      error.statusCode = 404;
      throw error;
    }
    emitBoardChanged(list.boardId, { type: 'list.restored', actorId: userId });
    return restored;
  }

  async moveList(listId: string, userId: string, toIndex: number): Promise<void> {
    const list = await List.findByPk(listId);
    if (!list || list.isArchived) {
      const error: any = new Error('Không tìm thấy danh sách');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(list.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    await this.listRepo.moveList(listId, toIndex);
    emitBoardChanged(list.boardId, { type: 'list.moved', actorId: userId });
  }
}
