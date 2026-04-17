// AppointmentsModule
// - Registers MongoDB models, authentication, HTTP client, and message clients.
// - Exposes controllers and providers for appointment-related functionality.
// Keep comments concise to help future maintainers understand module wiring.
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
    // Mongoose schemas used by this module
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
    ]),

    // Authentication: Passport with JWT strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      // Use env var in production; fallback for local dev
      secret: process.env.JWT_SECRET ?? 'change-me-secret',
    }),

    // Outgoing HTTP client configuration
    HttpModule.register({ timeout: 12_000, maxRedirects: 3 }),

    // RabbitMQ clients used to publish notifications and patient events
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

  // Controllers exposed by this module
  controllers: [
    AppointmentsController,
    InternalAppointmentsController,
    PrescriptionsController,
  ],

  // Services and providers instantiated in this module
  providers: [
    AppointmentsService,
    PrescriptionsService,
    JwtStrategy,
    PaymentSuccessListener,
    InternalKeyGuard,
  ],

  // Export the main service for use in other modules
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
