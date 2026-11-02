import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { boardRouter } from './board.routes.js';
import { listRouter } from './list.routes.js';
import { cardRouter } from './card.routes.js';
import { labelRouter } from './label.routes.js';
import { checklistRouter } from './checklist.routes.js';
import { commentRouter } from './comment.routes.js';
import { attachmentRouter } from './attachment.routes.js';

export const apiRouter = Router();

apiRouter.use(authRouter);
apiRouter.use(boardRouter);
apiRouter.use(listRouter);
apiRouter.use(cardRouter);
apiRouter.use(labelRouter);
apiRouter.use(checklistRouter);
apiRouter.use(commentRouter);
apiRouter.use(attachmentRouter);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
