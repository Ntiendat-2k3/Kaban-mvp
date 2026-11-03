import { ENV } from '../config/env.js';
import type { DueReminderRecipient, IDueReminderRepository } from '../repositories/interfaces/IDueReminderRepository.js';
import { SequelizeDueReminderRepository } from '../repositories/sequelize/due-reminder.repository.js';
import { isMailConfigured, sendEmail } from './mail.service.js';

const POLL_INTERVAL_MS = 60_000;
const BATCH_SIZE = 5;

/** Gửi riêng từng người được gán, không đưa thành viên bảng khác vào To/Cc/Bcc. */
export async function sendDueReminderEmail(recipient: DueReminderRecipient): Promise<void> {
  const dueDate = new Intl.DateTimeFormat('vi-VN', {
    timeZone: ENV.MAIL_TIME_ZONE,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(recipient.dueDate));
  const cardUrl = new URL(
    `/b/${encodeURIComponent(recipient.boardId)}/c/${encodeURIComponent(recipient.cardId)}`,
    ENV.APP_URL
  );

  await sendEmail(
    recipient.email,
    `Thẻ sắp hết hạn: ${recipient.cardTitle}`,
    `Chào ${recipient.name},\n\nThẻ "${recipient.cardTitle}" trong bảng "${recipient.boardName}" sẽ hết hạn lúc ${dueDate}.\n\nMở thẻ: ${cardUrl.toString()}\n\nBạn nhận email này vì đang được gán vào thẻ.`
  );
}

/**
 * Mỗi lượt lấy tối đa một lô nhắc hạn trong 24 giờ tới. Repository giữ khóa nhận việc;
 * ngay trước khi gửi vẫn kiểm tra lại hạn, trạng thái và quyền thành viên thẻ.
 */
export class DueReminderService {
  constructor(
    private readonly repository: IDueReminderRepository = new SequelizeDueReminderRepository(),
    private readonly sendMail: (recipient: DueReminderRecipient) => Promise<void> = sendDueReminderEmail
  ) {}

  async runOnce(): Promise<void> {
    const candidates = await this.repository.claimDue(BATCH_SIZE);
    for (const candidate of candidates) {
      try {
        const recipient = await this.repository.getCurrentRecipient(candidate);
        if (!recipient) {
          await this.repository.release(candidate);
          continue;
        }
        await this.sendMail(recipient);
        await this.repository.markSent(candidate);
      } catch (error) {
        console.error('Không thể gửi email nhắc hạn thẻ:', error);
        // Giữ lượt nhận việc trong 5 phút để tránh gửi lại liên tục khi SMTP gặp lỗi.
      }
    }
  }
}

/** Chỉ chạy trong tiến trình server sau khi cơ sở dữ liệu đã sẵn sàng. */
export function startDueReminderWorker(): void {
  if (!isMailConfigured()) {
    console.warn('Chưa cấu hình SMTP; email nhắc hạn thẻ đang tắt.');
    return;
  }

  const service = new DueReminderService();
  let running = false;
  const poll = async () => {
    if (running) return;
    running = true;
    try {
      await service.runOnce();
    } catch (error) {
      console.error('Lỗi quét email nhắc hạn thẻ:', error);
    } finally {
      running = false;
    }
  };
  void poll();
  setInterval(() => void poll(), POLL_INTERVAL_MS).unref();
}
