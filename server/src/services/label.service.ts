import { ILabelRepository, LabelEntity } from '../repositories/interfaces/ILabelRepository.js';
import { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import { Card, Label } from '../models/index.js';

export class LabelService {
  constructor(
    private labelRepo: ILabelRepository,
    private boardRepo: IBoardRepository
  ) {}

  async createLabel(
    boardId: string,
    userId: string,
    color: string,
    name?: string
  ): Promise<LabelEntity> {
    const role = await this.boardRepo.getUserRole(boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền');
      error.statusCode = 404;
      throw error;
    }

    return this.labelRepo.createLabel(boardId, color, name);
  }

  async updateLabel(
    labelId: string,
    userId: string,
    patch: { color?: string; name?: string }
  ): Promise<LabelEntity> {
    const label = await Label.findByPk(labelId);
    if (!label) {
      const error: any = new Error('Không tìm thấy nhãn');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(label.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền');
      error.statusCode = 404;
      throw error;
    }

    return this.labelRepo.updateLabel(labelId, patch);
  }

  async deleteLabel(labelId: string, userId: string): Promise<void> {
    const label = await Label.findByPk(labelId);
    if (!label) {
      const error: any = new Error('Không tìm thấy nhãn');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(label.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền');
      error.statusCode = 404;
      throw error;
    }

    await this.labelRepo.deleteLabel(labelId);
  }

  async addCardLabel(cardId: string, labelId: string, userId: string): Promise<void> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const label = await Label.findByPk(labelId);
    if (!label || label.boardId !== card.boardId) {
      const error: any = new Error('Không tìm thấy nhãn');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(card.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền');
      error.statusCode = 404;
      throw error;
    }

    await this.labelRepo.addCardLabel(cardId, labelId);
  }

  async removeCardLabel(cardId: string, labelId: string, userId: string): Promise<void> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(card.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền');
      error.statusCode = 404;
      throw error;
    }

    await this.labelRepo.removeCardLabel(cardId, labelId);
  }
}
