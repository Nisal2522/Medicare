// Data Transfer Object for booking an appointment.
// Uses class-validator decorators to enforce input validation
// and class-transformer to coerce types where needed.

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
  // Required: ID of the doctor (must be a non-empty string)
  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  // Required: patient's email (must be a valid email)
  @IsEmail()
  patientEmail!: string;

  // Required: patient's full name (string, non-empty, max length 200)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  patientName!: string;

  // Required: appointment date as string (e.g., ISO date or formatted date string)
  @IsString()
  @IsNotEmpty()
  appointmentDate!: string;

  // Required: day of the appointment (string, e.g., "Monday")
  @IsString()
  @IsNotEmpty()
  day!: string;

  // Required: appointment start time (string, e.g., "09:00")
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  // Required: appointment end time (string, e.g., "09:30")
  @IsString()
  @IsNotEmpty()
  endTime!: string;

  // Optional: consultation fee (transformed to Number, must be a number, minimum 0)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  // Optional: patient phone (string, max length 32)
  @IsOptional()
  @IsString()
  @MaxLength(32)
  patientPhone?: string;

  // Optional: doctor phone (string, max length 32)
  @IsOptional()
  @IsString()
  @MaxLength(32)
  doctorPhone?: string;

  // Optional: doctor email (must be a valid email if provided)
  @IsOptional()
  @IsEmail()
  doctorEmail?: string;
}