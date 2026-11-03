import { Board, BoardMember, BoardBackground } from './board';
import type { components } from './api';

export interface CardSummary {
  id: string;
  listId: string;
  title: string;
  labelIds: string[];
  memberIds: string[];
  dueDate: string | null;
  dueComplete: boolean;
  checklistDone: number;
  checklistTotal: number;
  commentCount: number;
  coverUrl?: string | null;
  coverType?: 'image' | 'video' | null;
}

export interface ListWithCards {
  id: string;
  boardId: string;
  name: string;
  wipLimit: number | null;
  color: BoardBackground | null;
  cards: CardSummary[];
}

export interface BoardLabel {
  id: string;
  name: string;
  color: components['schemas']['LabelColor'];
}

export interface BoardDetail {
  id: string;
  name: string;
  background: BoardBackground;
  archived: boolean;
  isStarred: boolean;
  role: 'owner' | 'member';
  board: Board;
  members: BoardMember[];
  labels: BoardLabel[];
  lists: ListWithCards[];
}

