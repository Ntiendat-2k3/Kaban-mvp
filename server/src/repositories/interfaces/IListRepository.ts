export interface ListEntity {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IListRepository {
  createList(boardId: string, name: string): Promise<ListEntity>;
  updateList(listId: string, name: string): Promise<ListEntity | null>;
  archiveList(listId: string): Promise<boolean>;
  moveList(listId: string, toIndex: number): Promise<boolean>;
  getBoardLists(boardId: string): Promise<ListEntity[]>;
}
