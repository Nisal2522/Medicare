import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsListener } from './notifications/notifications.listener';
import { NotificationDispatcherService } from './notifications/notification-dispatcher.service';
import { MailService } from './notifications/mail.service';
import { NotificationQueueConsumer } from './notifications/notification-queue.consumer';
import { SmsService } from './notifications/sms.service';
import { SmsController } from './notifications/sms.controller';
import { RealtimeGateway } from './notifications/realtime.gateway';
import { RealtimeNotificationService } from './notifications/realtime-notification.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [NotificationsListener, SmsController],
  providers: [
    MailService,
    SmsService,
    NotificationDispatcherService,
    NotificationQueueConsumer,
    RealtimeGateway,
    RealtimeNotificationService,
  ],
})
export class AppModule {
  // Force provider instantiation so queue consumer always starts.
  constructor(private readonly _queueConsumer: NotificationQueueConsumer) {}
}
