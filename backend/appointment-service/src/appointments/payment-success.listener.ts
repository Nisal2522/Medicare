import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppointmentsService } from './appointments.service';

type PaymentSucceededV1Event = {
  appointmentId: string;
};

type PaymentFailedV1Event = {
  appointmentId: string;
  reason: string;
  traceId: string;
};

@Controller()
export class PaymentSuccessListener {
  private readonly logger = new Logger(PaymentSuccessListener.name);
  private static readonly PAYMENT_SUCCEEDED_V1 = 'PaymentSucceeded.v1';
  private static readonly PAYMENT_FAILED_V1 = 'PaymentFailed.v1';

  constructor(private readonly appointments: AppointmentsService) {}

  @EventPattern('payment_success')
  async onPaid(@Payload() data: { appointmentId: string }): Promise<void> {
    this.logger.log(`payment_success for appointment ${data.appointmentId}`);
    await this.appointments.confirmPaymentSuccess(data.appointmentId);
  }

  @EventPattern(PaymentSuccessListener.PAYMENT_SUCCEEDED_V1)
  async onPaidV1(@Payload() event: PaymentSucceededV1Event): Promise<void> {
    this.logger.log(`PaymentSucceeded.v1 for appointment ${event.appointmentId}`);
    await this.appointments.confirmPaymentSuccess(event.appointmentId);
  }

  @EventPattern(PaymentSuccessListener.PAYMENT_FAILED_V1)
  async onFailedV1(@Payload() event: PaymentFailedV1Event): Promise<void> {
    this.logger.warn(`PaymentFailed.v1 for appointment ${event.appointmentId}`);
    await this.appointments.markPaymentFailed(event);
  }
}
