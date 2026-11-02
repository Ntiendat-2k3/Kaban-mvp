export interface ICardMemberRepository {
  addCardMember(cardId: string, userId: string): Promise<void>;
  removeCardMember(cardId: string, userId: string): Promise<void>;
  isCardMember(cardId: string, userId: string): Promise<boolean>;
}
