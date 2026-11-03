import type { Request, Response } from 'express';
import { ActivityService } from '../services/activity.service.js';
import { activityQuerySchema } from '../validations/activity.schema.js';
import { ResponseView } from '../views/response.view.js';

const service = new ActivityService();

export class ActivityController {
  static async getBoardActivities(req: Request, res: Response): Promise<void> {
    const query = activityQuerySchema.safeParse(req.query);
    if (!query.success) {
      ResponseView.validationError(res, query.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })));
      return;
    }
    try {
      const { limit, before } = query.data;
      const activities = await service.getBoardActivities(req.params.boardId, (req as any).user.id, limit, before ? new Date(before) : undefined);
      res.status(200).json(activities);
    } catch (error: any) {
      ResponseView.error(res, error.message || 'Lỗi tải nhật ký hoạt động', error.statusCode || 500);
    }
  }
}
