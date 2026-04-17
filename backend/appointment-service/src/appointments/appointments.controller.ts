// Controller exposing appointment-related HTTP endpoints.
// Routes are grouped under `/appointments` and delegate business logic
// to `AppointmentsService`. Route-level guards enforce authentication
// and role-based access where required.
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AdminRoleGuard } from '../auth/admin-role.guard';
import { AppointmentsService } from './appointments.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { DoctorApprovalDto } from './dto/doctor-approval.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post('book')
  // Public endpoint: create/book a new appointment.
  // Accepts a `BookAppointmentDto` in the request body. An optional
  // `Authorization` header may be forwarded for internal checks.
  book(
    @Body() dto: BookAppointmentDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.appointments.book(dto, authorization);
  }

  @Post(':id/doctor-approval')
  @UseGuards(AuthGuard('jwt'))
  doctorApproval(
    @Param('id') id: string,
    @Body() dto: DoctorApprovalDto,
    @Req() req: { user: JwtPayload },
  ) {
    // Only users with role `DOCTOR` may approve/reject an appointment.
    // The authenticated doctor's id (`req.user.sub`) is used to record
    // who made the decision. `dto.decision` is expected to be a boolean or
    // similar flag as defined in `DoctorApprovalDto`.
    if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Doctors only');
    }
    return this.appointments.setDoctorApproval(id, req.user.sub, dto.decision);
  }

  @Post(':id/cancel')
  // Cancel appointment by patient: expects `CancelAppointmentDto` with
  // the patient's email. Optional `Authorization` header may be forwarded
  // to authenticate/authorize the request upstream.
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.appointments.cancelByPatient(id, dto.patientEmail, authorization);
  }

  @Patch(':id/reschedule')
  // Reschedule an existing appointment. Body must match `RescheduleAppointmentDto`.
  reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.appointments.rescheduleAppointment(id, dto, authorization);
  }

  @Get('public/stats')
  // Public statistics endpoint: no auth required.
  publicStats() {
    return this.appointments.getPublicStats();
  }

  @Get()
  // List appointments for a patient by email (query param `patientEmail`).
  // This endpoint expects a non-empty `patientEmail` query parameter.
  listByEmail(@Query('patientEmail') patientEmail?: string) {
    if (!patientEmail?.trim()) {
      throw new ForbiddenException('patientEmail query required');
    }
    return this.appointments.listByPatientEmail(patientEmail);
  }

  @Get('patient/:patientId')
  @UseGuards(AuthGuard('jwt'))
  listForPatient(
    @Param('patientId') patientId: string,
    @Req() req: { user: JwtPayload },
  ) {
    // Authenticated endpoint for a patient to list their own appointments.
    // Enforces that the requester has role `PATIENT` and forwards the
    // authenticated user's id and email for additional checks in the service.
    if (req.user.role !== 'PATIENT') {
      throw new ForbiddenException('Patients only');
    }
    return this.appointments.listForPatient(
      patientId,
      req.user.sub,
      req.user.email,
    );
  }

  @Get('doctor/me')
  @UseGuards(AuthGuard('jwt'))
  listForDoctor(
    @Req() req: { user: JwtPayload },
    @Query('date') date?: string,
    @Query('fromDate') fromDate?: string,
    @Query('limit') limitRaw?: string,
  ) {
    // Authenticated endpoint for the currently logged-in doctor to list
    // their appointments. Optional query params:
    // - `date`: specific date to filter
    // - `fromDate`: start date for a range
    // - `limit`: numeric cap on results (sanitized and clamped in code)
    if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Doctors only');
    }
    const limit = limitRaw
      ? Math.min(200, Math.max(1, Number.parseInt(limitRaw, 10) || 0))
      : undefined;
    return this.appointments.listForDoctor(req.user.sub, {
      date: date?.trim(),
      fromDate: fromDate?.trim(),
      limit: limit && limit > 0 ? limit : undefined,
    });
  }

  @Get('doctor/me/stats')
  @UseGuards(AuthGuard('jwt'))
  doctorStats(
    @Req() req: { user: JwtPayload },
    @Query('month') month?: string,
  ) {
    // Authenticated endpoint to get aggregated stats for the logged-in doctor.
    if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Doctors only');
    }
    return this.appointments.getDoctorStats(req.user.sub, month);
  }

  @Get('admin/platform-summary')
  @UseGuards(AuthGuard('jwt'), AdminRoleGuard)
  platformSummary() {
    // Admin-only endpoint returning platform-wide summary metrics.
    return this.appointments.getPlatformSummary();
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), AdminRoleGuard)
  // Admin endpoint: list all appointments across the platform.
  // Optional `limit` query param controls pagination size.
  listAllForAdmin(@Query('limit') limitRaw?: string) {
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    return this.appointments.listAllForAdmin(limit);
  }

  @Get('admin/payments')
  @UseGuards(AuthGuard('jwt'), AdminRoleGuard)
  // Admin endpoint: list payment records. Optional `limit` controls result size.
  listPaymentsForAdmin(@Query('limit') limitRaw?: string) {
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    return this.appointments.listPaymentsForAdmin(limit);
  }
}
