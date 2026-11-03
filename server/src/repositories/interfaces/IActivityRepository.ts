export interface ActivityInput {
  boardId: string;
  cardId?: string | null;
  userId: string;
  type: string;
  data?: Record<string, unknown>;
}

export interface ActivityEntity extends ActivityInput {
  id: string;
  cardId: string | null;
  data: Record<string, unknown>;
  createdAt: Date;
  actor: { id: string; name: string };
}

export interface IActivityRepository {
  create(input: ActivityInput): Promise<void>;
  findByBoard(boardId: string, limit: number, before?: Date): Promise<ActivityEntity[]>;
}
