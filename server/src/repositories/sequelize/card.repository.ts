import {
  ICardRepository,
  CardSummaryEntity,
  CardDetailEntity,
  ArchivedCardEntity,
} from '../interfaces/ICardRepository.js';
import {
  Card,
  List,
  Label,
  User,
  Checklist,
  ChecklistItem,
  Comment,
  BoardMember,
  CardLabel,
  CardMember,
  Attachment,
  Activity,
} from '../../models/index.js';
import { sequelize } from '../../config/database.js';
import { Op } from 'sequelize';
import { computePosition, POSITION_STEP } from '../../utils/position.js';

export class SequelizeCardRepository implements ICardRepository {
  async createCard(listId: string, title: string): Promise<CardSummaryEntity> {
    const list = await List.findByPk(listId);
    if (!list) {
      const error: any = new Error('Không tìm thấy danh sách');
      error.statusCode = 404;
      throw error;
    }

    // Tìm thẻ cuối cùng trong list để đặt thẻ mới ở cuối (BR-06)
    const lastCard = await Card.findOne({
      where: { listId, isArchived: false },
      order: [['position', 'DESC']],
    });

    const nextPosition = lastCard ? lastCard.position + 65535 : 65535;

    const card = await Card.create({
      listId,
      boardId: list.boardId,
      title,
      position: nextPosition,
      isArchived: false,
      dueComplete: false,
    });

    return {
      id: card.id,
      listId: card.listId,
      title: card.title,
      labelIds: [],
      memberIds: [],
      dueDate: card.dueDate,
      dueComplete: false,
      checklistDone: 0,
      checklistTotal: 0,
      commentCount: 0,
      position: card.position,
    };
  }

  /** Sao chép dữ liệu thẻ trong một giao dịch; bình luận là lịch sử nên không nhân bản. */
  async duplicateCard(cardId: string): Promise<CardSummaryEntity> {
    return sequelize.transaction(async (transaction) => {
      const source = await Card.findByPk(cardId, { transaction });
      if (!source || source.isArchived) {
        const error: any = new Error('Không tìm thấy thẻ');
        error.statusCode = 404;
        throw error;
      }

      const siblings = await Card.findAll({
        where: { listId: source.listId, isArchived: false },
        order: [['position', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const duplicate = await Card.create({
        listId: source.listId,
        boardId: source.boardId,
        title: source.title,
        description: source.description,
        dueDate: source.dueDate,
        dueComplete: source.dueComplete,
        position: (siblings.length + 1) * 65535,
        isArchived: false,
      }, { transaction });

      const sourceIndex = siblings.findIndex((card) => card.id === cardId);
      if (sourceIndex < 0) {
        const error: any = new Error('Không tìm thấy thẻ trong danh sách');
        error.statusCode = 404;
        throw error;
      }
      siblings.splice(sourceIndex + 1, 0, duplicate);
      await Promise.all(siblings.map((card, index) => {
        card.position = (index + 1) * 65535;
        return card.save({ transaction });
      }));

      const [labels, members, checklists, attachments] = await Promise.all([
        CardLabel.findAll({ where: { cardId }, transaction }),
        CardMember.findAll({ where: { cardId }, transaction }),
        Checklist.findAll({ where: { cardId }, order: [['position', 'ASC']], transaction }),
        Attachment.findAll({ where: { cardId }, transaction }),
      ]);
      await Promise.all([
        CardLabel.bulkCreate(labels.map((label) => ({ cardId: duplicate.id, labelId: label.labelId })), { transaction }),
        CardMember.bulkCreate(members.map((member) => ({ cardId: duplicate.id, userId: member.userId })), { transaction }),
        Attachment.bulkCreate(attachments.map((attachment) => ({
          cardId: duplicate.id,
          boardId: source.boardId,
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileType: attachment.fileType,
          mimeType: attachment.mimeType,
          publicId: attachment.publicId,
          size: attachment.size,
          isCover: attachment.isCover,
        })), { transaction }),
      ]);

      let checklistTotal = 0;
      let checklistDone = 0;
      for (const checklist of checklists) {
        const copiedChecklist = await Checklist.create({
          cardId: duplicate.id,
          title: checklist.title,
          position: checklist.position,
        }, { transaction });
        const items = await ChecklistItem.findAll({
          where: { checklistId: checklist.id },
          order: [['position', 'ASC']],
          transaction,
        });
        checklistTotal += items.length;
        checklistDone += items.filter((item) => item.isCompleted).length;
        await ChecklistItem.bulkCreate(items.map((item) => ({
          checklistId: copiedChecklist.id,
          title: item.title,
          isCompleted: item.isCompleted,
          position: item.position,
        })), { transaction });
      }

      return {
        id: duplicate.id,
        listId: duplicate.listId,
        title: duplicate.title,
        labelIds: labels.map((label) => label.labelId),
        memberIds: members.map((member) => member.userId),
        dueDate: duplicate.dueDate,
        dueComplete: duplicate.dueComplete,
        checklistDone,
        checklistTotal,
        commentCount: 0,
        position: duplicate.position,
      };
    });
  }

  async moveCard(cardId: string, toListId: string, toIndex: number): Promise<boolean> {
    return sequelize.transaction(async (transaction) => {
      const card = await Card.findByPk(cardId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!card || card.isArchived) return false;
      const targetList = await List.findByPk(toListId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!targetList) return false;

      // Kh?a th? ??ch ?? hai l??t k?o ??ng th?i kh?ng d?ng c?ng v? tr? c?.
      const siblings = await Card.findAll({
        where: { listId: toListId, isArchived: false, id: { [Op.ne]: cardId } },
        order: [['position', 'ASC']], transaction, lock: transaction.LOCK.UPDATE,
      });
      const index = Math.max(0, Math.min(toIndex, siblings.length));
      const { position, needsRebalance } = computePosition(siblings[index - 1]?.position, siblings[index]?.position);
      if (!needsRebalance) {
        await card.update({ listId: toListId, position }, { transaction });
        return true;
      }
      siblings.splice(index, 0, card);
      for (const [i, sibling] of siblings.entries()) {
        await sibling.update({ listId: toListId, position: (i + 1) * POSITION_STEP }, { transaction });
      }
      return true;
    });
  }

  async getCardDetail(cardId: string): Promise<CardDetailEntity | null> {
    const card = await Card.findByPk(cardId, {
      include: [
        { model: Label, as: 'labels', attributes: ['id'] },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
        {
          model: Checklist,
          as: 'checklists',
          include: [
            {
              model: ChecklistItem,
              as: 'items',
              attributes: ['id', 'checklistId', 'title', 'isCompleted', 'position'],
            },
          ],
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [
        [{ model: Checklist, as: 'checklists' }, 'position', 'ASC'],
        [{ model: Checklist, as: 'checklists' }, { model: ChecklistItem, as: 'items' }, 'position', 'ASC'],
        [{ model: Comment, as: 'comments' }, 'createdAt', 'DESC'],
      ],
    });

    if (!card) return null;

    // Lấy roles của các members trong bảng
    const boardMembers = await BoardMember.findAll({
      where: { boardId: card.boardId },
    });
    const memberRoleMap = new Map<string, 'owner' | 'member'>();
    boardMembers.forEach((bm) => {
      memberRoleMap.set(bm.userId, bm.role === 'admin' ? 'owner' : 'member');
    });

    const cardAny = card as any;
    const labels = (cardAny.labels || []).map((l: any) => l.id);
    const members = (cardAny.members || []).map((m: any) => ({
      userId: m.id,
      name: m.name,
      email: m.email,
      role: memberRoleMap.get(m.id) || 'member',
    }));

    const checklists = (cardAny.checklists || []).map((chk: any) => ({
      id: chk.id,
      cardId: chk.cardId,
      title: chk.title,
      items: (chk.items || []).map((item: any) => ({
        id: item.id,
        checklistId: item.checklistId,
        text: item.title,
        done: item.isCompleted,
      })),
    }));

    const comments = (cardAny.comments || []).map((cm: any) => ({
      id: cm.id,
      cardId: cm.cardId,
      author: {
        id: cm.author?.id,
        name: cm.author?.name,
        email: cm.author?.email,
      },
      text: cm.content,
      createdAt: cm.createdAt,
      editedAt: cm.editedAt || null,
    }));

    return {
      id: card.id,
      boardId: card.boardId,
      listId: card.listId,
      title: card.title,
      description: card.description || '',
      archived: card.isArchived,
      labelIds: labels,
      members,
      dueDate: card.dueDate,
      dueComplete: !!card.dueComplete,
      checklists,
      comments,
    };
  }

  async updateCard(
    cardId: string,
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

    if (patch.title !== undefined) {
      card.title = patch.title;
    }
    if (patch.description !== undefined) {
      card.description = patch.description;
    }
    if (patch.dueDate !== undefined) {
      card.dueDate = patch.dueDate;
      // Nếu gửi dueDate = null thì tự động reset dueComplete về false (OpenAPI spec & TC-01.1-06)
      if (patch.dueDate === null) {
        card.dueComplete = false;
      }
    }
    if (patch.dueComplete !== undefined && card.dueDate !== null) {
      card.dueComplete = patch.dueComplete;
    }

    await card.save();

    const detail = await this.getCardDetail(cardId);
    return detail!;
  }

  async archiveCard(cardId: string): Promise<void> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    card.isArchived = true;
    await card.save();
  }

  /** Liệt kê thẻ đã lưu trữ kèm trạng thái danh sách gốc để giao diện biết thẻ nào có thể khôi phục. */
  async getArchivedCards(boardId: string): Promise<ArchivedCardEntity[]> {
    const cards = await Card.findAll({
      attributes: ['id', 'title', 'listId'],
      where: { boardId, isArchived: true },
      order: [['updatedAt', 'DESC']],
    });
    if (cards.length === 0) return [];

    const lists = await List.findAll({
      attributes: ['id', 'title', 'isArchived'],
      where: { id: { [Op.in]: [...new Set(cards.map((card) => card.listId))] } },
    });
    const listsById = new Map(lists.map((list) => [list.id, list]));
    return cards.map((card) => {
      const list = listsById.get(card.listId);
      return {
        id: card.id,
        title: card.title,
        listId: card.listId,
        listName: list?.title ?? 'Danh sách không còn tồn tại',
        listArchived: !list || list.isArchived,
      };
    });
  }

  /** Xóa thẻ cùng dữ liệu phụ thuộc trong một giao dịch; trả về tệp cần dọn khỏi Cloudinary. */
  async deleteCard(cardId: string): Promise<Array<{ publicId: string; fileType: 'image' | 'video' }> | null> {
    return sequelize.transaction(async (transaction) => {
      const card = await Card.findByPk(cardId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!card) return null;

      const attachments = await Attachment.findAll({
        attributes: ['publicId', 'fileType'],
        where: { cardId },
        transaction,
      });
      const checklists = await Checklist.findAll({ attributes: ['id'], where: { cardId }, transaction });
      if (checklists.length > 0) {
        await ChecklistItem.destroy({
          where: { checklistId: { [Op.in]: checklists.map((checklist) => checklist.id) } },
          transaction,
        });
      }

      await Checklist.destroy({ where: { cardId }, transaction });
      await Comment.destroy({ where: { cardId }, transaction });
      await CardLabel.destroy({ where: { cardId }, transaction });
      await CardMember.destroy({ where: { cardId }, transaction });
      await Attachment.destroy({ where: { cardId }, transaction });
      await Activity.update({ cardId: null }, { where: { cardId }, transaction });
      await card.destroy({ transaction });

      return attachments
        .filter((attachment) => attachment.publicId)
        .map((attachment) => ({ publicId: attachment.publicId!, fileType: attachment.fileType }));
    });
  }

  async restoreCard(cardId: string): Promise<CardSummaryEntity> {
    const card = await Card.findByPk(cardId);
    if (!card) {
      const error: any = new Error('Không tìm thấy thẻ');
      error.statusCode = 404;
      throw error;
    }

    const list = await List.findByPk(card.listId);
    // Nếu list gốc đã bị archive thì chặn và trả về 409 LIST_ARCHIVED (RISK-02, BR-08, TC-01.1-09)
    if (!list || list.isArchived) {
      const error: any = new Error('Danh sách gốc của thẻ đã bị lưu trữ');
      error.statusCode = 409;
      error.code = 'LIST_ARCHIVED';
      throw error;
    }

    const lastCard = await Card.findOne({
      where: { listId: card.listId, isArchived: false },
      order: [['position', 'DESC']],
    });

    card.isArchived = false;
    card.position = lastCard ? lastCard.position + 65535 : 65535;
    await card.save();

    return {
      id: card.id,
      listId: card.listId,
      title: card.title,
      labelIds: [],
      memberIds: [],
      dueDate: card.dueDate,
      dueComplete: card.dueComplete,
      checklistDone: 0,
      checklistTotal: 0,
      commentCount: 0,
      position: card.position,
    };
  }
}
