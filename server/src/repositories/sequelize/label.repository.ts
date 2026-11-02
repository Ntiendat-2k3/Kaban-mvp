import { ILabelRepository, LabelEntity } from '../interfaces/ILabelRepository.js';
import { Label, CardLabel } from '../../models/index.js';
import { sequelize } from '../../config/database.js';

export class SequelizeLabelRepository implements ILabelRepository {
  async createLabel(boardId: string, color: string, name = ''): Promise<LabelEntity> {
    const label = await Label.create({
      boardId,
      color: color as any,
      name,
    });

    return {
      id: label.id,
      boardId: label.boardId,
      color: label.color,
      name: label.name,
    };
  }

  async updateLabel(
    labelId: string,
    patch: { color?: string; name?: string }
  ): Promise<LabelEntity> {
    const label = await Label.findByPk(labelId);
    if (!label) {
      const error: any = new Error('Không tìm thấy nhãn');
      error.statusCode = 404;
      throw error;
    }

    if (patch.color !== undefined) {
      label.color = patch.color as any;
    }
    if (patch.name !== undefined) {
      label.name = patch.name;
    }

    await label.save();

    return {
      id: label.id,
      boardId: label.boardId,
      color: label.color,
      name: label.name,
    };
  }

  async deleteLabel(labelId: string): Promise<void> {
    const label = await Label.findByPk(labelId);
    if (!label) {
      const error: any = new Error('Không tìm thấy nhãn');
      error.statusCode = 404;
      throw error;
    }

    // Dùng transaction xoá toàn bộ liên kết card_labels trước khi xoá label (RISK-01, TC-01.2-05)
    await sequelize.transaction(async (t) => {
      await CardLabel.destroy({
        where: { labelId },
        transaction: t,
      });

      await label.destroy({ transaction: t });
    });
  }

  async addCardLabel(cardId: string, labelId: string): Promise<void> {
    // Idempotent gán nhãn
    await CardLabel.findOrCreate({
      where: { cardId, labelId },
      defaults: { cardId, labelId },
    });
  }

  async removeCardLabel(cardId: string, labelId: string): Promise<void> {
    // Idempotent gỡ nhãn
    await CardLabel.destroy({
      where: { cardId, labelId },
    });
  }

  async getBoardLabels(boardId: string): Promise<LabelEntity[]> {
    const labels = await Label.findAll({
      where: { boardId },
      order: [['createdAt', 'ASC']],
    });

    return labels.map((l) => ({
      id: l.id,
      boardId: l.boardId,
      color: l.color,
      name: l.name,
    }));
  }
}
