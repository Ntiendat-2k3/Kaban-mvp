import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { CardDueReminder } from '../../models/index.js';
import type {
  DueReminderCandidate,
  DueReminderRecipient,
  IDueReminderRepository,
} from '../interfaces/IDueReminderRepository.js';

/**
 * Chỉ chọn người còn được gán vào thẻ và còn thuộc bảng tại thời điểm gửi.
 * Khóa SKIP LOCKED giúp nhiều tiến trình cùng chạy mà không lấy một lượt nhắc hai lần.
 */
export class SequelizeDueReminderRepository implements IDueReminderRepository {
  async claimDue(limit: number): Promise<DueReminderCandidate[]> {
    await sequelize.query(`
      INSERT INTO "card_due_reminders" ("cardId", "userId", "dueDate")
      SELECT DISTINCT c."id", cm."userId", c."dueDate"
      FROM "cards" c
      JOIN "card_members" cm ON cm."cardId" = c."id"
      JOIN "lists" l ON l."id" = c."listId" AND l."isArchived" = FALSE
      JOIN "boards" b ON b."id" = c."boardId" AND b."isArchived" = FALSE
      LEFT JOIN "board_members" bm ON bm."boardId" = b."id" AND bm."userId" = cm."userId"
      WHERE c."dueDate" > NOW()
        AND c."dueDate" <= NOW() + INTERVAL '24 hours'
        AND c."dueComplete" = FALSE
        AND c."isArchived" = FALSE
        AND (b."ownerId" = cm."userId" OR bm."userId" IS NOT NULL)
      ON CONFLICT ("cardId", "userId", "dueDate") DO NOTHING
    `);

    return sequelize.query<DueReminderCandidate>(`
      WITH pending AS (
        SELECT r."cardId", r."userId", r."dueDate"
        FROM "card_due_reminders" r
        JOIN "cards" c ON c."id" = r."cardId" AND c."dueDate" = r."dueDate"
        JOIN "card_members" cm ON cm."cardId" = r."cardId" AND cm."userId" = r."userId"
        JOIN "lists" l ON l."id" = c."listId" AND l."isArchived" = FALSE
        JOIN "boards" b ON b."id" = c."boardId" AND b."isArchived" = FALSE
        LEFT JOIN "board_members" bm ON bm."boardId" = b."id" AND bm."userId" = r."userId"
        WHERE r."sentAt" IS NULL
          AND (r."claimedAt" IS NULL OR r."claimedAt" < NOW() - INTERVAL '5 minutes')
          AND c."dueDate" > NOW()
          AND c."dueDate" <= NOW() + INTERVAL '24 hours'
          AND c."dueComplete" = FALSE
          AND c."isArchived" = FALSE
          AND (b."ownerId" = r."userId" OR bm."userId" IS NOT NULL)
        ORDER BY r."dueDate"
        LIMIT :limit
        FOR UPDATE OF r SKIP LOCKED
      )
      UPDATE "card_due_reminders" r SET "claimedAt" = NOW()
      FROM pending p
      WHERE r."cardId" = p."cardId" AND r."userId" = p."userId" AND r."dueDate" = p."dueDate"
      RETURNING r."cardId", r."userId", r."dueDate"
    `, { type: QueryTypes.SELECT, replacements: { limit } });
  }

  async getCurrentRecipient(candidate: DueReminderCandidate): Promise<DueReminderRecipient | null> {
    const rows = await sequelize.query<DueReminderRecipient>(`
      SELECT c."id" AS "cardId", c."boardId", cm."userId", c."dueDate", c."title" AS "cardTitle",
             b."title" AS "boardName", u."email", u."name"
      FROM "cards" c
      JOIN "card_members" cm ON cm."cardId" = c."id" AND cm."userId" = :userId
      JOIN "users" u ON u."id" = cm."userId"
      JOIN "lists" l ON l."id" = c."listId" AND l."isArchived" = FALSE
      JOIN "boards" b ON b."id" = c."boardId" AND b."isArchived" = FALSE
      LEFT JOIN "board_members" bm ON bm."boardId" = b."id" AND bm."userId" = cm."userId"
      WHERE c."id" = :cardId AND c."dueDate" = :dueDate
        AND c."dueDate" > NOW() AND c."dueComplete" = FALSE AND c."isArchived" = FALSE
        AND (b."ownerId" = cm."userId" OR bm."userId" IS NOT NULL)
      LIMIT 1
    `, {
      type: QueryTypes.SELECT,
      replacements: { cardId: candidate.cardId, userId: candidate.userId, dueDate: candidate.dueDate },
    });
    return rows[0] ?? null;
  }

  async markSent(candidate: DueReminderCandidate): Promise<void> {
    await CardDueReminder.update(
      { sentAt: new Date(), claimedAt: null },
      { where: { cardId: candidate.cardId, userId: candidate.userId, dueDate: candidate.dueDate } }
    );
  }

  async release(candidate: DueReminderCandidate): Promise<void> {
    await CardDueReminder.update(
      { claimedAt: null },
      { where: { cardId: candidate.cardId, userId: candidate.userId, dueDate: candidate.dueDate } }
    );
  }
}
