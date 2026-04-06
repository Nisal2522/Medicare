import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import * as amqp from 'amqplib';
import { MailService } from './mail.service';
import { SmsService } from './sms.service';

type QueueMessage = {
  email?: string;
  subject?: string;
  message?: string;
  phoneNumber?: string;
  doctorName?: string;
  patientName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

const QUEUE = 'notification_queue';

@Injectable()
export class NotificationQueueConsumer
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationQueueConsumer.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const url =
      this.config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(QUEUE, { durable: true });
      await this.channel.consume(
        QUEUE,
        (msg) => void this.handleMessage(msg),
        { noAck: false },
      );
      this.logger.log(`Listening to RabbitMQ queue "${QUEUE}"`);
    } catch (e) {
      this.logger.error(`Failed to consume "${QUEUE}": ${String(e)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.connection?.close();
    } catch {
      /* ignore */
    }
  }

  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) return;
    try {
      const raw = msg.content.toString('utf8');
      const parsed = JSON.parse(raw) as QueueMessage;
      const email = parsed.email?.trim();
      const subject = (parsed.subject?.trim() || 'MediSmart notification').slice(
        0,
        180,
      );
      const message = (parsed.message?.trim() || '').slice(0, 5000);

      if (!email || !message) {
        this.logger.warn(
          `Invalid notification payload. email/message missing: ${raw.slice(0, 300)}`,
        );
        this.channel.ack(msg);
        return;
      }

      const html = this.wrapHtml({
        subject,
        bodyText: message,
        doctorName: parsed.doctorName,
        patientName: parsed.patientName,
        appointmentDate: parsed.appointmentDate,
        appointmentTime: parsed.appointmentTime,
        ctaLabel: parsed.ctaLabel,
        ctaUrl: parsed.ctaUrl,
      });
      await this.mail.sendHtml(email, subject, html);

      if (parsed.phoneNumber?.trim()) {
        await this.sms.send(parsed.phoneNumber, message);
      }

      this.logger.log(`Notification sent successfully to ${email}`);
      this.channel.ack(msg);
    } catch (e) {
      this.logger.error(`Queue message handling failed: ${String(e)}`);
      // Ack to avoid poison-message crash loops.
      this.channel.ack(msg);
    }
  }

  private wrapHtml(params: {
    subject: string;
    bodyText: string;
    doctorName?: string;
    patientName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  }): string {
    const ctaLabel = (params.ctaLabel?.trim() || 'View Dashboard').slice(0, 40);
    const ctaUrl =
      params.ctaUrl?.trim() || 'http://localhost:5173/dashboard/patient';
    const doctor = params.doctorName?.trim() || 'Assigned Doctor';
    const patient = params.patientName?.trim() || 'Patient';
    const date = params.appointmentDate?.trim() || 'TBD';
    const time = params.appointmentTime?.trim() || 'TBD';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${this.esc(params.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;padding:20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#0ea5e9,#14b8a6);padding:18px 22px;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="font-size:22px;font-weight:800;color:#ffffff;">MediSmart AI</td>
                  <td align="right" style="color:#e0f2fe;font-size:12px;">[ LOGO ]</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 22px 8px;">
              <h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;color:#0f172a;">${this.esc(params.subject)}</h1>
              <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;white-space:pre-wrap;">${this.esc(params.bodyText)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 22px 8px;">
              <div style="border:1px solid #bfdbfe;background:#f8fbff;border-radius:12px;padding:16px;">
                <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0f172a;">Appointment Details</p>
                <p style="margin:2px 0;font-size:13px;color:#334155;"><strong>Doctor:</strong> ${this.esc(doctor)}</p>
                <p style="margin:2px 0;font-size:13px;color:#334155;"><strong>Patient:</strong> ${this.esc(patient)}</p>
                <p style="margin:2px 0;font-size:13px;color:#334155;"><strong>Date:</strong> ${this.esc(date)}</p>
                <p style="margin:2px 0;font-size:13px;color:#334155;"><strong>Time:</strong> ${this.esc(time)}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 22px 6px;">
              <a href="${this.esc(ctaUrl)}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:10px;">${this.esc(ctaLabel)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 22px 24px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;">MediSmart Hospital Network, Colombo, Sri Lanka</p>
              <p style="margin:0;">
                Thank you for choosing MediSmart AI.
                <a href="#" style="color:#0284c7;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
