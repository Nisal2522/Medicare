import { IsEmail } from 'class-validator';

export class CancelAppointmentDto {
  @IsEmail()
  patientEmail!: string;
}
