import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppointmentsService } from './appointments.service';

@Controller()
export class PaymentSuccessListener {
  private readonly logger = new Logger(PaymentSuccessListener.name);

  constructor(private readonly appointments: AppointmentsService) {}

  @EventPattern('payment_success')
  async onPaid(@Payload() data: { appointmentId: string }): Promise<void> {
    this.logger.log(`payment_success for appointment ${data.appointmentId}`);
    await this.appointments.confirmPaymentSuccess(data.appointmentId);
  }
}
