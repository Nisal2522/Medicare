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
  
  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  @IsEmail()
  patientEmail!: string;

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

 
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consultationFee?: number;

 
  @IsOptional()
  @IsString()
  @MaxLength(32)
  patientPhone?: string;

 
  @IsOptional()
  @IsString()
  @MaxLength(32)
  doctorPhone?: string;

 
  @IsOptional()
  @IsEmail()
  doctorEmail?: string;
}
