import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsListener } from './notifications/notifications.listener';
import { NotificationDispatcherService } from './notifications/notification-dispatcher.service';
import { MailService } from './notifications/mail.service';
import { NotificationQueueConsumer } from './notifications/notification-queue.consumer';
import { SmsService } from './notifications/sms.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [NotificationsListener],
  providers: [
    MailService,
    SmsService,
    NotificationDispatcherService,
    NotificationQueueConsumer,
  ],
})
export class AppModule {
  // Force provider instantiation so queue consumer always starts.
  constructor(private readonly _queueConsumer: NotificationQueueConsumer) {}
}
