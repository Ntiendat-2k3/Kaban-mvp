export interface CardSummaryEntity {
  id: string;
  listId: string;
  title: string;
  labelIds: string[];
  memberIds: string[];
  dueDate: Date | null;
  dueComplete: boolean;
  checklistDone: number;
  checklistTotal: number;
  commentCount: number;
  position?: number;
}

export interface CardDetailEntity {
  id: string;
  boardId: string;
  listId: string;
  title: string;
  description: string;
  archived: boolean;
  labelIds: string[];
  members: Array<{
    userId: string;
    name: string;
    email: string;
    role: 'owner' | 'member';
  }>;
  dueDate: Date | null;
  dueComplete: boolean;
  checklists: Array<{
    id: string;
    cardId: string;
    title: string;
    items: Array<{
      id: string;
      checklistId: string;
      text: string;
      done: boolean;
    }>;
  }>;
  comments: Array<{
    id: string;
    cardId: string;
    author: {
      id: string;
      name: string;
      email: string;
    };
    text: string;
    createdAt: Date;
    editedAt: Date | null;
  }>;
}

export interface ICardRepository {
  createCard(listId: string, title: string): Promise<CardSummaryEntity>;
  duplicateCard(cardId: string): Promise<CardSummaryEntity>;
  moveCard(cardId: string, toListId: string, toIndex: number): Promise<boolean>;
  getCardDetail(cardId: string): Promise<CardDetailEntity | null>;
  updateCard(
    cardId: string,
    patch: {
      title?: string;
      description?: string;
      dueDate?: Date | null;
      dueComplete?: boolean;
    }
  ): Promise<CardDetailEntity>;
  archiveCard(cardId: string): Promise<void>;
  restoreCard(cardId: string): Promise<CardSummaryEntity>;
}
