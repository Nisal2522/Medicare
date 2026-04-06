import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PaymentRmqPublisher } from './payment-rmq.publisher';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [HttpModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentRmqPublisher],
})
export class PaymentsModule {}
