import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { BoardService } from '../services/board.service.js';
import { SequelizeBoardRepository } from '../repositories/sequelize/board.repository.js';
import { ResponseView } from '../views/response.view.js';
import {
  List, Card, Label, Attachment, CardLabel, CardMember,
  Checklist, ChecklistItem, Comment,
} from '../models/index.js';

const boardRepository = new SequelizeBoardRepository();
const boardService = new BoardService(boardRepository);

export class BoardController {
  /**
   * GET /boards - Lấy danh sách bảng của người dùng
   */
  static async getBoards(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const includeClosed = req.query.includeClosed === 'true';

      const boards = await boardService.getUserBoards(userId, includeClosed);
      res.status(200).json(boards);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi lấy danh sách bảng', error.statusCode || 500);
    }
  }

  /**
   * POST /boards - Tạo bảng mới
   */
  static async createBoard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const board = await boardService.createBoard(userId, req.body);
      res.status(201).json(board);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi tạo bảng', error.statusCode || 500);
    }
  }

  /**
   * GET /boards/:boardId - Lấy chi tiết bảng đầy đủ lists và cards (BoardDetail OpenAPI)
   */
  static async getBoardDetail(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { boardId } = req.params;

      const board = await boardService.getBoardDetail(boardId, userId);
      const members = await boardService.getMembers(boardId, userId);
      const labels = await Label.findAll({ where: { boardId } });
      const lists = await List.findAll({
        where: { boardId, isArchived: false },
        order: [['position', 'ASC']],
      });

      const listIds = lists.map((l) => l.id);
      const cards = listIds.length
        ? await Card.findAll({
            where: { listId: { [Op.in]: listIds }, isArchived: false },
            order: [['position', 'ASC']],
          })
        : [];

      const cardIds = cards.map((c) => c.id);
      // Đọc dữ liệu của toàn bảng theo lô để tránh truy vấn riêng cho từng thẻ.
      const [covers, cardLabels, cardMembers, checklists, comments] = cardIds.length
        ? await Promise.all([
            Attachment.findAll({ where: { cardId: { [Op.in]: cardIds }, isCover: true } }),
            CardLabel.findAll({ where: { cardId: { [Op.in]: cardIds } } }),
            CardMember.findAll({ where: { cardId: { [Op.in]: cardIds } } }),
            Checklist.findAll({ where: { cardId: { [Op.in]: cardIds } } }),
            Comment.findAll({ where: { cardId: { [Op.in]: cardIds } }, attributes: ['cardId'] }),
          ])
        : [[], [], [], [], []];
      const checklistIds = checklists.map((checklist) => checklist.id);
      const checklistItems = checklistIds.length
        ? await ChecklistItem.findAll({
            where: { checklistId: { [Op.in]: checklistIds } },
            attributes: ['checklistId', 'isCompleted'],
          })
        : [];

      const labelIdsByCard = new Map<string, string[]>();
      for (const relation of cardLabels) {
        const ids = labelIdsByCard.get(relation.cardId) || [];
        ids.push(relation.labelId);
        labelIdsByCard.set(relation.cardId, ids);
      }
      const memberIdsByCard = new Map<string, string[]>();
      for (const relation of cardMembers) {
        const ids = memberIdsByCard.get(relation.cardId) || [];
        ids.push(relation.userId);
        memberIdsByCard.set(relation.cardId, ids);
      }
      const cardIdByChecklist = new Map(checklists.map((checklist) => [checklist.id, checklist.cardId]));
      const checklistCountsByCard = new Map<string, { done: number; total: number }>();
      for (const item of checklistItems) {
        const cardId = cardIdByChecklist.get(item.checklistId);
        if (!cardId) continue;
        const counts = checklistCountsByCard.get(cardId) || { done: 0, total: 0 };
        counts.total += 1;
        if (item.isCompleted) counts.done += 1;
        checklistCountsByCard.set(cardId, counts);
      }
      const commentCountsByCard = new Map<string, number>();
      for (const comment of comments) {
        commentCountsByCard.set(comment.cardId, (commentCountsByCard.get(comment.cardId) || 0) + 1);
      }
      const coverMap = new Map<string, { fileUrl: string; fileType: 'image' | 'video' }>();
      covers.forEach((att) => {
        coverMap.set(att.cardId, { fileUrl: att.fileUrl, fileType: att.fileType });
      });

      const cardsByList = new Map<string, any[]>();
      for (const card of cards) {
        if (!cardsByList.has(card.listId)) {
          cardsByList.set(card.listId, []);
        }
        const cover = coverMap.get(card.id);
        cardsByList.get(card.listId)!.push({
          id: card.id,
          listId: card.listId,
          title: card.title,
          labelIds: labelIdsByCard.get(card.id) || [],
          memberIds: memberIdsByCard.get(card.id) || [],
          dueDate: card.dueDate,
          dueComplete: !!card.dueComplete,
          checklistDone: checklistCountsByCard.get(card.id)?.done || 0,
          checklistTotal: checklistCountsByCard.get(card.id)?.total || 0,
          commentCount: commentCountsByCard.get(card.id) || 0,
          coverUrl: cover?.fileUrl || null,
          coverType: cover?.fileType || null,
        });
      }

      const listsWithCards = lists.map((l) => ({
        id: l.id,
        boardId: l.boardId,
        name: l.title,
        cards: cardsByList.get(l.id) || [],
      }));

      res.status(200).json({
        ...board,
        board,
        members,
        labels,
        lists: listsWithCards,
      });
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi tải bảng', error.statusCode || 500);
    }
  }

  /**
   * PATCH /boards/:boardId - Đổi tên hoặc màu nền bảng
   */
  static async updateBoard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { boardId } = req.params;

      const updated = await boardService.updateBoard(boardId, userId, req.body);
      res.status(200).json(updated);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi cập nhật bảng', error.statusCode || 400);
    }
  }

  /**
   * PUT /boards/:boardId/star - Gắn sao bảng
   */
  static async starBoard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { boardId } = req.params;

      await boardService.toggleStar(boardId, userId, true);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi gắn sao bảng', error.statusCode || 400);
    }
  }

  /**
   * DELETE /boards/:boardId/star - Bỏ gắn sao bảng
   */
  static async unstarBoard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { boardId } = req.params;

      await boardService.toggleStar(boardId, userId, false);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi bỏ sao bảng', error.statusCode || 400);
    }
  }

  /**
   * POST /boards/:boardId/archive - Đóng bảng
   */
  static async archiveBoard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { boardId } = req.params;

      const board = await boardService.archiveBoard(boardId, userId);
      res.status(200).json(board);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi đóng bảng', error.statusCode || 400);
    }
  }

  /**
   * POST /boards/:boardId/restore - Mở lại bảng đã đóng
   */
  static async restoreBoard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { boardId } = req.params;

      const board = await boardService.restoreBoard(boardId, userId);
      res.status(200).json(board);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi mở lại bảng', error.statusCode || 400);
    }
  }

  /**
   * GET /boards/:boardId/members - Lấy danh sách thành viên bảng
   */
  static async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { boardId } = req.params;

      const members = await boardService.getMembers(boardId, userId);
      res.status(200).json(members);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi lấy danh sách thành viên', error.statusCode || 400);
    }
  }

  /**
   * POST /boards/:boardId/members - Mời thành viên bằng email
   */
  static async addMember(req: Request, res: Response): Promise<void> {
    try {
      const callerUserId = (req as any).user?.id;
      const { boardId } = req.params;
      const { email } = req.body;

      const newMember = await boardService.addMember(boardId, callerUserId, email);
      res.status(201).json(newMember);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi mời thành viên', error.statusCode || 400);
    }
  }

  /**
   * DELETE /boards/:boardId/members/:userId - Xoá thành viên hoặc tự rời bảng
   */
  static async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const callerUserId = (req as any).user?.id;
      const { boardId, userId: targetUserId } = req.params;

      await boardService.removeMember(boardId, callerUserId, targetUserId);
      res.status(204).send();
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi xoá thành viên', error.statusCode || 400);
    }
  }
}
