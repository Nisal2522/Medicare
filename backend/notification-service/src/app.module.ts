import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsListener } from './notifications/notifications.listener';
import { NotificationDispatcherService } from './notifications/notification-dispatcher.service';
import { MailService } from './notifications/mail.service';
import { NotificationQueueConsumer } from './notifications/notification-queue.consumer';
import { SmsService } from './notifications/sms.service';
import { SmsController } from './notifications/sms.controller';
import { RealtimeGateway } from './notifications/realtime.gateway';
import { RealtimeNotificationService } from './notifications/realtime-notification.service';
import {
  AppNotification,
  AppNotificationSchema,
} from './notifications/notification.schema';
import { NotificationStoreService } from './notifications/notification-store.service';
import { UserNotificationsController } from './notifications/user-notifications.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ??
        process.env.MONGODB_URI ??
        'mongodb://localhost:27017/healthcare-platform',
    ),
    MongooseModule.forFeature([
      { name: AppNotification.name, schema: AppNotificationSchema },
    ]),
  ],
  controllers: [NotificationsListener, SmsController, UserNotificationsController],
  providers: [
    MailService,
    SmsService,
    NotificationDispatcherService,
    NotificationQueueConsumer,
    RealtimeGateway,
    RealtimeNotificationService,
    NotificationStoreService,
  ],
})
export class AppModule {
  // Force provider instantiation so queue consumer always starts.
  constructor(private readonly _queueConsumer: NotificationQueueConsumer) {}
}
