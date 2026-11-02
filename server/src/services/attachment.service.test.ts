import { afterEach, describe, expect, it, vi } from 'vitest';
import { AttachmentService } from './attachment.service.js';
import { CloudinaryService } from './cloudinary.service.js';
import { Card } from '../models/index.js';
import { IAttachmentRepository } from '../repositories/interfaces/IAttachmentRepository.js';
import { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';

afterEach(() => vi.restoreAllMocks());

describe('xóa tệp đính kèm đã nhân bản', () => {
  it.each([
    { remaining: 1, shouldDeleteCloudFile: false },
    { remaining: 0, shouldDeleteCloudFile: true },
  ])('chỉ xóa tệp Cloudinary khi còn $remaining bản tham chiếu', async ({ remaining, shouldDeleteCloudFile }) => {
    vi.spyOn(Card, 'findByPk').mockResolvedValue({ boardId: 'board', isArchived: false } as Card);
    const deleteCloudFile = vi.spyOn(CloudinaryService, 'deleteFile').mockResolvedValue();
    const deleteAttachment = vi.fn().mockResolvedValue(true);
    const attachmentRepo = {
      findById: vi.fn().mockResolvedValue({
        id: 'attachment',
        cardId: 'card',
        publicId: 'shared-file',
        fileType: 'image',
      }),
      deleteAttachment,
      countByPublicId: vi.fn().mockResolvedValue(remaining),
    } as unknown as IAttachmentRepository;
    const boardRepo = {
      getUserRole: vi.fn().mockResolvedValue('owner'),
    } as unknown as IBoardRepository;

    await new AttachmentService(attachmentRepo, boardRepo).deleteAttachment('user', 'card', 'attachment');

    expect(deleteAttachment).toHaveBeenCalledWith('attachment');
    expect(deleteCloudFile).toHaveBeenCalledTimes(shouldDeleteCloudFile ? 1 : 0);
  });
});

describe('nhân bản tệp đính kèm', () => {
  it('giữ tệp gốc nhưng không thay bìa hiện tại', async () => {
    vi.spyOn(Card, 'findByPk').mockResolvedValue({ boardId: 'board', isArchived: false } as Card);
    const createAttachment = vi.fn().mockResolvedValue({ id: 'copy' });
    const attachmentRepo = {
      findById: vi.fn().mockResolvedValue({
        id: 'attachment',
        cardId: 'card',
        boardId: 'board',
        fileName: 'video.mp4',
        fileUrl: 'https://example.com/video.mp4',
        fileType: 'video',
        mimeType: 'video/mp4',
        publicId: 'shared-file',
        size: 1024,
        isCover: true,
      }),
      createAttachment,
    } as unknown as IAttachmentRepository;
    const boardRepo = { getUserRole: vi.fn().mockResolvedValue('owner') } as unknown as IBoardRepository;

    await new AttachmentService(attachmentRepo, boardRepo).duplicateAttachment('user', 'card', 'attachment');

    expect(createAttachment).toHaveBeenCalledWith(expect.objectContaining({
      fileUrl: 'https://example.com/video.mp4',
      publicId: 'shared-file',
      isCover: false,
    }));
  });
});
