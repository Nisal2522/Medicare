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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const notifications_listener_1 = require("./notifications/notifications.listener");
const notification_dispatcher_service_1 = require("./notifications/notification-dispatcher.service");
const mail_service_1 = require("./notifications/mail.service");
const notification_queue_consumer_1 = require("./notifications/notification-queue.consumer");
const sms_service_1 = require("./notifications/sms.service");
let AppModule = class AppModule {
    _queueConsumer;
    constructor(_queueConsumer) {
        this._queueConsumer = _queueConsumer;
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
        ],
        controllers: [notifications_listener_1.NotificationsListener],
        providers: [
            mail_service_1.MailService,
            sms_service_1.SmsService,
            notification_dispatcher_service_1.NotificationDispatcherService,
            notification_queue_consumer_1.NotificationQueueConsumer,
        ],
    }),
    __metadata("design:paramtypes", [notification_queue_consumer_1.NotificationQueueConsumer])
], AppModule);
//# sourceMappingURL=app.module.js.map