// Data Transfer Object used when rescheduling an appointment.
// Validators from `class-validator` ensure incoming request data is well-formed.
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  // Required: patient's email used to locate the existing appointment
  @IsEmail()
  patientEmail!: string;

  // Required: new appointment date as a string (e.g., ISO date or formatted date)
  @IsString()
  @IsNotEmpty()
  appointmentDate!: string;

  // Required: day of the week for the rescheduled appointment (e.g., "Monday")
  @IsString()
  @IsNotEmpty()
  day!: string;

  // Required: new appointment start time (e.g., "09:00")
  @IsString()
  @IsNotEmpty()
  startTime!: string;
 

  // Required: new appointment end time (e.g., "09:30")
  @IsString()
  @IsNotEmpty()
  endTime!: string;
}
