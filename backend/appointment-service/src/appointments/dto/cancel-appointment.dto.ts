// Data Transfer Object for cancelling an appointment.
// Uses class-validator to validate incoming request data.

import { IsEmail } from 'class-validator';

export class CancelAppointmentDto {
  // Required: patient's email used to identify the appointment to cancel
  @IsEmail()
  patientEmail!: string;
}