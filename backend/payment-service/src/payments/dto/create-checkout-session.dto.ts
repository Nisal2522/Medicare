import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Stripe Checkout expects success_url with literal `{CHECKOUT_SESSION_ID}`.
 * @IsUrl() rejects that placeholder, so we only require http(s) + host.
 */
export class CreateCheckoutSessionDto {
  @IsString()
  @MinLength(20)
  @MaxLength(32)
  appointmentId!: string;

  @IsEmail()
  patientEmail!: string;

  @IsString()
  @MinLength(12)
  @Matches(/^https?:\/\/[^\s]+$/i, {
    message: 'successUrl must be a valid http(s) URL',
  })
  successUrl!: string;

  @IsString()
  @MinLength(12)
  @Matches(/^https?:\/\/[^\s]+$/i, {
    message: 'cancelUrl must be a valid http(s) URL',
  })
  cancelUrl!: string;
}
