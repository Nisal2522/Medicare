"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
    const app = await core_1.NestFactory.createMicroservice(app_module_1.AppModule, {
        transport: microservices_1.Transport.RMQ,
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
    await app.listen();
}
bootstrap();
//# sourceMappingURL=main.js.map