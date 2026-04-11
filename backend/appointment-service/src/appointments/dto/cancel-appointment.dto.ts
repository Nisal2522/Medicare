import { IsEmail } from 'class-validator';

// DTO for canceling an appointment. It contains the email address of the patient who wants to cancel the appointment.
export class CancelAppointmentDto {
  @IsEmail()
  patientEmail!: string;
}
