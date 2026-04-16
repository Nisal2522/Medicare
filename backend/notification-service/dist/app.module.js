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
const mongoose_1 = require("@nestjs/mongoose");
const notifications_listener_1 = require("./notifications/notifications.listener");
const notification_dispatcher_service_1 = require("./notifications/notification-dispatcher.service");
const mail_service_1 = require("./notifications/mail.service");
const notification_queue_consumer_1 = require("./notifications/notification-queue.consumer");
const sms_service_1 = require("./notifications/sms.service");
const sms_controller_1 = require("./notifications/sms.controller");
const realtime_gateway_1 = require("./notifications/realtime.gateway");
const realtime_notification_service_1 = require("./notifications/realtime-notification.service");
const notification_schema_1 = require("./notifications/notification.schema");
const notification_store_service_1 = require("./notifications/notification-store.service");
const user_notifications_controller_1 = require("./notifications/user-notifications.controller");
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
            mongoose_1.MongooseModule.forRoot(process.env.MONGO_URI ??
                process.env.MONGODB_URI ??
                'mongodb://localhost:27017/medismart_notification'),
            mongoose_1.MongooseModule.forFeature([
                { name: notification_schema_1.AppNotification.name, schema: notification_schema_1.AppNotificationSchema },
            ]),
        ],
        controllers: [notifications_listener_1.NotificationsListener, sms_controller_1.SmsController, user_notifications_controller_1.UserNotificationsController],
        providers: [
            mail_service_1.MailService,
            sms_service_1.SmsService,
            notification_dispatcher_service_1.NotificationDispatcherService,
            notification_queue_consumer_1.NotificationQueueConsumer,
            realtime_gateway_1.RealtimeGateway,
            realtime_notification_service_1.RealtimeNotificationService,
            notification_store_service_1.NotificationStoreService,
        ],
    }),
    __metadata("design:paramtypes", [notification_queue_consumer_1.NotificationQueueConsumer])
], AppModule);
//# sourceMappingURL=app.module.js.map