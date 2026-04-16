import { Controller, Get, Param } from '@nestjs/common';
import { BookingSummaryService } from './booking-summary.service';

@Controller('booking-summary')
export class BookingSummaryController {
  constructor(private readonly bookingSummary: BookingSummaryService) {}

  @Get('healthcheck')
  healthcheck() {
    return { ok: true };
  }

  @Get(':appointmentId')
  getSummary(@Param('appointmentId') appointmentId: string) {
    return this.bookingSummary.getBookingSummary(appointmentId);
  }
}

