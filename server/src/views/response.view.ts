import { Response } from 'express';

export interface ErrorDetail {
  field?: string;
  message: string;
}

export class ResponseView {
  public static success<T>(res: Response, data: T, statusCode = 200): Response {
    return res.status(statusCode).json(data);
  }

  public static created<T>(res: Response, data: T): Response {
    return res.status(201).json(data);
  }

  public static noContent(res: Response): Response {
    return res.status(204).send();
  }

  public static error(res: Response, message: string, statusCode: number): Response;
  public static error(res: Response, code: string, message: string, statusCode?: number, details?: ErrorDetail[]): Response;
  public static error(
    res: Response,
    codeOrMessage: string,
    messageOrStatus: string | number,
    statusCode = 400,
    details?: ErrorDetail[]
  ): Response {
    const isShortForm = typeof messageOrStatus === 'number';
    const status = isShortForm ? messageOrStatus : statusCode;
    const code = isShortForm
      ? ({ 400: 'BAD_REQUEST', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 422: 'VALIDATION_ERROR', 424: 'FAILED_DEPENDENCY', 500: 'INTERNAL_ERROR' } as Record<number, string>)[status] || 'ERROR'
      : codeOrMessage;
    const message = status >= 500 ? 'Lỗi máy chủ. Vui lòng thử lại sau.' : isShortForm ? codeOrMessage : messageOrStatus;
    return res.status(status).json({
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
    });
  }

  public static unauthorized(res: Response, message = 'Yêu cầu đăng nhập hoặc token không hợp lệ'): Response {
    return this.error(res, 'UNAUTHORIZED', message, 401);
  }

  public static forbidden(res: Response, message = 'Bạn không có quyền thực hiện hành động này'): Response {
    return this.error(res, 'FORBIDDEN', message, 403);
  }

  public static notFound(res: Response, message = 'Tài nguyên không tồn tại'): Response {
    return this.error(res, 'NOT_FOUND', message, 404);
  }

  public static conflict(res: Response, code = 'CONFLICT', message = 'Dữ liệu xung đột'): Response {
    return this.error(res, code, message, 409);
  }

  public static validationError(res: Response, details: ErrorDetail[]): Response {
    return this.error(res, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', 422, details);
  }
}

