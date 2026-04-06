import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ConfirmIntentDto {
  @IsString()
  @MinLength(20)
  @MaxLength(32)
  appointmentId!: string;

  @IsString()
  @Matches(/^pi_[A-Za-z0-9_]+$/)
  paymentIntentId!: string;

  @IsEmail()
  patientEmail!: string;
}
