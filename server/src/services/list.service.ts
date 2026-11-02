import { IListRepository, ListEntity } from '../repositories/interfaces/IListRepository.js';
import { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import { List } from '../models/index.js';

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

    return this.listRepo.createList(boardId, name);
  }

  async updateList(listId: string, userId: string, name: string): Promise<ListEntity> {
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

    const updated = await this.listRepo.updateList(listId, name);
    if (!updated) {
      const error: any = new Error('Không tìm thấy danh sách');
      error.statusCode = 404;
      throw error;
    }
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
  }
}
