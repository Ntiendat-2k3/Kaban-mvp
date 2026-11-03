import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { SequelizeBoardRepository } from '../repositories/sequelize/board.repository.js';

let io: Server | undefined;
const boardRepo = new SequelizeBoardRepository();

export interface BoardChangedPayload {
  type: string;
  actorId: string;
  cardId?: string;
}

/** Xác thực kết nối và chỉ cho thành viên tham gia phòng của bảng. */
export function initSocket(httpServer: HttpServer): void {
  io = new Server(httpServer, { cors: { origin: ENV.CORS_ORIGIN, credentials: true } });
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') throw new Error('Thiếu token');
      const user = jwt.verify(token, ENV.JWT_SECRET) as { id?: string };
      if (!user.id) throw new Error('Token không hợp lệ');
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });
  io.on('connection', (socket) => {
    socket.on('board:join', async (boardId: unknown) => {
      if (typeof boardId !== 'string') return;
      try {
        if (await boardRepo.getUserRole(boardId, socket.data.userId)) socket.join(`board:${boardId}`);
      } catch (error) {
        console.error('Lỗi tham gia phòng bảng:', error);
      }
    });
    socket.on('board:leave', (boardId: unknown) => {
      if (typeof boardId === 'string') socket.leave(`board:${boardId}`);
    });
  });
}

/** Phát tín hiệu sau khi thao tác đã lưu; an toàn khi chạy service không có socket. */
export function emitBoardChanged(boardId: string, payload: BoardChangedPayload): void {
  io?.to(`board:${boardId}`).emit('board:changed', payload);
}

export async function removeBoardMemberSocket(boardId: string, userId: string): Promise<void> {
  try {
    const sockets = await io?.in(`board:${boardId}`).fetchSockets();
    for (const socket of sockets ?? []) if (socket.data.userId === userId) await socket.leave(`board:${boardId}`);
  } catch (error) {
    console.error('Lỗi thu hồi phòng bảng:', error);
  }
}
