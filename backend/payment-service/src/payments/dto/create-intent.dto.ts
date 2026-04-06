import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateIntentDto {
  @IsString()
  @MinLength(20)
  @MaxLength(32)
  appointmentId!: string;

  @IsEmail()
  patientEmail!: string;
}
