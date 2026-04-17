import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ConfirmIntentDto { 
  // The appointment ID associated with the payment intent.
  @IsString()
  @MinLength(20)
  @MaxLength(32)
  appointmentId!: string;

  // The payment intent ID. It should follow the format "pi_" followed by alphanumeric characters and underscores.
  @IsString()
  @Matches(/^pi_[A-Za-z0-9_]+$/)
  paymentIntentId!: string;

  // The email address of the patient.
  @IsEmail()
  patientEmail!: string;
}
