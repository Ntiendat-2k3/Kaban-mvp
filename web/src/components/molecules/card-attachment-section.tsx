'use client';

import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Paperclip, Plus, Trash2, Image as ImageIcon, Video, Star, ExternalLink, Copy, Files, Link2, MoreHorizontal } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Spinner } from '@/components/atoms/spinner';
import { Dialog, DialogContent, DialogTitle } from '@/components/atoms/dialog';
import { Attachment } from '@/types/attachment';
import { cn } from '@/lib/utils';

export interface CardAttachmentSectionProps {
  cardId: string;
  attachments: Attachment[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
  onDuplicate?: (attachmentId: string) => Promise<void>;
  onToggleCover: (attachmentId: string, currentIsCover: boolean) => Promise<void>;
  isUploading?: boolean;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB (BR-02)
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB (BR-02)

/**
 * Molecule CardAttachmentSection - Quản lý tệp đính kèm ảnh và video trong CardDetailModal (REQ-ATT-01, REQ-ATT-02)
 */
export function CardAttachmentSection({
  cardId,
  attachments = [],
  onUpload,
  onDelete,
  onDuplicate,
  onToggleCover,
  isUploading = false,
}: CardAttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isTogglingCoverId, setIsTogglingCoverId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [menuAttachmentId, setMenuAttachmentId] = useState<string | null>(null);
  const [isDuplicatingId, setIsDuplicatingId] = useState<string | null>(null);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã sao chép ${label}.`);
    } catch {
      toast.error('Không thể sao chép. Vui lòng thử lại.');
    }
  };

  const handleDuplicate = async (attachmentId: string) => {
    if (!onDuplicate || isDuplicatingId) return;
    try {
      setIsDuplicatingId(attachmentId);
      await onDuplicate(attachmentId);
      toast.success('Đã nhân bản tệp đính kèm.');
    } catch {
      toast.error('Không thể nhân bản tệp đính kèm. Vui lòng thử lại.');
    } finally {
      setIsDuplicatingId(null);
    }
  };

  const handleAttachmentKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, attachment: Attachment) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, video, [contenteditable]')) return;

    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      setMenuAttachmentId(attachment.id);
    } else if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'c') {
      if (window.getSelection()?.toString()) return;
      event.preventDefault();
      void copyText(attachment.fileUrl, 'liên kết tệp');
    } else if (onDuplicate && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      void handleDuplicate(attachment.id);
    } else if (event.key === 'Delete') {
      event.preventDefault();
      void handleDelete(attachment.id);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input để có thể chọn lại cùng một file
    e.target.value = '';

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Kiểm tra định dạng cho phép (BR-01, TC-02.1-02)
    if (!isImage && !isVideo) {
      toast.error(
        'Định dạng tệp không được hỗ trợ. Vui lòng chỉ tải lên ảnh (PNG, JPG, WebP, GIF) hoặc video (MP4, WebM, OGG, MOV).'
      );
      return;
    }

    // Kiểm tra dung lượng tệp (BR-02, TC-02.1-03)
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      toast.error('Dung lượng hình ảnh vượt quá giới hạn tối đa (10MB).');
      return;
    }
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      toast.error('Dung lượng video vượt quá giới hạn tối đa (100MB).');
      return;
    }

    try {
      await onUpload(file);
      toast.success('Đã tải lên tệp đính kèm.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Lỗi khi tải lên tệp đính kèm.');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá tệp đính kèm này không?')) return;
    try {
      setIsDeletingId(attachmentId);
      await onDelete(attachmentId);
      toast.success('Đã xoá tệp đính kèm.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Lỗi khi xoá tệp đính kèm.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleToggleCover = async (attachmentId: string, currentIsCover: boolean) => {
    try {
      setIsTogglingCoverId(attachmentId);
      await onToggleCover(attachmentId, currentIsCover);
      toast.success(currentIsCover ? 'Đã gỡ ảnh bìa.' : 'Đã đặt ảnh bìa.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Lỗi khi thay đổi ảnh bìa.');
    } finally {
      setIsTogglingCoverId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tiêu đề mục đính kèm */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-foreground">
          <Paperclip className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Tệp đính kèm</h3>
          {attachments.length > 0 && (
            <span className="text-xs text-muted-foreground">({attachments.length})</span>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1.5 text-xs"
        >
          {isUploading ? (
            <>
              <Spinner size="sm" />
              <span>Đang tải lên...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Thêm tệp</span>
            </>
          )}
        </Button>

        {/* Input tệp ẩn */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Danh sách tệp đính kèm */}
      {attachments.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Paperclip className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">Chưa có tệp đính kèm</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Bấm vào đây để tải lên hình ảnh (tối đa 10MB) hoặc video (tối đa 100MB) lưu trữ trên Cloudinary
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {attachments.map((att) => {
            const isCover = att.isCover;
            const isDeleting = isDeletingId === att.id;
            const isDuplicating = isDuplicatingId === att.id;
            const isToggling = isTogglingCoverId === att.id;

            return (
              <DropdownMenu.Root
                key={att.id}
                open={menuAttachmentId === att.id}
                onOpenChange={(open) => setMenuAttachmentId(open ? att.id : null)}
              >
                <div
                  tabIndex={0}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setMenuAttachmentId(att.id);
                  }}
                  onKeyDownCapture={(event) => handleAttachmentKeyDown(event, att)}
                  className={cn(
                    'group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isCover && 'border-primary/40 bg-primary/5'
                  )}
                >
                  {/* Khung xem trước ảnh hoặc video */}
                  <div className="flex w-full min-w-0 flex-1 items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(att)}
                      aria-label={`Xem tệp ${att.fileName}`}
                      className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {att.fileType === 'video' ? (
                        <video
                          src={att.fileUrl}
                          preload="metadata"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={att.fileUrl}
                          alt={att.fileName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </button>

                    {/* Thông tin tệp */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex min-w-0 items-center space-x-2">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block min-w-0 flex-1 truncate text-sm font-semibold text-foreground hover:underline"
                          title={att.fileName}
                        >
                          {att.fileName}
                        </a>
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          aria-label={`Mở tệp gốc ${att.fileName}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{formatDate(att.createdAt)}</span>
                        <span>•</span>
                        <span>{formatFileSize(att.size)}</span>
                        <Badge variant="outline" className="uppercase py-0 px-1">
                          {att.fileType === 'video' ? (
                            <span className="flex items-center space-x-0.5">
                              <Video className="h-2.5 w-2.5 mr-0.5" />
                              <span>Video</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-0.5">
                              <ImageIcon className="h-2.5 w-2.5 mr-0.5" />
                              <span>Ảnh</span>
                            </span>
                          )}
                        </Badge>

                        {isCover && (
                          <Badge variant="default" className="py-0 px-1.5 bg-primary text-primary-foreground">
                            <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                            <span>Bìa</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Các nút thao tác */}
                  <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                    <DropdownMenu.Trigger asChild>
                      <Button type="button" size="sm" variant="ghost" aria-label={`Thao tác với tệp ${att.fileName}`} className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenu.Trigger>
                    <Button
                      type="button"
                      size="sm"
                      variant={isCover ? 'secondary' : 'outline'}
                      disabled={isToggling}
                      onClick={() => handleToggleCover(att.id, isCover)}
                      className="h-8 text-xs"
                    >
                      {isToggling ? (
                        <Spinner size="sm" />
                      ) : isCover ? (
                        <span>Gỡ bìa</span>
                      ) : (
                        <span>Đặt làm bìa</span>
                      )}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isDeleting}
                      onClick={() => handleDelete(att.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      title="Xoá tệp đính kèm"
                    >
                      {isDeleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="z-[70] min-w-[220px] rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-xl outline-none"
                  >
                    <DropdownMenu.Item
                      onSelect={() => void copyText(att.fileUrl, 'liên kết tệp')}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 outline-none focus:bg-accent"
                    >
                      <Link2 className="h-4 w-4" /> Sao chép liên kết
                      <span className="ml-auto text-xs text-muted-foreground">Ctrl+C</span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => void copyText(att.fileName, 'tên tệp')}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 outline-none focus:bg-accent"
                    >
                      <Copy className="h-4 w-4" /> Sao chép tên tệp
                    </DropdownMenu.Item>
                    {onDuplicate && (
                      <DropdownMenu.Item
                        disabled={isDuplicating}
                        onSelect={() => void handleDuplicate(att.id)}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 outline-none focus:bg-accent data-[disabled]:opacity-50"
                      >
                        <Files className="h-4 w-4" /> Nhân bản tệp
                        <span className="ml-auto text-xs text-muted-foreground">Ctrl+D</span>
                      </DropdownMenu.Item>
                    )}
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                      onSelect={() => void handleDelete(att.id)}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-destructive outline-none focus:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" /> Xóa tệp
                      <span className="ml-auto text-xs">Delete</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            );
          })}
        </div>
      )}

      <Dialog open={!!previewAttachment} onOpenChange={(open) => !open && setPreviewAttachment(null)}>
        <DialogContent className="w-[95vw] max-w-6xl gap-3 p-4">
          <DialogTitle className="min-w-0 truncate pr-8 text-base" title={previewAttachment?.fileName}>
            {previewAttachment?.fileName}
          </DialogTitle>
          {previewAttachment?.fileType === 'video' ? (
            <video
              key={previewAttachment.id}
              src={previewAttachment.fileUrl}
              controls
              playsInline
              preload="metadata"
              className="max-h-[80vh] w-full bg-black object-contain fullscreen:h-screen fullscreen:max-h-none fullscreen:w-screen fullscreen:object-contain"
            />
          ) : previewAttachment ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewAttachment.fileUrl}
              alt={previewAttachment.fileName}
              className="max-h-[80vh] w-full object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
