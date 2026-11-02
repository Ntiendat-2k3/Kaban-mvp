import { BoardMember } from './board';
import { BoardLabel } from './board-detail';

export interface ChecklistItem {
  id: string;
  checklistId: string;
  text: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  cardId: string;
  title: string;
  items: ChecklistItem[];
}

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
}

export interface Comment {
  id: string;
  cardId: string;
  author: CommentAuthor;
  text: string;
  createdAt: string;
  editedAt: string | null;
}

export interface CardDetail {
  id: string;
  boardId: string;
  listId: string;
  title: string;
  description: string;
  archived: boolean;
  labelIds: string[];
  members: BoardMember[];
  dueDate: string | null;
  dueComplete: boolean;
  checklists: Checklist[];
  comments: Comment[];
}

export interface CardPatchInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  dueComplete?: boolean;
}
