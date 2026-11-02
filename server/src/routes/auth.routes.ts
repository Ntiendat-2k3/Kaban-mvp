import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from '../validations/auth.schema.js';

export const authRouter = Router();

authRouter.post('/auth/register', validate(registerSchema), (req, res) => authController.register(req, res));
authRouter.post('/auth/login', validate(loginSchema), (req, res) => authController.login(req, res));
authRouter.get('/auth/me', authMiddleware, (req, res) => authController.getMe(req, res));

