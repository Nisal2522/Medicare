import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  // The email address of the patient requesting to reschedule the appointment.
  @IsEmail()
  patientEmail!: string;

  // The name of the patient requesting to reschedule the appointment.
  @IsString()
  @IsNotEmpty()
  appointmentDate!: string;

  // The name of the patient requesting to reschedule the appointment.
  @IsString()
  @IsNotEmpty()
  day!: string;

  // The name of the patient requesting to reschedule the appointment.
  @IsString()
  @IsNotEmpty()
  startTime!: string;
 
  // The name of the patient requesting to reschedule the appointment.
  @IsString()
  @IsNotEmpty()
  endTime!: string;
}
