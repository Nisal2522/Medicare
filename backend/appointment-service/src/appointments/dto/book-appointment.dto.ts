import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class BookAppointmentDto {
  // TODO: Add validation
  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  // The email address of the patient booking the appointment.
  @IsEmail()
  patientEmail!: string;

  // The name of the patient booking the appointment.
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  patientName!: string;

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

  // The reason for the appointment, provided by the patient.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  // The phone number of the patient booking the appointment.
  @IsOptional()
  @IsString()
  @MaxLength(32)
  patientPhone?: string;

  // The phone number of the doctor for the appointment.
  @IsOptional()
  @IsString()
  @MaxLength(32)
  doctorPhone?: string;

  // The email address of the doctor for the appointment.
  @IsOptional()
  @IsEmail()
  doctorEmail?: string;
}
