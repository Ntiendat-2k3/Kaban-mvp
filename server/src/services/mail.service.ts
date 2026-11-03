import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

export function isMailConfigured(): boolean {
  return Boolean(ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS && ENV.MAIL_FROM);
}

const transport = isMailConfigured()
  ? nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_PORT === 465,
      requireTLS: ENV.SMTP_PORT !== 465,
      auth: { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS },
      pool: true,
      maxConnections: 2,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    })
  : null;

/** Một đầu mối SMTP cho thư mời và thư nhắc hạn; không ghi khóa hoặc nội dung thư vào log. */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!transport) throw new Error('Chưa cấu hình SMTP để gửi email');
  if (ENV.SMTP_HOST.toLowerCase().includes('brevo.com') && ENV.MAIL_FROM.toLowerCase().includes('@smtp-brevo.com')) {
    throw Object.assign(new Error('Địa chỉ gửi Brevo không hợp lệ'), { code: 'INVALID_SENDER' });
  }
  await transport.sendMail({ from: ENV.MAIL_FROM, to, subject, text });
}
