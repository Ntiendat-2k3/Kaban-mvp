export interface DueReminderCandidate {
  cardId: string;
  userId: string;
  dueDate: Date;
}

export interface DueReminderRecipient extends DueReminderCandidate {
  boardId: string;
  email: string;
  name: string;
  cardTitle: string;
  boardName: string;
}

export interface IDueReminderRepository {
  claimDue(limit: number): Promise<DueReminderCandidate[]>;
  getCurrentRecipient(candidate: DueReminderCandidate): Promise<DueReminderRecipient | null>;
  markSent(candidate: DueReminderCandidate): Promise<void>;
  release(candidate: DueReminderCandidate): Promise<void>;
}
