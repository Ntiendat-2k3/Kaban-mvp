'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

/** Đồng bộ bảng sau thay đổi từ người khác; hoãn tải lại khi đang kéo thẻ. */
export function useBoardRealtime(boardId: string, myUserId: string | undefined, isDragging: boolean): void {
  const queryClient = useQueryClient();
  const draggingRef = useRef(isDragging);
  const pendingRef = useRef(false);
  useEffect(() => {
    draggingRef.current = isDragging;
    if (!isDragging && pendingRef.current) {
      pendingRef.current = false;
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    }
  }, [isDragging, boardId, queryClient]);

  useEffect(() => {
    const token = localStorage.getItem('trello.token');
    if (!token) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000', { auth: { token } });
    socket.on('connect', () => socket.emit('board:join', boardId));
    socket.on('board:changed', (event: { actorId: string }) => {
      if (event.actorId === myUserId) return;
      if (draggingRef.current) pendingRef.current = true;
      else queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    });
    return () => { socket.emit('board:leave', boardId); socket.disconnect(); };
  }, [boardId, myUserId, queryClient]);
}
