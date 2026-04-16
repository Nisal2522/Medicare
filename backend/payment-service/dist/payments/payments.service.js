"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const stripe_1 = __importDefault(require("stripe"));
const node_crypto_1 = require("node:crypto");
const payment_rmq_publisher_1 = require("./payment-rmq.publisher");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    http;
    config;
    rmq;
    logger = new common_1.Logger(PaymentsService_1.name);
    stripe = null;
    constructor(http, config, rmq) {
        this.http = http;
        this.config = config;
        this.rmq = rmq;
    }
    emitPaymentSucceeded(appointmentId, paymentIntentId) {
        const event = {
            appointmentId,
            paymentIntentId,
            occurredAt: new Date().toISOString(),
            traceId: (0, node_crypto_1.randomUUID)(),
        };
        this.rmq.publishPaymentSuccess(appointmentId);
        this.rmq.publishPaymentSucceededV1(event);
    }
    emitPaymentFailed(appointmentId, reason, paymentIntentId) {
        const event = {
            appointmentId,
            reason,
            paymentIntentId,
            occurredAt: new Date().toISOString(),
            traceId: (0, node_crypto_1.randomUUID)(),
        };
        this.rmq.publishPaymentFailedV1(event);
    }
    emitPatientPaymentRecorded(event) {
        this.rmq.publishPatientPaymentRecordedV1(event);
    }
    getStripe() {
        const key = this.config.get('STRIPE_SECRET_KEY')?.trim();
        if (!key) {
            throw new common_1.BadRequestException('Stripe is not configured');
        }
        if (!this.stripe) {
            this.stripe = new stripe_1.default(key);
        }
        return this.stripe;
    }
    async loadPreview(appointmentId) {
        const base = (this.config.get('APPOINTMENT_SERVICE_URL') ??
            'http://localhost:3003').replace(/\/$/, '');
        const serviceKey = this.config.get('INTERNAL_SERVICE_KEY')?.trim();
        if (!serviceKey) {
            throw new common_1.BadRequestException('INTERNAL_SERVICE_KEY is not set');
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(`${base}/internal/appointments/${appointmentId}/payment-preview`, {
                headers: { 'X-Service-Key': serviceKey },
                timeout: 12_000,
            }));
            return data;
        }
        catch (e) {
            const status = e && typeof e === 'object' && 'response' in e
                ? e
                    .response?.status
                : undefined;
            const rawMsg = e && typeof e === 'object' && 'response' in e
                ? e
                    .response?.data?.message
                : undefined;
            const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
            if (status === 404) {
                throw new common_1.BadRequestException('Appointment not found');
            }
            if (status === 403) {
                throw new common_1.BadRequestException('Payment service cannot reach appointments (check INTERNAL_SERVICE_KEY matches appointment-service .env)');
            }
            throw new common_1.BadRequestException(typeof msg === 'string' ? msg : 'Could not load appointment for payment');
        }
    }
    assertPatientEmail(preview, patientEmail) {
        if (preview.patientEmail.trim().toLowerCase() !==
            patientEmail.trim().toLowerCase()) {
            throw new common_1.BadRequestException('Email does not match this appointment');
        }
    }
    async markAppointmentPaidDirect(appointmentId) {
        const base = (this.config.get('APPOINTMENT_SERVICE_URL') ??
            'http://localhost:3003').replace(/\/$/, '');
        const serviceKey = this.config.get('INTERNAL_SERVICE_KEY')?.trim();
        if (!serviceKey)
            return;
        try {
            await (0, rxjs_1.firstValueFrom)(this.http.post(`${base}/internal/appointments/${appointmentId}/confirm-payment`, {}, {
                headers: { 'X-Service-Key': serviceKey },
                timeout: 12_000,
            }));
        }
        catch (e) {
            this.logger.warn(`Direct payment sync failed for ${appointmentId}: ${String(e)}`);
        }
    }
    async createCheckoutSession(dto) {
        const preview = await this.loadPreview(dto.appointmentId);
        this.assertPatientEmail(preview, dto.patientEmail);
        if (preview.amountMinor < 1) {
            throw new common_1.BadRequestException('Amount must be at least 1 minor unit');
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
            throw new common_1.BadRequestException('Stripe did not return a checkout URL');
        }
        return { checkoutUrl: url };
    }
    async createPaymentIntent(dto) {
        const preview = await this.loadPreview(dto.appointmentId);
        this.assertPatientEmail(preview, dto.patientEmail);
        if (preview.amountMinor < 1) {
            throw new common_1.BadRequestException('Amount must be at least 1 minor unit');
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
    async confirmIntent(dto) {
        const preview = await this.loadPreview(dto.appointmentId);
        this.assertPatientEmail(preview, dto.patientEmail);
        const stripe = this.getStripe();
        const intent = await stripe.paymentIntents.retrieve(dto.paymentIntentId);
        const intentAppointmentId = intent.metadata?.appointmentId;
        if (!intentAppointmentId || intentAppointmentId !== dto.appointmentId) {
            throw new common_1.BadRequestException('Payment intent does not match appointment');
        }
        if (intent.status !== 'succeeded') {
            this.emitPaymentFailed(dto.appointmentId, `PaymentIntent status is ${intent.status}`, intent.id);
            throw new common_1.BadRequestException('Payment is not completed yet');
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
            traceId: (0, node_crypto_1.randomUUID)(),
        });
        await this.markAppointmentPaidDirect(dto.appointmentId);
        return {
            ok: true,
            appointmentId: dto.appointmentId,
            paymentIntentId: intent.id,
            status: intent.status,
        };
    }
    async reconcileIntent(dto) {
        const preview = await this.loadPreview(dto.appointmentId);
        this.assertPatientEmail(preview, dto.patientEmail);
        const stripe = this.getStripe();
        let matched;
        try {
            const query = `metadata['appointmentId']:'${dto.appointmentId}' AND status:'succeeded'`;
            const found = await stripe.paymentIntents.search({ query, limit: 1 });
            matched = found.data[0];
        }
        catch {
            const recent = await stripe.paymentIntents.list({ limit: 100 });
            matched = recent.data.find((pi) => pi.status === 'succeeded' &&
                pi.metadata?.appointmentId === dto.appointmentId);
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
            traceId: (0, node_crypto_1.randomUUID)(),
        });
        await this.markAppointmentPaidDirect(dto.appointmentId);
        return {
            ok: true,
            appointmentId: dto.appointmentId,
            updated: true,
            paymentIntentId: matched.id,
        };
    }
    publishableKey() {
        return {
            publishableKey: this.config.get('STRIPE_PUBLISHABLE_KEY')?.trim() ?? '',
        };
    }
    handleStripeWebhook(rawBody, signature) {
        const whSecret = this.config.get('STRIPE_WEBHOOK_SECRET')?.trim();
        if (!whSecret) {
            this.logger.error('STRIPE_WEBHOOK_SECRET missing');
            throw new common_1.BadRequestException('Webhook not configured');
        }
        const stripe = this.getStripe();
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, whSecret);
        }
        catch (err) {
            this.logger.warn(`Webhook signature: ${String(err)}`);
            throw new common_1.BadRequestException('Invalid Stripe signature');
        }
        let appointmentId;
        switch (event.type) {
            case 'checkout.session.completed': {
                const s = event.data.object;
                appointmentId = s.metadata?.appointmentId;
                break;
            }
            case 'payment_intent.succeeded': {
                const pi = event.data.object;
                appointmentId = pi.metadata?.appointmentId;
                const amount = Number(pi.amount_received || pi.amount || 0) / 100;
                const to = (pi.receipt_email ??
                    pi.metadata?.patientEmail ??
                    '').trim();
                if (appointmentId && to) {
                    this.rmq.publishNotification({
                        email: to,
                        subject: 'Payment Successful - MediSmart AI',
                        message: `Your payment of LKR ${amount.toFixed(2)} for Appointment ${appointmentId} was successful. You can now join the consultation at the scheduled time.`,
                    });
                }
                else {
                    this.logger.warn(`payment_intent.succeeded missing email/appointmentId (appointmentId=${appointmentId ?? 'n/a'})`);
                }
                break;
            }
            case 'payment_intent.payment_failed': {
                const pi = event.data.object;
                appointmentId = pi.metadata?.appointmentId;
                break;
            }
            default:
                break;
        }
        if (appointmentId) {
            if (event.type === 'payment_intent.payment_failed') {
                const pi = event.data.object;
                this.emitPaymentFailed(appointmentId, pi.last_payment_error?.message ?? 'Stripe payment intent failed', pi.id);
                this.emitPatientPaymentRecorded({
                    appointmentId,
                    amountCents: Number(pi.amount || 0),
                    currency: (pi.currency || 'lkr').toUpperCase(),
                    status: 'failed',
                    description: pi.last_payment_error?.message ??
                        `Payment failed for appointment ${appointmentId}`,
                    reference: pi.id,
                    occurredAt: new Date().toISOString(),
                    traceId: (0, node_crypto_1.randomUUID)(),
                });
            }
            else {
                const pi = event.data.object;
                this.emitPaymentSucceeded(appointmentId, pi.id);
                this.emitPatientPaymentRecorded({
                    appointmentId,
                    amountCents: Number(pi.amount_received || pi.amount || 0),
                    currency: (pi.currency || 'lkr').toUpperCase(),
                    status: 'paid',
                    description: `Appointment payment for ${appointmentId}`,
                    reference: pi.id,
                    occurredAt: new Date().toISOString(),
                    traceId: (0, node_crypto_1.randomUUID)(),
                });
                void this.markAppointmentPaidDirect(appointmentId);
            }
        }
        return { received: true };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        payment_rmq_publisher_1.PaymentRmqPublisher])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map