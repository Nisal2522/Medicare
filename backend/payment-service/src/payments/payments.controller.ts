import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { ConfirmIntentDto } from './dto/confirm-intent.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreateIntentDto } from './dto/create-intent.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('create-checkout-session')
  createCheckout(@Body() dto: CreateCheckoutSessionDto) {
    return this.payments.createCheckoutSession(dto);
  }

  @Post('create-intent')
  createIntent(@Body() dto: CreateIntentDto) {
    return this.payments.createPaymentIntent(dto);
  }

  @Post('reconcile-intent')
  reconcileIntent(@Body() dto: CreateIntentDto) {
    return this.payments.reconcileIntent(dto);
  }

  @Post('confirm-intent')
  confirmIntent(@Body() dto: ConfirmIntentDto) {
    return this.payments.confirmIntent(dto);
  }

  @Get('config')
  config() {
    return this.payments.publishableKey();
  }

  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const raw = req.rawBody;
    if (!Buffer.isBuffer(raw)) {
      throw new BadRequestException('Raw body required for Stripe webhook');
    }
    return this.payments.handleStripeWebhook(raw, signature ?? '');
  }
}
