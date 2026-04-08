import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DoctorsService } from '../doctors/doctors.service';
import { ProvisionDoctorDto } from './dto/provision-doctor.dto';
import { SetDoctorActiveDto } from './dto/set-doctor-active.dto';
import { InternalKeyGuard } from './internal-key.guard';

@Controller('internal/doctors')
export class InternalDoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post('provision')
  @UseGuards(InternalKeyGuard)
  provision(@Body() dto: ProvisionDoctorDto) {
    return this.doctorsService.provisionFromAuth(dto.userId, dto.fullName);
  }

  @Post('set-active')
  @UseGuards(InternalKeyGuard)
  setActive(@Body() dto: SetDoctorActiveDto) {
    return this.doctorsService.setActiveByInternal(dto.userId, dto.isActive);
  }
}
