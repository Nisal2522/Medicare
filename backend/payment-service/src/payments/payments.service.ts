import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { ConfirmIntentDto } from './dto/confirm-intent.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreateIntentDto } from './dto/create-intent.dto';
import { PaymentRmqPublisher } from './payment-rmq.publisher';

type PaymentPreview = {
  appointmentId: string;
  amountMinor: number;
  currency: string;
  patientEmail: string;
  status: string;
};

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

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly rmq: PaymentRmqPublisher,
  ) {}

  private emitPaymentSucceeded(appointmentId: string, paymentIntentId?: string): void {
    const event: PaymentSucceededV1Event = {
      appointmentId,
      paymentIntentId,
      occurredAt: new Date().toISOString(),
      traceId: randomUUID(),
    };
    this.rmq.publishPaymentSuccess(appointmentId);
    this.rmq.publishPaymentSucceededV1(event);
  }

  private emitPaymentFailed(
    appointmentId: string,
    reason: string,
    paymentIntentId?: string,
  ): void {
    const event: PaymentFailedV1Event = {
      appointmentId,
      reason,
      paymentIntentId,
      occurredAt: new Date().toISOString(),
      traceId: randomUUID(),
    };
    this.rmq.publishPaymentFailedV1(event);
  }

  private emitPatientPaymentRecorded(event: PatientPaymentRecordedV1Event): void {
    this.rmq.publishPatientPaymentRecordedV1(event);
  }

  private getStripe(): Stripe {
    const key = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    if (!key) {
      throw new BadRequestException('Stripe is not configured');
    }
    if (!this.stripe) {
      this.stripe = new Stripe(key);
    }
    return this.stripe;
  }

  private async loadPreview(appointmentId: string): Promise<PaymentPreview> {
    const base = (
      this.config.get<string>('APPOINTMENT_SERVICE_URL') ??
      'http://localhost:3003'
    ).replace(/\/$/, '');
    const serviceKey = this.config.get<string>('INTERNAL_SERVICE_KEY')?.trim();
    if (!serviceKey) {
      throw new BadRequestException('INTERNAL_SERVICE_KEY is not set');
    }
    try {
      const { data } = await firstValueFrom(
        this.http.get<PaymentPreview>(
          `${base}/internal/appointments/${appointmentId}/payment-preview`,
          {
            headers: { 'X-Service-Key': serviceKey },
            timeout: 12_000,
          },
        ),
      );
      return data;
    } catch (e: unknown) {
      const status =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { status?: number; data?: { message?: string } } })
              .response?.status
          : undefined;
      const rawMsg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string | string[] } } })
              .response?.data?.message
          : undefined;
      const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
      if (status === 404) {
        throw new BadRequestException('Appointment not found');
      }
      if (status === 403) {
        throw new BadRequestException(
          'Payment service cannot reach appointments (check INTERNAL_SERVICE_KEY matches appointment-service .env)',
        );
      }
      throw new BadRequestException(
        typeof msg === 'string' ? msg : 'Could not load appointment for payment',
      );
    }
  }

  private assertPatientEmail(
    preview: PaymentPreview,
    patientEmail: string,
  ): void {
    if (
      preview.patientEmail.trim().toLowerCase() !==
      patientEmail.trim().toLowerCase()
    ) {
      throw new BadRequestException('Email does not match this appointment');
    }
  }

  private async markAppointmentPaidDirect(appointmentId: string): Promise<void> {
    const base = (
      this.config.get<string>('APPOINTMENT_SERVICE_URL') ??
      'http://localhost:3003'
    ).replace(/\/$/, '');
    const serviceKey = this.config.get<string>('INTERNAL_SERVICE_KEY')?.trim();
    if (!serviceKey) return;
    try {
      await firstValueFrom(
        this.http.post(
          `${base}/internal/appointments/${appointmentId}/confirm-payment`,
          {},
          {
            headers: { 'X-Service-Key': serviceKey },
            timeout: 12_000,
          },
        ),
      );
    } catch (e) {
      this.logger.warn(
        `Direct payment sync failed for ${appointmentId}: ${String(e)}`,
      );
    }
  }

  async createCheckoutSession(dto: CreateCheckoutSessionDto): Promise<{
    checkoutUrl: string;
  }> {
    const preview = await this.loadPreview(dto.appointmentId);
    this.assertPatientEmail(preview, dto.patientEmail);
    if (preview.amountMinor < 1) {
      throw new BadRequestException('Amount must be at least 1 minor unit');
    }
    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: dto.patientEmail.trim(),
      line_items: [
        {
          price_data: {
            currency: preview.currency,
            product_data: {
              name: `Consultation — ${preview.appointmentId}`,
            },
            unit_amount: preview.amountMinor,
          },
          quantity: 1,
        },
      ],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      metadata: {
        appointmentId: preview.appointmentId,
        patientEmail: preview.patientEmail,
      },
    });
    const url = session.url;
    if (!url) {
      throw new BadRequestException('Stripe did not return a checkout URL');
    }
    return { checkoutUrl: url };
  }

  async createPaymentIntent(dto: CreateIntentDto): Promise<{
    clientSecret: string | null;
  }> {
    const preview = await this.loadPreview(dto.appointmentId);
    this.assertPatientEmail(preview, dto.patientEmail);
    if (preview.amountMinor < 1) {
      throw new BadRequestException('Amount must be at least 1 minor unit');
    }
    const stripe = this.getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: preview.amountMinor,
      currency: preview.currency,
      metadata: {
        appointmentId: preview.appointmentId,
        patientEmail: preview.patientEmail,
      },
      automatic_payment_methods: { enabled: true },
    });
    return { clientSecret: intent.client_secret };
  }

  async confirmIntent(dto: ConfirmIntentDto): Promise<{
    ok: true;
    appointmentId: string;
    paymentIntentId: string;
    status: Stripe.PaymentIntent.Status;
  }> {
    const preview = await this.loadPreview(dto.appointmentId);
    this.assertPatientEmail(preview, dto.patientEmail);

    const stripe = this.getStripe();
    const intent = await stripe.paymentIntents.retrieve(dto.paymentIntentId);
    const intentAppointmentId = intent.metadata?.appointmentId;
    if (!intentAppointmentId || intentAppointmentId !== dto.appointmentId) {
      throw new BadRequestException('Payment intent does not match appointment');
    }
    if (intent.status !== 'succeeded') {
      this.emitPaymentFailed(
        dto.appointmentId,
        `PaymentIntent status is ${intent.status}`,
        intent.id,
      );
      throw new BadRequestException('Payment is not completed yet');
    }

    this.emitPaymentSucceeded(dto.appointmentId, intent.id);
    this.emitPatientPaymentRecorded({
      appointmentId: dto.appointmentId,
      amountCents: preview.amountMinor,
      currency: preview.currency.toUpperCase(),
      status: 'paid',
      description: `Appointment payment for ${dto.appointmentId}`,
      reference: intent.id,
      occurredAt: new Date().toISOString(),
      traceId: randomUUID(),
    });
    await this.markAppointmentPaidDirect(dto.appointmentId);

    return {
      ok: true,
      appointmentId: dto.appointmentId,
      paymentIntentId: intent.id,
      status: intent.status,
    };
  }

  async reconcileIntent(dto: CreateIntentDto): Promise<{
    ok: true;
    appointmentId: string;
    updated: boolean;
    paymentIntentId?: string;
  }> {
    const preview = await this.loadPreview(dto.appointmentId);
    this.assertPatientEmail(preview, dto.patientEmail);

    const stripe = this.getStripe();
    let matched: Stripe.PaymentIntent | undefined;

    try {
      const query = `metadata['appointmentId']:'${dto.appointmentId}' AND status:'succeeded'`;
      const found = await stripe.paymentIntents.search({ query, limit: 1 });
      matched = found.data[0];
    } catch {
      const recent = await stripe.paymentIntents.list({ limit: 100 });
      matched = recent.data.find(
        (pi) =>
          pi.status === 'succeeded' &&
          pi.metadata?.appointmentId === dto.appointmentId,
      );
    }

    if (!matched) {
      return { ok: true, appointmentId: dto.appointmentId, updated: false };
    }

    this.emitPaymentSucceeded(dto.appointmentId, matched.id);
    this.emitPatientPaymentRecorded({
      appointmentId: dto.appointmentId,
      amountCents: preview.amountMinor,
      currency: preview.currency.toUpperCase(),
      status: 'paid',
      description: `Appointment payment for ${dto.appointmentId}`,
      reference: matched.id,
      occurredAt: new Date().toISOString(),
      traceId: randomUUID(),
    });
    await this.markAppointmentPaidDirect(dto.appointmentId);

    return {
      ok: true,
      appointmentId: dto.appointmentId,
      updated: true,
      paymentIntentId: matched.id,
    };
  }

  publishableKey(): { publishableKey: string } {
    return {
      publishableKey:
        this.config.get<string>('STRIPE_PUBLISHABLE_KEY')?.trim() ?? '',
    };
  }

  handleStripeWebhook(rawBody: Buffer, signature: string): { received: true } {
    const whSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.trim();
    if (!whSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET missing');
      throw new BadRequestException('Webhook not configured');
    }
    const stripe = this.getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, whSecret);
    } catch (err) {
      this.logger.warn(`Webhook signature: ${String(err)}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    let appointmentId: string | undefined;

    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        appointmentId = s.metadata?.appointmentId;
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        appointmentId = pi.metadata?.appointmentId;
        const amount = Number(pi.amount_received || pi.amount || 0) / 100;
        const to = (
          pi.receipt_email ??
          pi.metadata?.patientEmail ??
          ''
        ).trim();
        if (appointmentId && to) {
          this.rmq.publishNotification({
            email: to,
            subject: 'Payment Successful - MediSmart AI',
            message: `Your payment of LKR ${amount.toFixed(2)} for Appointment ${appointmentId} was successful. You can now join the consultation at the scheduled time.`,
          });
        } else {
          this.logger.warn(
            `payment_intent.succeeded missing email/appointmentId (appointmentId=${appointmentId ?? 'n/a'})`,
          );
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        appointmentId = pi.metadata?.appointmentId;
        break;
      }
      default:
        break;
    }

    if (appointmentId) {
      if (event.type === 'payment_intent.payment_failed') {
        const pi = event.data.object as Stripe.PaymentIntent;
        this.emitPaymentFailed(
          appointmentId,
          pi.last_payment_error?.message ?? 'Stripe payment intent failed',
          pi.id,
        );
        this.emitPatientPaymentRecorded({
          appointmentId,
          amountCents: Number(pi.amount || 0),
          currency: (pi.currency || 'lkr').toUpperCase(),
          status: 'failed',
          description:
            pi.last_payment_error?.message ??
            `Payment failed for appointment ${appointmentId}`,
          reference: pi.id,
          occurredAt: new Date().toISOString(),
          traceId: randomUUID(),
        });
      } else {
        const pi = event.data.object as Stripe.PaymentIntent;
        this.emitPaymentSucceeded(appointmentId, pi.id);
        this.emitPatientPaymentRecorded({
          appointmentId,
          amountCents: Number(pi.amount_received || pi.amount || 0),
          currency: (pi.currency || 'lkr').toUpperCase(),
          status: 'paid',
          description: `Appointment payment for ${appointmentId}`,
          reference: pi.id,
          occurredAt: new Date().toISOString(),
          traceId: randomUUID(),
        });
        void this.markAppointmentPaidDirect(appointmentId);
      }
    }

    return { received: true };
  }
}
