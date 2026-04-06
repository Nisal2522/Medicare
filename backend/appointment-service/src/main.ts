import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const rmqUrl = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'payment_success_queue',
      queueOptions: { durable: true },
      prefetchCount: 5,
      noAck: false,
    },
  });

  // HTTP must listen first: if RabbitMQ is down, startAllMicroservices can block/retry
  // indefinitely and would prevent the REST API from ever starting (breaks patient dashboard).
  const port = process.env.PORT ?? '3003';
  await app.listen(port);
  try {
    await app.startAllMicroservices();
  } catch (e) {
    console.error(
      '[appointment-service] RabbitMQ microservice failed to start (payment_success_queue). HTTP API still runs.',
      e,
    );
  }
}
bootstrap();
