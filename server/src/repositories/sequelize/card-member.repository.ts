import { ICardMemberRepository } from '../interfaces/ICardMemberRepository.js';
import { CardMember } from '../../models/index.js';

export class SequelizeCardMemberRepository implements ICardMemberRepository {
  async addCardMember(cardId: string, userId: string): Promise<void> {
    // Idempotent gán thành viên thẻ
    await CardMember.findOrCreate({
      where: { cardId, userId },
      defaults: { cardId, userId },
    });
  }

  async removeCardMember(cardId: string, userId: string): Promise<void> {
    // Idempotent gỡ thành viên thẻ
    await CardMember.destroy({
      where: { cardId, userId },
    });
  }

  async isCardMember(cardId: string, userId: string): Promise<boolean> {
    const count = await CardMember.count({
      where: { cardId, userId },
    });
    return count > 0;
  }
}
