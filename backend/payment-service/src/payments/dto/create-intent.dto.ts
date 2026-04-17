import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateIntentDto {
  // The appointment ID for which the payment intent is being created.
  @IsString()
  @MinLength(20)
  @MaxLength(32)
  appointmentId!: string;

  // The email address of the patient for whom the payment intent is being created.
  @IsEmail()
  patientEmail!: string;
}
