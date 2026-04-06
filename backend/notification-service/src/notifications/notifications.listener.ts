import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationDispatcherService } from './notification-dispatcher.service';

@Controller()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly dispatcher: NotificationDispatcherService) {}

  @EventPattern('appointment_created')
  async onAppointmentCreated(
    @Payload()
    data: {
      patientEmail: string;
      patientPhone?: string;
      doctorPhone?: string;
      doctorEmail?: string;
      appointment: Record<string, unknown>;
    },
  ): Promise<void> {
    this.logger.log(`appointment_created → ${data.patientEmail}`);
    await this.dispatcher.onBookingConfirmation({
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      doctorPhone: data.doctorPhone,
      doctorEmail: data.doctorEmail,
      appointment: data.appointment,
    });
  }

  @EventPattern('video_call_reminder')
  async onVideoReminder(
    @Payload()
    data: {
      patientEmail: string;
      patientPhone?: string;
      doctorPhone?: string;
      doctorEmail?: string;
      appointment: Record<string, unknown>;
    },
  ): Promise<void> {
    this.logger.log(`video_call_reminder → ${data.patientEmail}`);
    await this.dispatcher.onVideoReminder(data);
  }

  @EventPattern('prescription_ready')
  async onPrescriptionReady(
    @Payload()
    data: {
      patientEmail: string;
      patientPhone?: string;
      doctorName?: string;
      appointmentId: string;
      prescription: Record<string, unknown>;
    },
  ): Promise<void> {
    this.logger.log(`prescription_ready → ${data.patientEmail}`);
    await this.dispatcher.onPrescriptionReady(data);
  }

  @EventPattern('appointment_doctor_approved')
  async onDoctorApproval(
    @Payload()
    data: {
      patientEmail: string;
      patientPhone?: string;
      doctorName?: string;
      appointment: Record<string, unknown>;
    },
  ): Promise<void> {
    this.logger.log(`appointment_doctor_approved → ${data.patientEmail}`);
    await this.dispatcher.onDoctorApproval({
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      doctorName: data.doctorName,
      appointment: data.appointment,
    });
  }
}
