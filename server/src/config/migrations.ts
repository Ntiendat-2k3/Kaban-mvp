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
