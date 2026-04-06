import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly config;
    private readonly logger;
    private transporter;
    constructor(config: ConfigService);
    sendHtml(to: string, subject: string, html: string): Promise<void>;
}
