import {
  ICardRepository,
  CardSummaryEntity,
  CardDetailEntity,
} from '../repositories/interfaces/ICardRepository.js';
import { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import { ICardMemberRepository } from '../repositories/interfaces/ICardMemberRepository.js';
import { SequelizeCardMemberRepository } from '../repositories/sequelize/card-member.repository.js';
import { List, Card } from '../models/index.js';

export class CardService {
  private cardMemberRepo: ICardMemberRepository;

  constructor(
    private cardRepo: ICardRepository,
    private boardRepo: IBoardRepository,
    cardMemberRepo?: ICardMemberRepository
  ) {
    this.cardMemberRepo = cardMemberRepo || new SequelizeCardMemberRepository();
  }

  async createCard(listId: string, userId: string, title: string): Promise<CardSummaryEntity> {
    const list = await List.findByPk(listId);
    if (!list || list.isArchived) {
      const error: any = new Error('Không tìm thấy danh sách');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(list.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    return this.cardRepo.createCard(listId, title);
  }

  /** Nhân bản nội dung thẻ vào cùng danh sách sau khi xác nhận quyền truy cập bảng. */
  async duplicateCard(cardId: string, userId: string): Promise<CardSummaryEntity> {
    const card = await Card.findByPk(cardId);
    if (!card || card.isArchived) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const list = await List.findByPk(card.listId);
    if (!list || list.isArchived || !await this.boardRepo.getUserRole(card.boardId, userId)) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    return this.cardRepo.duplicateCard(cardId);
  }

  async moveCard(
    cardId: string,
    userId: string,
    toListId: string,
    toIndex: number
  ): Promise<void> {
    const card = await Card.findByPk(cardId);
    if (!card || card.isArchived) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const targetList = await List.findByPk(toListId);
    if (!targetList || targetList.isArchived) {
      const error: any = new Error('Không tìm thấy danh sách đích');
      error.statusCode = 404;
      throw error;
    }

    // Đảm bảo cùng board và user có quyền
    if (card.boardId !== targetList.boardId) {
      const error: any = new Error('Không thể di chuyển thẻ sang bảng khác');
      error.statusCode = 400;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(card.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    await this.cardRepo.moveCard(cardId, toListId, toIndex);
  }

  async getCardDetail(cardId: string, userId: string): Promise<CardDetailEntity> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(card.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    const detail = await this.cardRepo.getCardDetail(cardId);
    if (!detail) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    return detail;
  }

  async updateCard(
    cardId: string,
    userId: string,
    patch: {
      title?: string;
      description?: string;
      dueDate?: Date | null;
      dueComplete?: boolean;
    }
  ): Promise<CardDetailEntity> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(card.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    return this.cardRepo.updateCard(cardId, patch);
  }

  async archiveCard(cardId: string, userId: string): Promise<void> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(card.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    await this.cardRepo.archiveCard(cardId);
  }

  async restoreCard(cardId: string, userId: string): Promise<CardSummaryEntity> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const role = await this.boardRepo.getUserRole(card.boardId, userId);
    if (!role) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    return this.cardRepo.restoreCard(cardId);
  }

  async addCardMember(cardId: string, targetUserId: string, currentUserId: string): Promise<void> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const currentUserRole = await this.boardRepo.getUserRole(card.boardId, currentUserId);
    if (!currentUserRole) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền');
      error.statusCode = 404;
      throw error;
    }

    // targetUserId phải là thành viên bảng, ngược lại 422 NOT_BOARD_MEMBER (BR-04, TC-01.3-02)
    const targetUserRole = await this.boardRepo.getUserRole(card.boardId, targetUserId);
    if (!targetUserRole) {
      const error: any = new Error('Người dùng không phải thành viên của bảng');
      error.statusCode = 422;
      error.code = 'NOT_BOARD_MEMBER';
      throw error;
    }

    await this.cardMemberRepo.addCardMember(cardId, targetUserId);
  }

  async removeCardMember(cardId: string, targetUserId: string, currentUserId: string): Promise<void> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const currentUserRole = await this.boardRepo.getUserRole(card.boardId, currentUserId);
    if (!currentUserRole) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền');
      error.statusCode = 404;
      throw error;
    }

    await this.cardMemberRepo.removeCardMember(cardId, targetUserId);
  }
}
