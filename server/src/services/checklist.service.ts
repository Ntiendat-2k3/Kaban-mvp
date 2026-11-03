import {
  IChecklistRepository,
  ChecklistEntity,
  ChecklistItemEntity,
} from '../repositories/interfaces/IChecklistRepository.js';
import { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import { Card, Checklist, ChecklistItem } from '../models/index.js';
import { emitBoardChanged } from '../realtime/socket.js';

export class ChecklistService {
  constructor(
    private checklistRepo: IChecklistRepository,
    private boardRepo: IBoardRepository
  ) {}

  async createChecklist(cardId: string, userId: string, title: string): Promise<ChecklistEntity> {
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

    const result = await this.checklistRepo.createChecklist(cardId, title);
    emitBoardChanged(card.boardId, { type: 'card.updated', actorId: userId, cardId: card.id });
    return result;
  }

  async deleteChecklist(checklistId: string, userId: string): Promise<void> {
    const checklist = await Checklist.findByPk(checklistId);
    if (!checklist) {
      const error: any = new Error('Không tìm thấy checklist');
      error.statusCode = 404;
      throw error;
    }

    const card = await Card.findByPk(checklist.cardId);
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

    await this.checklistRepo.deleteChecklist(checklistId);
    emitBoardChanged(card.boardId, { type: 'card.updated', actorId: userId, cardId: card.id });
  }

  async createChecklistItem(
    checklistId: string,
    userId: string,
    text: string
  ): Promise<ChecklistItemEntity> {
    const checklist = await Checklist.findByPk(checklistId);
    if (!checklist) {
      const error: any = new Error('Không tìm thấy checklist');
      error.statusCode = 404;
      throw error;
    }

    const card = await Card.findByPk(checklist.cardId);
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

    const result = await this.checklistRepo.createChecklistItem(checklistId, text);
    emitBoardChanged(card.boardId, { type: 'card.updated', actorId: userId, cardId: card.id });
    return result;
  }

  async updateChecklistItem(
    itemId: string,
    userId: string,
    patch: { text?: string; done?: boolean }
  ): Promise<ChecklistItemEntity> {
    const item = await ChecklistItem.findByPk(itemId);
    if (!item) {
      const error: any = new Error('Không tìm thấy mục checklist');
      error.statusCode = 404;
      throw error;
    }

    const checklist = await Checklist.findByPk(item.checklistId);
    if (!checklist) {
      const error: any = new Error('Không tìm thấy checklist');
      error.statusCode = 404;
      throw error;
    }

    const card = await Card.findByPk(checklist.cardId);
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

    const result = await this.checklistRepo.updateChecklistItem(itemId, patch);
    emitBoardChanged(card.boardId, { type: 'card.updated', actorId: userId, cardId: card.id });
    return result;
  }

  async deleteChecklistItem(itemId: string, userId: string): Promise<void> {
    const item = await ChecklistItem.findByPk(itemId);
    if (!item) {
      const error: any = new Error('Không tìm thấy mục checklist');
      error.statusCode = 404;
      throw error;
    }

    const checklist = await Checklist.findByPk(item.checklistId);
    if (!checklist) {
      const error: any = new Error('Không tìm thấy checklist');
      error.statusCode = 404;
      throw error;
    }

    const card = await Card.findByPk(checklist.cardId);
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

    await this.checklistRepo.deleteChecklistItem(itemId);
    emitBoardChanged(card.boardId, { type: 'card.updated', actorId: userId, cardId: card.id });
  }
}
