import { app } from './app.js';
import { ENV } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { syncDatabase } from './models/index.js';
import { runMigrations } from './config/migrations.js';
import { createServer } from 'http';
import { initSocket } from './realtime/socket.js';
import { startDueReminderWorker } from './services/due-reminder.service.js';

async function bootstrap() {
  if (!ENV.JWT_SECRET || !ENV.DATABASE_URL) {
    throw new Error('Thiếu JWT_SECRET hoặc DATABASE_URL trong biến môi trường của server.');
  }
  await connectDatabase();
  await syncDatabase(false);
  await runMigrations();
  startDueReminderWorker();

  const httpServer = createServer(app);
  initSocket(httpServer);
  httpServer.listen(ENV.PORT, () => {
    console.log(`🚀 Kaban Server đang chạy tại http://localhost:${ENV.PORT}`);
    console.log(`📡 API tiền tố: http://localhost:${ENV.PORT}/api`);
  });
}

bootstrap().catch((err) => {
  console.error('Lỗi khởi động server:', err);
  process.exit(1);
});

