import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { apiRouter } from './routes/index.js';

export const app = express();

// Chỉ tin proxy khi triển khai sau reverse proxy được cấu hình rõ ràng.
if (ENV.TRUST_PROXY) app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const rateLimitHeaders = { standardHeaders: 'draft-7' as const, legacyHeaders: false };
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  ...rateLimitHeaders,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' } },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, ...rateLimitHeaders }));

// Gắn toàn bộ router tiền tố /api theo đúng openapi.yaml
app.use('/api', apiRouter);

// Fallback 404 cho các route không tồn tại
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Đường dẫn ${req.method} ${req.originalUrl} không tồn tại`,
    },
  });
});

