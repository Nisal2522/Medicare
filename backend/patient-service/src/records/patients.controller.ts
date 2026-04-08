import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UploadReportBodyDto } from './dto/upload-report-body.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PatientsService } from './patients.service';

const uploadLimits = {
  storage: memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
};

const avatarUploadLimits = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
};

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('upload-report')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file', uploadLimits))
  async uploadReport(
    @Req() req: { user: JwtPayload },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadReportBodyDto,
  ) {
    if (req.user.role !== 'PATIENT') {
      throw new ForbiddenException('Only patients can upload reports');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    return this.patientsService.uploadPatientReport(req.user.sub, file, {
      title: body?.title,
      category: body?.category,
      doctorName: body?.doctorName,
      specialty: body?.specialty,
    });
  }

  @Post('upload-avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file', avatarUploadLimits))
  async uploadAvatar(
    @Req() req: { user: JwtPayload },
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (req.user.role !== 'PATIENT') {
      throw new ForbiddenException('Only patients can upload a profile photo');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    return this.patientsService.uploadPatientAvatar(req.user.sub, file);
  }

  @Get(':id/profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(
    @Req() req: { user: JwtPayload },
    @Param('id') patientId: string,
  ) {
    if (req.user.role === 'PATIENT') {
      if (req.user.sub !== patientId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Access denied');
    }
    return this.patientsService.getPatientProfile(patientId);
  }

  @Patch(':id/profile')
  @UseGuards(AuthGuard('jwt'))
  updateProfile(
    @Req() req: { user: JwtPayload },
    @Param('id') patientId: string,
    @Body() body: UpdatePatientProfileDto,
  ) {
    if (req.user.role !== 'PATIENT') {
      throw new ForbiddenException('Only patients can update their profile');
    }
    if (req.user.sub !== patientId) {
      throw new ForbiddenException('Access denied');
    }
    return this.patientsService.updatePatientProfile(patientId, body);
  }

  @Get(':id/records')
  @UseGuards(AuthGuard('jwt'))
  getRecords(
    @Req() req: { user: JwtPayload },
    @Param('id') patientId: string,
  ) {
    if (req.user.role === 'PATIENT') {
      if (req.user.sub !== patientId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (req.user.role === 'DOCTOR') {
      /* Demo: treat JWT as trusted clinician; production should verify care relationship. */
    } else {
      throw new ForbiddenException('Access denied');
    }
    return this.patientsService.getRecordsForPatient(patientId);
  }

  @Delete(':id/records/:recordId')
  @UseGuards(AuthGuard('jwt'))
  deleteRecord(
    @Req() req: { user: JwtPayload },
    @Param('id') patientId: string,
    @Param('recordId') recordId: string,
  ) {
    if (req.user.role !== 'PATIENT') {
      throw new ForbiddenException('Only patients can delete their documents');
    }
    if (req.user.sub !== patientId) {
      throw new ForbiddenException('Access denied');
    }
    return this.patientsService.deletePatientRecord(patientId, recordId);
  }

  @Get(':id/prescriptions')
  @UseGuards(AuthGuard('jwt'))
  getPrescriptions(
    @Req() req: { user: JwtPayload },
    @Param('id') patientId: string,
  ) {
    if (req.user.role === 'PATIENT') {
      if (req.user.sub !== patientId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Access denied');
    }
    return this.patientsService.getPrescriptionsForPatient(patientId);
  }

  @Get(':id/payments')
  @UseGuards(AuthGuard('jwt'))
  getPayments(
    @Req() req: { user: JwtPayload },
    @Param('id') patientId: string,
  ) {
    if (req.user.role === 'PATIENT') {
      if (req.user.sub !== patientId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Access denied');
    }
    return this.patientsService.getPaymentsForPatient(patientId);
  }
}
