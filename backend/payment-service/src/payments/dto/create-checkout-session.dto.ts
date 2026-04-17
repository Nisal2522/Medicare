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
  // The appointment ID for which the checkout session is being created.
  @IsString()
  @MinLength(20)
  @MaxLength(32)
  appointmentId!: string;
  // The email address of the patient for whom the checkout session is being created.
  @IsEmail()
  patientEmail!: string;

  // The URL to which the user will be redirected after a successful payment. It must be a valid HTTP or HTTPS URL.
  @IsString()
  @MinLength(12)
  @Matches(/^https?:\/\/[^\s]+$/i, {
    message: 'successUrl must be a valid http(s) URL',
  })
  successUrl!: string;

  // The URL to which the user will be redirected if they cancel the payment process. It must be a valid HTTP or HTTPS URL.
  @IsString()
  @MinLength(12)
  @Matches(/^https?:\/\/[^\s]+$/i, {
    message: 'cancelUrl must be a valid http(s) URL',
  })
  cancelUrl!: string;
}
