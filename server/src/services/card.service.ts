import {
  ICardRepository,
  CardSummaryEntity,
  CardDetailEntity,
  ArchivedCardEntity,
} from '../repositories/interfaces/ICardRepository.js';
import { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';
import { ICardMemberRepository } from '../repositories/interfaces/ICardMemberRepository.js';
import { SequelizeCardMemberRepository } from '../repositories/sequelize/card-member.repository.js';
import { IAttachmentRepository } from '../repositories/interfaces/IAttachmentRepository.js';
import { SequelizeAttachmentRepository } from '../repositories/sequelize/attachment.repository.js';
import { CloudinaryService } from './cloudinary.service.js';
import { List, Card } from '../models/index.js';
import { emitBoardChanged } from '../realtime/socket.js';
import { logActivity } from './activity.service.js';
import { sequelize } from '../config/database.js';

export class CardService {
  private cardMemberRepo: ICardMemberRepository;
  private attachmentRepo: IAttachmentRepository;

  /** Chỉ đếm thẻ đang hoạt động; null nghĩa là cột không giới hạn. */
  private async assertWipLimit(list: List): Promise<void> {
    if (list.wipLimit == null) return;
    const count = await Card.count({ where: { listId: list.id, isArchived: false } });
    if (count >= list.wipLimit) {
      const error: any = new Error(`Cột "${list.title}" đã đạt giới hạn ${list.wipLimit} thẻ`);
      error.statusCode = 409;
      error.code = 'WIP_LIMIT_EXCEEDED';
      throw error;
    }
  }

  /** Tuần tự hóa thao tác vào cùng cột để hai yêu cầu không cùng vượt giới hạn. */
  private async withWipCapacity<T>(list: List, operation: () => Promise<T>): Promise<T> {
    if (list.wipLimit == null) return operation();
    return sequelize.transaction(async (transaction) => {
      await sequelize.query('SELECT pg_advisory_xact_lock(68114003, hashtext(:listId))', {
        transaction, replacements: { listId: list.id },
      });
      const current = await List.findByPk(list.id, { transaction });
      if (current) await this.assertWipLimit(current);
      return operation();
    });
  }

  constructor(
    private cardRepo: ICardRepository,
    private boardRepo: IBoardRepository,
    cardMemberRepo?: ICardMemberRepository,
    attachmentRepo?: IAttachmentRepository
  ) {
    this.cardMemberRepo = cardMemberRepo || new SequelizeCardMemberRepository();
    this.attachmentRepo = attachmentRepo || new SequelizeAttachmentRepository();
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

    const created = await this.withWipCapacity(list, () => this.cardRepo.createCard(listId, title));
    await logActivity({ boardId: list.boardId, cardId: created.id, userId, type: 'card.created', data: { title } });
    emitBoardChanged(list.boardId, { type: 'card.created', actorId: userId, cardId: created.id });
    return created;
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

    const duplicate = await this.withWipCapacity(list, () => this.cardRepo.duplicateCard(cardId));
    await logActivity({ boardId: card.boardId, cardId: duplicate.id, userId, type: 'card.created', data: { title: duplicate.title } });
    emitBoardChanged(card.boardId, { type: 'card.created', actorId: userId, cardId: duplicate.id });
    return duplicate;
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

    const sourceList = await List.findByPk(card.listId);
    const moved = card.listId !== toListId
      ? await this.withWipCapacity(targetList, () => this.cardRepo.moveCard(cardId, toListId, toIndex))
      : await this.cardRepo.moveCard(cardId, toListId, toIndex);
    if (!moved) {
      const error: any = new Error('Không tìm thấy thẻ hoặc danh sách đích');
      error.statusCode = 404;
      throw error;
    }
    await logActivity({ boardId: card.boardId, cardId, userId, type: 'card.moved', data: { fromList: sourceList?.title ?? '', toList: targetList.title } });
    emitBoardChanged(card.boardId, { type: 'card.moved', actorId: userId, cardId });
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

    const updated = await this.cardRepo.updateCard(cardId, patch);
    await logActivity({ boardId: card.boardId, cardId, userId, type: 'card.updated', data: { fields: Object.keys(patch) } });
    emitBoardChanged(card.boardId, { type: 'card.updated', actorId: userId, cardId });
    return updated;
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
    await logActivity({ boardId: card.boardId, cardId, userId, type: 'card.archived' });
    emitBoardChanged(card.boardId, { type: 'card.archived', actorId: userId, cardId });
  }

  async getArchivedCards(boardId: string, userId: string): Promise<ArchivedCardEntity[]> {
    if (!await this.boardRepo.getUserRole(boardId, userId)) {
      const error: any = new Error('Không tìm thấy bảng hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }
    return this.cardRepo.getArchivedCards(boardId);
  }

  /** Xóa vĩnh viễn thẻ; giữ nhật ký bảng và chỉ dọn tệp không còn thẻ nào sử dụng. */
  async deleteCard(cardId: string, userId: string): Promise<void> {
    const card = await Card.findByPk(cardId);
    if (!card || !await this.boardRepo.getUserRole(card.boardId, userId)) {
      const error: any = new Error('Không tìm thấy thẻ hoặc không có quyền truy cập');
      error.statusCode = 404;
      throw error;
    }

    const files = await this.cardRepo.deleteCard(cardId);
    if (!files) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    await logActivity({ boardId: card.boardId, userId, type: 'card.deleted', data: { title: card.title } });
    emitBoardChanged(card.boardId, { type: 'card.deleted', actorId: userId, cardId });

    const uniqueFiles = new Map(files.map((file) => [file.publicId, file]));
    for (const file of uniqueFiles.values()) {
      try {
        if (await this.attachmentRepo.countByPublicId(file.publicId) === 0) {
          await CloudinaryService.deleteFile(file.publicId, file.fileType);
        }
      } catch (error) {
        console.warn('Không thể dọn tệp của thẻ đã xóa:', error);
      }
    }
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

    const restored = await this.cardRepo.restoreCard(cardId);
    await logActivity({ boardId: card.boardId, cardId, userId, type: 'card.restored' });
    emitBoardChanged(card.boardId, { type: 'card.restored', actorId: userId, cardId });
    return restored;
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
    await logActivity({ boardId: card.boardId, cardId, userId: currentUserId, type: 'card.member_added', data: { memberId: targetUserId } });
    emitBoardChanged(card.boardId, { type: 'card.updated', actorId: currentUserId, cardId });
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
    await logActivity({ boardId: card.boardId, cardId, userId: currentUserId, type: 'card.member_removed', data: { memberId: targetUserId } });
    emitBoardChanged(card.boardId, { type: 'card.updated', actorId: currentUserId, cardId });
  }
}
