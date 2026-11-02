export interface LabelEntity {
  id: string;
  boardId: string;
  color: string;
  name: string;
}

export interface ILabelRepository {
  createLabel(boardId: string, color: string, name?: string): Promise<LabelEntity>;
  updateLabel(labelId: string, patch: { color?: string; name?: string }): Promise<LabelEntity>;
  deleteLabel(labelId: string): Promise<void>;
  addCardLabel(cardId: string, labelId: string): Promise<void>;
  removeCardLabel(cardId: string, labelId: string): Promise<void>;
  getBoardLabels(boardId: string): Promise<LabelEntity[]>;
}
