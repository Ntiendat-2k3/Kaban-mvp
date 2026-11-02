export interface ChecklistItemEntity {
  id: string;
  checklistId: string;
  text: string;
  done: boolean;
}

export interface ChecklistEntity {
  id: string;
  cardId: string;
  title: string;
  items: ChecklistItemEntity[];
}

export interface IChecklistRepository {
  createChecklist(cardId: string, title: string): Promise<ChecklistEntity>;
  deleteChecklist(checklistId: string): Promise<void>;
  createChecklistItem(checklistId: string, text: string): Promise<ChecklistItemEntity>;
  updateChecklistItem(itemId: string, patch: { text?: string; done?: boolean }): Promise<ChecklistItemEntity>;
  deleteChecklistItem(itemId: string): Promise<void>;
}
