import type { BoardBackground } from './IBoardRepository.js';

export interface ListEntity {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isArchived: boolean;
  wipLimit?: number | null;
  color?: BoardBackground | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ArchivedListEntity {
  id: string;
  name: string;
}

export interface IListRepository {
  createList(boardId: string, name: string): Promise<ListEntity>;
  updateList(listId: string, patch: { name?: string; wipLimit?: number | null; color?: BoardBackground | null }): Promise<ListEntity | null>;
  archiveList(listId: string): Promise<boolean>;
  getArchivedLists(boardId: string): Promise<ArchivedListEntity[]>;
  restoreList(listId: string): Promise<ListEntity | null>;
  moveList(listId: string, toIndex: number): Promise<boolean>;
  getBoardLists(boardId: string): Promise<ListEntity[]>;
}
