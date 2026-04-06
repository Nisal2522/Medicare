import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class PaymentRmqPublisher implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private connection;
    private channel;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publishPaymentSuccess(appointmentId: string): void;
    publishNotification(payload: {
        email: string;
        subject: string;
        message: string;
        phoneNumber?: string;
    }): void;
}
