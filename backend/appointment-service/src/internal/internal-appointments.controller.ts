import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service';
import { InternalKeyGuard } from './internal-key.guard';

@Controller('internal/appointments')
@UseGuards(InternalKeyGuard)
export class InternalAppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get(':id/telecom-snapshot')
  telecomSnapshot(@Param('id') id: string) {
    return this.appointments.getTelecomSnapshot(id);
  }

  @Get(':id/payment-preview')
  paymentPreview(@Param('id') id: string) {
    return this.appointments.getPaymentPreviewForCheckout(id);
  }

  @Post(':id/confirm-payment')
  async confirmPayment(@Param('id') id: string) {
    await this.appointments.confirmPaymentSuccess(id);
    return { ok: true };
  }
}
