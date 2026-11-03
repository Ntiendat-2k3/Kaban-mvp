import type { ActivityInput, IActivityRepository } from '../repositories/interfaces/IActivityRepository.js';
import { SequelizeActivityRepository } from '../repositories/sequelize/activity.repository.js';
import { SequelizeBoardRepository } from '../repositories/sequelize/board.repository.js';
import type { IBoardRepository } from '../repositories/interfaces/IBoardRepository.js';

const activityRepo = new SequelizeActivityRepository();

/** Nhật ký không được làm hỏng thao tác chính khi việc ghi thất bại. */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await activityRepo.create(input);
  } catch (error) {
    console.error('Lỗi ghi nhật ký hoạt động:', error);
  }
}

export class ActivityService {
  constructor(
    private repo: IActivityRepository = activityRepo,
    private boardRepo: IBoardRepository = new SequelizeBoardRepository()
  ) {}

  async getBoardActivities(boardId: string, userId: string, limit: number, before?: Date) {
    if (!await this.boardRepo.getUserRole(boardId, userId)) {
      const error: any = new Error('Không tìm thấy bảng');
      error.statusCode = 404;
      throw error;
    }
    return this.repo.findByBoard(boardId, limit, before);
  }
}
