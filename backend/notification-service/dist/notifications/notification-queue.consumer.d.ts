import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { SmsService } from './sms.service';
export declare class NotificationQueueConsumer implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly mail;
    private readonly sms;
    private readonly logger;
    private connection;
    private channel;
    constructor(config: ConfigService, mail: MailService, sms: SmsService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private handleMessage;
    private wrapHtml;
    private esc;
}
