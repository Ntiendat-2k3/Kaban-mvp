import { IBaseRepository } from './IBaseRepository.js';

export type BoardBackground =
  | 'blue'
  | 'orange'
  | 'green'
  | 'red'
  | 'purple'
  | 'pink'
  | 'lime'
  | 'sky';

export interface BoardEntity {
  id: string;
  name: string;
  background: BoardBackground;
  archived: boolean;
  isStarred: boolean;
  role: 'owner' | 'member';
  ownerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BoardMemberEntity {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
}

/**
 * Interface cho Board Repository cô lập Data Access Layer (MVPS pattern)
 */
export interface IBoardRepository extends IBaseRepository<any> {
  findUserBoards(userId: string, includeClosed?: boolean): Promise<BoardEntity[]>;
  getBoardDetail(boardId: string, userId: string): Promise<BoardEntity | null>;
  createBoard(data: { name: string; background?: BoardBackground; ownerId: string }): Promise<BoardEntity>;
  updateBoard(boardId: string, data: { name?: string; background?: BoardBackground }): Promise<BoardEntity | null>;
  setStar(boardId: string, userId: string, isStarred: boolean): Promise<void>;
  setArchived(boardId: string, archived: boolean): Promise<BoardEntity | null>;
  getMembers(boardId: string): Promise<BoardMemberEntity[]>;
  addMember(boardId: string, userId: string, role?: 'admin' | 'member'): Promise<void>;
  removeMember(boardId: string, userId: string): Promise<boolean>;
  getUserRole(boardId: string, userId: string): Promise<'owner' | 'member' | null>;
}
