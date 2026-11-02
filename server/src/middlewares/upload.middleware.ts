import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ResponseView } from '../views/response.view.js';

const ALLOWED_MIME_TYPES = new Set([
  // Định dạng ảnh hợp lệ (BR-01)
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  // Định dạng video hợp lệ (BR-01)
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
]);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB (BR-02)
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB (BR-02)

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_VIDEO_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      const error: any = new Error(
        'Định dạng tệp không được hỗ trợ. Vui lòng chỉ tải lên ảnh (PNG, JPG, WebP, GIF) hoặc video (MP4, WebM, OGG, MOV).'
      );
      error.statusCode = 422;
      cb(error);
    }
  },
}).single('file');

export function uploadAttachmentMiddleware(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return ResponseView.error(
            res,
            'FILE_TOO_LARGE',
            'Dung lượng tệp vượt quá giới hạn tối đa cho phép (100MB)',
            413
          );
        }
        return ResponseView.error(res, 'UPLOAD_ERROR', err.message, 400);
      }
      if (err.statusCode === 422) {
        return ResponseView.error(res, 'VALIDATION_ERROR', err.message, 422);
      }
      return ResponseView.error(res, 'UPLOAD_ERROR', err.message || 'Lỗi khi tải tệp lên', 400);
    }

    if (!req.file) {
      return ResponseView.error(
        res,
        'VALIDATION_ERROR',
        'Vui lòng đính kèm tệp cần tải lên trong trường `file`',
        422
      );
    }

    // Kiểm tra dung lượng riêng đối với ảnh: tối đa 10MB
    const isImage = req.file.mimetype.startsWith('image/');
    if (isImage && req.file.size > MAX_IMAGE_SIZE) {
      return ResponseView.error(
        res,
        'FILE_TOO_LARGE',
        'Dung lượng hình ảnh vượt quá giới hạn tối đa (10MB)',
        413
      );
    }

    next();
  });
}

