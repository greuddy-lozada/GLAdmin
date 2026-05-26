import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { CreateCheckoutSessionDto } from './create-checkout-session.dto';
import { MinLevel, ROLE_LEVEL } from '../../common/decorators/min-level.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout-session')
  @MinLevel(ROLE_LEVEL.master)
  createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.paymentsService.createCheckoutSession(dto.planId, dto.organizationId);
  }

  @Post('stripe-webhook')
  @Public()
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new BadRequestException('Stripe is not configured');
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    const stripe = new Stripe(key, { apiVersion: '2025-04-30' as any });
    const rawBody = (req as any).rawBody;

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch {
      throw new BadRequestException('Invalid stripe signature');
    }

    await this.paymentsService.handleWebhook(event);
    return { received: true };
  }
}
