import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { JwtPayload } from '../auth/jwt.strategy';
import { DoctorsService } from './doctors.service';
import { DoctorSearchQueryDto } from './dto/doctor-search-query.dto';
import { PatchAvailabilityDto } from './dto/patch-availability.dto';
import { PatchDoctorProfileDto } from './dto/patch-doctor-profile.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}
  private static readonly avatarUploadLimits = {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  };

  @Get('search')
  search(@Query() query: DoctorSearchQueryDto) {
    return this.doctorsService.search(query);
  }

  @Patch('availability')
  @UseGuards(AuthGuard('jwt'))
  patchAvailability(
    @Req() req: { user: JwtPayload },
    @Body() dto: PatchAvailabilityDto,
  ) {
    return this.doctorsService.updateAvailability(
      req.user.sub,
      req.user.role,
      dto,
    );
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  patchProfile(
    @Req() req: { user: JwtPayload },
    @Body() dto: PatchDoctorProfileDto,
  ) {
    return this.doctorsService.updateProfile(req.user.sub, req.user.role, dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  findMe(@Req() req: { user: JwtPayload }) {
    if (req.user.role !== 'DOCTOR') {
      throw new BadRequestException('Doctors only');
    }
    return this.doctorsService.findById(req.user.sub);
  }

  @Post('profile/photo')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', DoctorsController.avatarUploadLimits),
  )
  uploadProfilePhoto(
    @Req() req: { user: JwtPayload },
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    return this.doctorsService.uploadProfilePhoto(
      req.user.sub,
      req.user.role,
      file,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findById(id);
  }
}
