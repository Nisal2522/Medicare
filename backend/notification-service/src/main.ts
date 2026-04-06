import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: 'notifications_queue',
        queueOptions: {
          durable: true,
        },
        prefetchCount: 5,
        noAck: false,
      },
    },
  );
  await app.listen();
}
bootstrap();
