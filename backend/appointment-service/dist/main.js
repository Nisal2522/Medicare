"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: true });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const rmqUrl = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
    app.connectMicroservice({
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [rmqUrl],
            queue: 'payment_success_queue',
            queueOptions: { durable: true },
            prefetchCount: 5,
            noAck: false,
        },
    });
    const port = process.env.PORT ?? '3003';
    await app.listen(port);
    try {
        await app.startAllMicroservices();
    }
    catch (e) {
        console.error('[appointment-service] RabbitMQ microservice failed to start (payment_success_queue). HTTP API still runs.', e);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map