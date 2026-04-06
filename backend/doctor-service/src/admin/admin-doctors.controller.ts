import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DoctorsService } from '../doctors/doctors.service';

@Controller('admin/doctors')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class AdminDoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  list() {
    return this.doctorsService.listAllForAdmin();
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string) {
    return this.doctorsService.verifyDoctorByAdmin(id);
  }
}
