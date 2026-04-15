import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  const port = Number(process.env.PORT ?? 3008);
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
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
  });
  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
