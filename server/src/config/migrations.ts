import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

/**
 * Bổ sung cột cho cơ sở dữ liệu đã tồn tại; sync(false) chỉ tạo bảng mới.
 * Mỗi bản nâng cấp chạy một lần trong giao dịch và không xoá dữ liệu cũ.
 */
const migrations = [
  {
    name: '20261102_card_due_and_comment_edit',
    statements: [
      'ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "dueComplete" BOOLEAN NOT NULL DEFAULT FALSE',
      'ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMPTZ NULL',
    ],
  },
  {
    name: '20261103_fractional_positions',
    statements: [
      'ALTER TABLE "cards" ALTER COLUMN "position" TYPE DOUBLE PRECISION',
      'ALTER TABLE "lists" ALTER COLUMN "position" TYPE DOUBLE PRECISION',
    ],
  },
  {
    name: '20261103_list_wip_limit',
    statements: ['ALTER TABLE "lists" ADD COLUMN IF NOT EXISTS "wipLimit" INTEGER NULL'],
  },
  {
    name: '20261103_list_color',
    statements: ['ALTER TABLE "lists" ADD COLUMN IF NOT EXISTS "color" VARCHAR(16) NULL'],
  },
  {
    name: '20261103_activity_indexes',
    statements: [
      'CREATE INDEX IF NOT EXISTS "activities_board_created_idx" ON "activities" ("boardId", "createdAt" DESC)',
      'CREATE INDEX IF NOT EXISTS "activities_card_created_idx" ON "activities" ("cardId", "createdAt" DESC)',
    ],
  },
  {
    name: '20261103_card_due_reminder_lookup',
    statements: [
      'CREATE INDEX IF NOT EXISTS "cards_due_reminder_idx" ON "cards" ("dueDate") WHERE "dueDate" IS NOT NULL AND "isArchived" = FALSE AND "dueComplete" = FALSE',
    ],
  },
];

export async function runMigrations(): Promise<void> {
  await sequelize.transaction(async (transaction) => {
    await sequelize.query(
      'CREATE TABLE IF NOT EXISTS "schema_migrations" ("name" TEXT PRIMARY KEY, "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())',
      { transaction }
    );
    await sequelize.query('SELECT pg_advisory_xact_lock(68114002)', { transaction });
    const applied = await sequelize.query<{ name: string }>(
      'SELECT "name" FROM "schema_migrations"',
      { type: QueryTypes.SELECT, transaction }
    );
    const appliedNames = new Set(applied.map((row) => row.name));

    for (const migration of migrations) {
      if (appliedNames.has(migration.name)) continue;
      for (const statement of migration.statements) {
        await sequelize.query(statement, { transaction });
      }
      await sequelize.query(
        'INSERT INTO "schema_migrations" ("name") VALUES (:name)',
        { replacements: { name: migration.name }, transaction }
      );
    }
  });
}
