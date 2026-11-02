'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus, LogOut, Shield, ShieldCheck, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/atoms/dialog';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Badge } from '@/components/atoms/badge';
import { Spinner } from '@/components/atoms/spinner';
import { Board } from '@/types/board';
import { getBoardMembers, addBoardMember, removeBoardMember } from '@/lib/api/boards';
import { useAuthStore } from '@/lib/store/use-auth-store';

interface BoardMembersDialogProps {
  board: Board;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Organism BoardMembersDialog - Quản lý thành viên bảng làm việc
 * Hỗ trợ liệt kê, mời bằng email, xoá thành viên và tự rời bảng (SRS §6, §7)
 */
export function BoardMembersDialog({ board, open, onOpenChange }: BoardMembersDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Lấy danh sách thành viên từ server
  const {
    data: members = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['board-members', board.id],
    queryFn: () => getBoardMembers(board.id),
    enabled: open,
  });

  // Mutation mời thành viên mới
  const inviteMutation = useMutation({
    mutationFn: (emailToInvite: string) => addBoardMember(board.id, emailToInvite),
    onSuccess: () => {
      setEmail('');
      setInviteError(null);
      queryClient.invalidateQueries({ queryKey: ['board-members', board.id] });
    },
    onError: (err: any) => {
      // Phân tách lỗi rõ ràng theo SRS §6 (Không tìm thấy người dùng / Người dùng đã là thành viên)
      const message =
        err?.response?.data?.error || err?.message || 'Không thể thêm thành viên vào bảng';
      setInviteError(message);
    },
  });

  // Mutation xoá thành viên hoặc rời bảng
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeBoardMember(board.id, userId),
    onSuccess: (data, targetUserId) => {
      // Nếu chính người dùng hiện tại rời bảng: chuyển hướng về /boards (BR-08)
      if (currentUser && targetUserId === currentUser.id) {
        onOpenChange(false);
        router.push('/boards');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['board-members', board.id] });
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setInviteError(null);
    inviteMutation.mutate(trimmed);
  };

  const isOwner = board.role === 'owner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Thành viên bảng</DialogTitle>
          <DialogDescription>
            Quản lý những người có quyền truy cập và cộng tác trong không gian làm việc này.
          </DialogDescription>
        </DialogHeader>

        {/* Form mời thành viên bằng email (chỉ dành cho Owner - SRS §6) */}
        {isOwner && (
          <form onSubmit={handleInviteSubmit} className="space-y-2 pt-2">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Nhập email người dùng..."
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (inviteError) setInviteError(null);
                  }}
                  disabled={inviteMutation.isPending}
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={!email.trim() || inviteMutation.isPending}>
                {inviteMutation.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    <span>Mời</span>
                  </>
                )}
              </Button>
            </div>

            {inviteError && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {inviteError}
              </p>
            )}
          </form>
        )}

        {/* Danh sách thành viên (SRS §6) */}
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Danh sách thành viên ({members.length})
          </p>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="max-h-[280px] divide-y overflow-y-auto pr-1">
              {members.map((member) => {
                const isMemberOwner = member.role === 'owner';
                const isSelf = currentUser?.id === member.userId;
                const initialChar = member.name
                  ? member.name.charAt(0).toUpperCase()
                  : member.email.charAt(0).toUpperCase();

                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {initialChar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-medium text-foreground leading-tight">
                            {member.name}
                          </span>
                          {isSelf && (
                            <span className="text-xs text-muted-foreground">(bạn)</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isMemberOwner ? (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <ShieldCheck className="h-3 w-3 text-primary" />
                          <span>Chủ sở hữu</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <span>Thành viên</span>
                        </Badge>
                      )}

                      {/* Owner xoá member khác (không được xoá chính mình - BR-08) */}
                      {isOwner && !isMemberOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Xoá ${member.name}`}
                          onClick={() => removeMutation.mutate(member.userId)}
                          disabled={removeMutation.isPending}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Member tự rời khỏi bảng (SRS §6, BR-08) */}
        {!isOwner && (
          <div className="border-t pt-3">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (currentUser) {
                  removeMutation.mutate(currentUser.id);
                }
              }}
              disabled={removeMutation.isPending}
              className="w-full flex items-center justify-center space-x-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Rời khỏi bảng</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
