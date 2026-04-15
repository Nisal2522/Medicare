import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ChannelModel } from 'amqplib';
import * as amqp from 'amqplib';

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

const QUEUE = 'payment_success_queue';
const NOTIFICATION_QUEUE = 'notification_queue';
const PATIENT_EVENTS_QUEUE = 'patient_events_queue';

@Injectable()
export class PaymentRmqPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentRmqPublisher.name);
  private static readonly PAYMENT_SUCCEEDED_V1 = 'PaymentSucceeded.v1';
  private static readonly PAYMENT_FAILED_V1 = 'PaymentFailed.v1';
  private static readonly PATIENT_PAYMENT_RECORDED_V1 = 'PatientPaymentRecorded.v1';
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url =
      this.config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(QUEUE, { durable: true });
      await this.channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
      await this.channel.assertQueue(PATIENT_EVENTS_QUEUE, { durable: true });
      this.logger.log(`RabbitMQ payment queue "${QUEUE}" ready`);
    } catch (e) {
      this.logger.error(`RabbitMQ connect failed: ${String(e)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.connection?.close();
    } catch {
      /* ignore */
    }
  }

  publishPaymentSuccess(appointmentId: string): void {
    if (!this.channel) {
      this.logger.error('No RMQ channel — cannot publish payment_success');
      return;
    }
    const body = Buffer.from(
      JSON.stringify({
        pattern: 'payment_success',
        data: { appointmentId },
      }),
    );
    this.channel.sendToQueue(QUEUE, body, { persistent: true });
    this.logger.log(`Published payment_success for ${appointmentId}`);
  }

  publishPaymentSucceededV1(event: PaymentSucceededV1Event): void {
    if (!this.channel) {
      this.logger.error('No RMQ channel — cannot publish PaymentSucceeded.v1');
      return;
    }
    const body = Buffer.from(
      JSON.stringify({
        pattern: PaymentRmqPublisher.PAYMENT_SUCCEEDED_V1,
        data: event,
      }),
    );
    this.channel.sendToQueue(QUEUE, body, { persistent: true });
  }

  publishPaymentFailedV1(event: PaymentFailedV1Event): void {
    if (!this.channel) {
      this.logger.error('No RMQ channel — cannot publish PaymentFailed.v1');
      return;
    }
    const body = Buffer.from(
      JSON.stringify({
        pattern: PaymentRmqPublisher.PAYMENT_FAILED_V1,
        data: event,
      }),
    );
    this.channel.sendToQueue(QUEUE, body, { persistent: true });
  }

  publishPatientPaymentRecordedV1(event: PatientPaymentRecordedV1Event): void {
    if (!this.channel) {
      this.logger.error('No RMQ channel — cannot publish PatientPaymentRecorded.v1');
      return;
    }
    const body = Buffer.from(
      JSON.stringify({
        pattern: PaymentRmqPublisher.PATIENT_PAYMENT_RECORDED_V1,
        data: event,
      }),
    );
    this.channel.sendToQueue(PATIENT_EVENTS_QUEUE, body, { persistent: true });
  }

  publishNotification(payload: {
    email: string;
    subject: string;
    message: string;
    phoneNumber?: string;
  }): void {
    if (!this.channel) {
      this.logger.error('No RMQ channel — cannot publish notification');
      return;
    }
    const body = Buffer.from(JSON.stringify(payload));
    this.channel.sendToQueue(NOTIFICATION_QUEUE, body, { persistent: true });
    this.logger.log(`Published notification for ${payload.email}`);
  }
}
