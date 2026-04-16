import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { ConfirmIntentDto } from './dto/confirm-intent.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreateIntentDto } from './dto/create-intent.dto';
import { PaymentRmqPublisher } from './payment-rmq.publisher';
export declare class PaymentsService {
    private readonly http;
    private readonly config;
    private readonly rmq;
    private readonly logger;
    private stripe;
    constructor(http: HttpService, config: ConfigService, rmq: PaymentRmqPublisher);
    private emitPaymentSucceeded;
    private emitPaymentFailed;
    private emitPatientPaymentRecorded;
    private getStripe;
    private loadPreview;
    private assertPatientEmail;
    private markAppointmentPaidDirect;
    createCheckoutSession(dto: CreateCheckoutSessionDto): Promise<{
        checkoutUrl: string;
    }>;
    createPaymentIntent(dto: CreateIntentDto): Promise<{
        clientSecret: string | null;
    }>;
    confirmIntent(dto: ConfirmIntentDto): Promise<{
        ok: true;
        appointmentId: string;
        paymentIntentId: string;
        status: Stripe.PaymentIntent.Status;
    }>;
    reconcileIntent(dto: CreateIntentDto): Promise<{
        ok: true;
        appointmentId: string;
        updated: boolean;
        paymentIntentId?: string;
    }>;
    publishableKey(): {
        publishableKey: string;
    };
    handleStripeWebhook(rawBody: Buffer, signature: string): {
        received: true;
    };
}
