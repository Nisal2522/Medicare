import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/jwt.strategy';
import { MedicalFileStorageService } from '../storage/medical-file.storage.service';
import { S3Service } from '../storage/s3.service';
import {
  AppointmentAccess,
  AppointmentAccessSchema,
} from './appointment-access.schema';
import { MedicalRecord, MedicalRecordSchema } from './medical-record.schema';
import {
  PatientPayment,
  PatientPaymentSchema,
} from './patient-payment.schema';
import { PatientProfile, PatientProfileSchema } from './patient-profile.schema';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppointmentAccess.name, schema: AppointmentAccessSchema },
      { name: MedicalRecord.name, schema: MedicalRecordSchema },
      { name: PatientProfile.name, schema: PatientProfileSchema },
      { name: PatientPayment.name, schema: PatientPaymentSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [PatientsController],
  providers: [
    PatientsService,
    S3Service,
    MedicalFileStorageService,
    JwtStrategy,
  ],
})
export class PatientsModule {}
