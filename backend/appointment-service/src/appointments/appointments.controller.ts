import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
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

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post('book')
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
    if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Doctors only');
    }
    return this.appointments.setDoctorApproval(id, req.user.sub, dto.decision);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.appointments.cancelByPatient(id, dto.patientEmail, authorization);
  }

  @Get('public/stats')
  publicStats() {
    return this.appointments.getPublicStats();
  }

  @Get()
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
    if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Doctors only');
    }
    return this.appointments.getDoctorStats(req.user.sub, month);
  }

  @Get('admin/platform-summary')
  @UseGuards(AuthGuard('jwt'), AdminRoleGuard)
  platformSummary() {
    return this.appointments.getPlatformSummary();
  }
}
