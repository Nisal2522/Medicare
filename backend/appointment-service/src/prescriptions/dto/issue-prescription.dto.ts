import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class MedicineLineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  dosage!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  frequency?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  duration!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  instructions?: string;
}

export class IssuePrescriptionDto {
  @IsString()
  @IsNotEmpty()
  appointmentId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  diagnosis!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  symptoms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  clinicalNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  specialAdvice?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  labTests?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  patientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  patientAge?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  patientGender?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MedicineLineDto)
  medicines!: MedicineLineDto[];
}
