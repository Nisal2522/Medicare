import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtPayload } from '../auth/jwt.strategy';
import { IssuePrescriptionDto } from './dto/issue-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  @Post('issue')
  @UseGuards(AuthGuard('jwt'))
  issue(
    @Req() req: { user: JwtPayload },
    @Body() dto: IssuePrescriptionDto,
  ) {
    if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Doctors only');
    }
    return this.prescriptions.issue(req.user, dto);
  }

  @Get('doctor/me')
  @UseGuards(AuthGuard('jwt'))
  listForDoctor(
    @Req() req: { user: JwtPayload },
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Doctors only');
    }
    return this.prescriptions.listForDoctor(req.user.sub, {
      q,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('doctor/me/:id')
  @UseGuards(AuthGuard('jwt'))
  getDoctorPrescription(
    @Req() req: { user: JwtPayload },
    @Param('id') id: string,
  ) {
    if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Doctors only');
    }
    return this.prescriptions.getForDoctor(req.user.sub, id);
  }

  @Get('patient/me')
  @UseGuards(AuthGuard('jwt'))
  listForPatient(
    @Req() req: { user: JwtPayload },
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    if (req.user.role !== 'PATIENT') {
      throw new ForbiddenException('Patients only');
    }
    return this.prescriptions.listForPatient(req.user.sub, {
      q,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('patient/me/:id')
  @UseGuards(AuthGuard('jwt'))
  getPatientPrescription(
    @Req() req: { user: JwtPayload },
    @Param('id') id: string,
  ) {
    if (req.user.role !== 'PATIENT') {
      throw new ForbiddenException('Patients only');
    }
    return this.prescriptions.getForPatient(req.user.sub, id);
  }
}
