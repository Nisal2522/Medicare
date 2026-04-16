import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/jwt.strategy';
import { InternalAppointmentsController } from '../internal/internal-appointments.controller';
import { InternalKeyGuard } from '../internal/internal-key.guard';
import { PrescriptionsController } from '../prescriptions/prescriptions.controller';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { Prescription, PrescriptionSchema } from '../prescriptions/prescription.schema';
import { Appointment, AppointmentSchema } from './appointment.schema';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PaymentSuccessListener } from './payment-success.listener';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-secret',
    }),
    HttpModule.register({ timeout: 12_000, maxRedirects: 3 }),
    ClientsModule.register([
      {
        name: 'NOTIFICATIONS_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
          queue: 'notifications_queue',
          queueOptions: { durable: true },
        },
      },
      {
        name: 'PATIENT_EVENTS_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
          queue: 'patient_events_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [
    AppointmentsController,
    InternalAppointmentsController,
    PrescriptionsController,
  ],
  providers: [
    AppointmentsService,
    PrescriptionsService,
    JwtStrategy,
    PaymentSuccessListener,
    InternalKeyGuard,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
