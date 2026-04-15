import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PatientsService } from './patients.service';

type UserRegisteredV1Event = {
  userId: string;
  email: string;
  fullName: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
};

type AppointmentUpsertedV1Event = {
  appointmentId: string;
  doctorId: string;
  patientId?: string;
  status: string;
  doctorApprovalStatus: string;
};

type PatientPaymentRecordedV1Event = {
  appointmentId: string;
  amountCents: number;
  currency: string;
  status: 'paid' | 'failed';
  description: string;
  reference?: string;
};

@Controller()
export class PatientEventsListener {
  private readonly logger = new Logger(PatientEventsListener.name);
  private static readonly USER_REGISTERED_V1 = 'UserRegistered.v1';
  private static readonly APPOINTMENT_UPSERTED_V1 = 'AppointmentUpserted.v1';
  private static readonly PATIENT_PAYMENT_RECORDED_V1 = 'PatientPaymentRecorded.v1';

  constructor(private readonly patientsService: PatientsService) {}

  @EventPattern(PatientEventsListener.USER_REGISTERED_V1)
  async onUserRegistered(
    @Payload() event: UserRegisteredV1Event,
  ): Promise<void> {
    // Idempotent upsert supports at-least-once delivery semantics from RabbitMQ.
    if (event.role !== 'PATIENT') return;
    await this.patientsService.ensureProfileForRegisteredPatient(event.userId);
    this.logger.log(`Patient profile ensured for user ${event.userId}`);
  }

  @EventPattern(PatientEventsListener.APPOINTMENT_UPSERTED_V1)
  async onAppointmentUpserted(
    @Payload() event: AppointmentUpsertedV1Event,
  ): Promise<void> {
    await this.patientsService.upsertAppointmentAccessProjection(event);
    this.logger.log(
      `Appointment projection synced for appointment ${event.appointmentId}`,
    );
  }

  @EventPattern(PatientEventsListener.PATIENT_PAYMENT_RECORDED_V1)
  async onPatientPaymentRecorded(
    @Payload() event: PatientPaymentRecordedV1Event,
  ): Promise<void> {
    await this.patientsService.recordPatientPaymentProjection(event);
    this.logger.log(
      `Patient payment projection synced for appointment ${event.appointmentId}`,
    );
  }
}

