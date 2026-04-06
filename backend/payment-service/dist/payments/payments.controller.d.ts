import { type RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ConfirmIntentDto } from './dto/confirm-intent.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreateIntentDto } from './dto/create-intent.dto';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly payments;
    constructor(payments: PaymentsService);
    createCheckout(dto: CreateCheckoutSessionDto): Promise<{
        checkoutUrl: string;
    }>;
    createIntent(dto: CreateIntentDto): Promise<{
        clientSecret: string | null;
    }>;
    reconcileIntent(dto: CreateIntentDto): Promise<{
        ok: true;
        appointmentId: string;
        updated: boolean;
        paymentIntentId?: string;
    }>;
    confirmIntent(dto: ConfirmIntentDto): Promise<{
        ok: true;
        appointmentId: string;
        paymentIntentId: string;
        status: import("stripe").Stripe.PaymentIntent.Status;
    }>;
    config(): {
        publishableKey: string;
    };
    webhook(signature: string | undefined, req: RawBodyRequest<Request>): {
        received: true;
    };
}
