import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AdminDoctorsController } from '../admin/admin-doctors.controller';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { InternalDoctorsController } from '../internal/internal-doctors.controller';
import { InternalKeyGuard } from '../internal/internal-key.guard';
import { S3Service } from '../storage/s3.service';
import { Doctor, DoctorSchema } from './doctor.schema';
import { DoctorRepository } from './doctor.repository';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Doctor.name, schema: DoctorSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [
    DoctorsController,
    AdminDoctorsController,
    InternalDoctorsController,
  ],
  providers: [
    DoctorsService,
    S3Service,
    DoctorRepository,
    JwtStrategy,
    RolesGuard,
    InternalKeyGuard,
  ],
})
export class DoctorsModule {}
