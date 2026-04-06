"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentRmqPublisher_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRmqPublisher = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqp = __importStar(require("amqplib"));
const QUEUE = 'payment_success_queue';
const NOTIFICATION_QUEUE = 'notification_queue';
let PaymentRmqPublisher = PaymentRmqPublisher_1 = class PaymentRmqPublisher {
    config;
    logger = new common_1.Logger(PaymentRmqPublisher_1.name);
    connection = null;
    channel = null;
    constructor(config) {
        this.config = config;
    }
    async onModuleInit() {
        const url = this.config.get('RABBITMQ_URL') ?? 'amqp://localhost:5672';
        try {
            this.connection = await amqp.connect(url);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(QUEUE, { durable: true });
            await this.channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
            this.logger.log(`RabbitMQ payment queue "${QUEUE}" ready`);
        }
        catch (e) {
            this.logger.error(`RabbitMQ connect failed: ${String(e)}`);
        }
    }
    async onModuleDestroy() {
        try {
            await this.channel?.close();
        }
        catch {
        }
        try {
            await this.connection?.close();
        }
        catch {
        }
    }
    publishPaymentSuccess(appointmentId) {
        if (!this.channel) {
            this.logger.error('No RMQ channel — cannot publish payment_success');
            return;
        }
        const body = Buffer.from(JSON.stringify({
            pattern: 'payment_success',
            data: { appointmentId },
        }));
        this.channel.sendToQueue(QUEUE, body, { persistent: true });
        this.logger.log(`Published payment_success for ${appointmentId}`);
    }
    publishNotification(payload) {
        if (!this.channel) {
            this.logger.error('No RMQ channel — cannot publish notification');
            return;
        }
        const body = Buffer.from(JSON.stringify(payload));
        this.channel.sendToQueue(NOTIFICATION_QUEUE, body, { persistent: true });
        this.logger.log(`Published notification for ${payload.email}`);
    }
};
exports.PaymentRmqPublisher = PaymentRmqPublisher;
exports.PaymentRmqPublisher = PaymentRmqPublisher = PaymentRmqPublisher_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaymentRmqPublisher);
//# sourceMappingURL=payment-rmq.publisher.js.map