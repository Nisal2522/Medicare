import { ConfigService } from '@nestjs/config';
type SmsSendResult = {
    success: boolean;
    provider: 'twilio' | 'mock';
    to?: string;
    sid?: string;
    code?: number;
    error?: string;
};
export declare class SmsService {
    private readonly config;
    private readonly logger;
    private twilioClient;
    private twilioFrom;
    constructor(config: ConfigService);
    private normalizePhone;
    private isE164;
    send(to: string | undefined, body: string): Promise<SmsSendResult>;
}
export {};
