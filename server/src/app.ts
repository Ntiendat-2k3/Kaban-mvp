import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json());

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

