import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: ReturnType<typeof twilio> | null = null;
  private twilioFrom: string | null = null;

  constructor(private readonly config: ConfigService) {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_PHONE_NUMBER');
    if (sid && token && from) {
      this.twilioClient = twilio(sid, token);
      this.twilioFrom = from;
      this.logger.log('Twilio SMS enabled');
    } else {
      this.logger.warn(
        'Twilio not configured — SMS will be mocked (console log only).',
      );
    }
  }

  async send(to: string | undefined, body: string): Promise<void> {
    const n = to?.trim();
    if (!n) {
      this.logger.log(`SMS (no phone): ${body.slice(0, 120)}…`);
      return;
    }

    if (this.twilioClient && this.twilioFrom) {
      try {
        await this.twilioClient.messages.create({
          from: this.twilioFrom,
          to: n,
          body,
        });
        this.logger.log(`SMS sent via Twilio to ${n}`);
      } catch (e) {
        this.logger.warn(`SMS send failed for ${n}: ${String(e)}`);
      }
      return;
    }

    this.logger.log(`SMS sent to [${n}]: ${body}`);
  }
}
