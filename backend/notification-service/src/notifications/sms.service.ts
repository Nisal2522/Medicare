import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

type SmsSendResult = {
  success: boolean;
  provider: 'twilio' | 'mock';
  to?: string;
  sid?: string;
  code?: number;
  error?: string;
};

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: ReturnType<typeof twilio> | null = null;
  private twilioFrom: string | null = null;

  constructor(private readonly config: ConfigService) {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID')?.trim();
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN')?.trim();
    const from = this.config.get<string>('TWILIO_PHONE_NUMBER')?.trim();
    if (sid && token && from) {
      this.twilioClient = twilio(sid, token);
      this.twilioFrom = from;
      this.logger.log(`Twilio SMS enabled (from: ${from})`);
    } else {
      const missing = [
        !sid ? 'TWILIO_ACCOUNT_SID' : null,
        !token ? 'TWILIO_AUTH_TOKEN' : null,
        !from ? 'TWILIO_PHONE_NUMBER' : null,
      ]
        .filter(Boolean)
        .join(', ');
      this.logger.warn(
        `Twilio not configured (${missing}) — SMS will be mocked (console log only).`,
      );
    }
  }

  private normalizePhone(to: string): string {
    const trimmed = to.trim().replace(/[()\-\s]/g, '');
    if (!trimmed) return '';
    if (trimmed.startsWith('+')) return trimmed;
    if (/^0\d{9}$/.test(trimmed)) {
      return `+94${trimmed.slice(1)}`;
    }
    if (/^94\d{9}$/.test(trimmed)) {
      return `+${trimmed}`;
    }
    return trimmed;
  }

  private isE164(phone: string): boolean {
    return /^\+[1-9]\d{7,14}$/.test(phone);
  }

  async send(to: string | undefined, body: string): Promise<SmsSendResult> {
    const n = to?.trim();
    const normalized = n ? this.normalizePhone(n) : '';
    if (!n) {
      this.logger.log(`SMS (no phone): ${body.slice(0, 120)}…`);
      return { success: false, provider: 'mock', error: 'Phone number missing' };
    }
    if (!this.isE164(normalized)) {
      const error = `Invalid phone format. Use E.164 (e.g. +94719839270). Received: ${n}`;
      this.logger.warn(error);
      return {
        success: false,
        provider: this.twilioClient ? 'twilio' : 'mock',
        to: normalized || n,
        error,
      };
    }

    if (this.twilioClient && this.twilioFrom) {
      try {
        const result = await this.twilioClient.messages.create({
          from: this.twilioFrom,
          to: normalized,
          body,
        });
        this.logger.log(`SMS sent via Twilio to ${normalized}`);
        return {
          success: true,
          provider: 'twilio',
          to: normalized,
          sid: result.sid,
        };
      } catch (e: unknown) {
        const twilioError = e as {
          code?: number;
          status?: number;
          message?: string;
          moreInfo?: string;
        };
        const msg = twilioError.message ?? String(e);
        const code = twilioError.code;
        const status = twilioError.status;
        const moreInfo = twilioError.moreInfo;
        this.logger.error(
          `Twilio SMS failed for ${normalized} | code=${code ?? 'n/a'} status=${status ?? 'n/a'} message=${msg}${moreInfo ? ` | moreInfo=${moreInfo}` : ''}`,
        );
        return {
          success: false,
          provider: 'twilio',
          to: normalized,
          code,
          error: msg,
        };
      }
    }

    this.logger.log(`SMS sent to [${normalized}]: ${body}`);
    return { success: true, provider: 'mock', to: normalized };
  }
}
