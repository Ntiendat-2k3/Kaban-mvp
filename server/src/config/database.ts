import { Sequelize } from 'sequelize';
import { ENV } from './env.js';

/**
 * Cấu hình kết nối PostgreSQL qua Sequelize
 */
export const sequelize = new Sequelize(ENV.DATABASE_URL, {
  dialect: 'postgres',
  logging: ENV.NODE_ENV === 'development' ? false : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối PostgreSQL thành công!');
  } catch (error) {
    console.error('❌ Không thể kết nối tới PostgreSQL:', error);
    process.exit(1);
  }
}

