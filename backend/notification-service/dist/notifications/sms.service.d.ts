import { ConfigService } from '@nestjs/config';
export declare class SmsService {
    private readonly config;
    private readonly logger;
    private twilioClient;
    private twilioFrom;
    constructor(config: ConfigService);
    send(to: string | undefined, body: string): Promise<void>;
}
