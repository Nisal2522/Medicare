import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? '587');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP configured (${host}:${port})`);
    } else {
      this.logger.warn(
        'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS). Emails will be logged only.',
      );
    }
  }

  async sendHtml(to: string, subject: string, html: string): Promise<void> {
    const from =
      this.config.get<string>('SMTP_FROM') ??
      this.config.get<string>('SMTP_USER') ??
      'no-reply@medismart.local';

    if (!to?.trim()) {
      this.logger.warn(`Skip email (no address): ${subject}`);
      return;
    }

    if (!this.transporter) {
      this.logger.log(
        `[EMAIL DEMO] To: ${to} | ${subject}\n${html.replace(/<[^>]+>/g, ' ').slice(0, 400)}…`,
      );
      return;
    }

    await this.transporter.sendMail({
      from,
      to: to.trim(),
      subject,
      html,
    });
    this.logger.log(`Email sent to ${to}: ${subject}`);
  }
}
