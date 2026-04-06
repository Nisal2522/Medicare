import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ChannelModel } from 'amqplib';
import * as amqp from 'amqplib';

const QUEUE = 'payment_success_queue';
const NOTIFICATION_QUEUE = 'notification_queue';

@Injectable()
export class PaymentRmqPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentRmqPublisher.name);
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
