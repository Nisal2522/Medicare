import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
type PaymentSucceededV1Event = {
    appointmentId: string;
    paymentIntentId?: string;
    occurredAt: string;
    traceId: string;
};
type PaymentFailedV1Event = {
    appointmentId: string;
    reason: string;
    paymentIntentId?: string;
    occurredAt: string;
    traceId: string;
};
type PatientPaymentRecordedV1Event = {
    appointmentId: string;
    amountCents: number;
    currency: string;
    status: 'paid' | 'failed';
    description: string;
    reference?: string;
    occurredAt: string;
    traceId: string;
};
export declare class PaymentRmqPublisher implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private static readonly PAYMENT_SUCCEEDED_V1;
    private static readonly PAYMENT_FAILED_V1;
    private static readonly PATIENT_PAYMENT_RECORDED_V1;
    private connection;
    private channel;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publishPaymentSuccess(appointmentId: string): void;
    publishPaymentSucceededV1(event: PaymentSucceededV1Event): void;
    publishPaymentFailedV1(event: PaymentFailedV1Event): void;
    publishPatientPaymentRecordedV1(event: PatientPaymentRecordedV1Event): void;
    publishNotification(payload: {
        email: string;
        subject: string;
        message: string;
        phoneNumber?: string;
    }): void;
}
export {};
