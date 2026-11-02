'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Trash2, Edit2, X } from 'lucide-react';
import { Comment } from '@/types/card-detail';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Button } from '@/components/atoms/button';
import { Textarea } from '@/components/atoms/textarea';
import { cn } from '@/lib/utils';

interface CardCommentsSectionProps {
  comments: Comment[];
  onCreateComment: (text: string) => Promise<void>;
  onUpdateComment: (commentId: string, text: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

/**
 * Molecule CardCommentsSection - Quản lý bình luận thẻ (SRS §7, BR-07)
 */
export function CardCommentsSection({
  comments,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
}: CardCommentsSectionProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmed = newText.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreateComment(trimmed);
      setNewText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (c: Comment) => {
    setEditingCommentId(c.id);
    setEditText(c.text);
  };

  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editText.trim();
    if (!trimmed || isUpdating) return;

    try {
      setIsUpdating(true);
      await onUpdateComment(commentId, trimmed);
      setEditingCommentId(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    await onDeleteComment(commentId);
    setConfirmDeleteId(null);
  };

  const currentInitial = (currentUser?.name || currentUser?.email || 'U')[0].toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-base font-semibold text-foreground">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span>Bình luận ({comments.length})</span>
      </div>

      {/* Form viết bình luận mới (SRS §7, BR-07, TC-04.2-01) */}
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8 mt-0.5">
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
            {currentInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            maxLength={4096}
            rows={2}
            placeholder="Viết bình luận..."
            className="p-2.5 whitespace-pre-wrap"
          />
          {newText.trim() && (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="h-7 text-xs"
              >
                <Send className="mr-1.5 h-3 w-3" />
                <span>{isSubmitting ? 'Đang gửi...' : 'Bình luận'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewText('')}
                disabled={isSubmitting}
                className="h-7 text-xs"
              >
                Huỷ
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Danh sách các bình luận (mới nhất xếp trước) */}
      <div className="space-y-3 pt-2">
        {comments.map((comment) => {
          const isAuthor = currentUser?.id === comment.author.id;
          const authorInitial = (comment.author.name || comment.author.email || 'U')[0].toUpperCase();
          const isEditingThis = editingCommentId === comment.id;

          return (
            <div key={comment.id} className="flex items-start space-x-3 text-xs">
              <Avatar className="h-7 w-7 mt-0.5">
                <AvatarFallback className="text-[10px] bg-muted font-bold text-muted-foreground">
                  {authorInitial}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                {/* Header bình luận: Tên tác giả, thời gian tương đối & nhãn đã sửa */}
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-foreground">
                    {comment.author.name}
                  </span>
                  <span
                    className="text-xs text-muted-foreground cursor-help"
                    title={new Date(comment.createdAt).toLocaleString('vi-VN')}
                  >
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                  {comment.editedAt && (
                    <span className="text-xs text-muted-foreground italic">
                      (đã chỉnh sửa)
                    </span>
                  )}
                </div>

                {/* Nội dung bình luận */}
                {isEditingThis ? (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      maxLength={4096}
                      rows={2}
                      className="rounded p-2 whitespace-pre-wrap"
                    />
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editText.trim() || isUpdating}
                        className="h-6 text-xs px-2.5"
                      >
                        {isUpdating ? 'Đang lưu...' : 'Lưu'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCommentId(null)}
                        className="h-6 text-xs px-2"
                      >
                        Huỷ
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/40 p-2.5 text-base text-foreground whitespace-pre-wrap leading-relaxed">
                    {comment.text}
                  </div>
                )}

                {/* Các nút hành động: Chỉ tác giả mới có quyền (BR-07, TC-04.2-03) */}
                {isAuthor && !isEditingThis && (
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(comment)}
                      className="hover:underline hover:text-foreground"
                    >
                      Chỉnh sửa
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(comment.id)}
                      className="hover:underline hover:text-destructive"
                    >
                      Xoá
                    </button>
                  </div>
                )}

                {/* Xác nhận xoá bình luận (TC-04.2-04) */}
                {confirmDeleteId === comment.id && (
                  <div className="rounded border border-destructive/30 bg-destructive/10 p-2 text-center text-xs space-y-1.5 mt-1.5 animate-in fade-in-50">
                    <p className="text-destructive font-medium text-xs">
                      Bạn có chắc muốn xoá bình luận này?
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(comment.id)}
                        className="h-6 px-2 text-xs"
                      >
                        Xoá
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-6 px-2 text-xs"
                      >
                        Huỷ
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
