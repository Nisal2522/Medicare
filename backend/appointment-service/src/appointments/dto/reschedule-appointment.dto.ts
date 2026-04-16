import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsEmail()
  patientEmail!: string;

  @IsString()
  @IsNotEmpty()
  appointmentDate!: string;

  @IsString()
  @IsNotEmpty()
  day!: string;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;
}
