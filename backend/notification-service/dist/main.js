"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
    const port = Number(process.env.PORT ?? 3008);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.connectMicroservice({
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
    await app.startAllMicroservices();
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map