import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../shared/prisma/prisma.service';

function getStripeInstance() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }
  return new Stripe(key, { apiVersion: '2025-04-30' as any });
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCheckoutSession(planId: number, organizationId: number) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (!plan.isActive) throw new BadRequestException('Plan is not active');

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const stripe = getStripeInstance();
    if (!stripe) {
      throw new BadRequestException('BILLING.STRIPE_NOT_CONFIGURED');
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: plan.currency,
              product_data: { name: plan.label },
              unit_amount: plan.amount * 100,
              recurring: { interval: plan.interval as 'month' | 'year' },
            },
            quantity: 1,
          },
        ],
        metadata: {
          organizationId: String(organizationId),
          planId: String(planId),
        },
        success_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin/plans?success=true`,
        cancel_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin/plans?canceled=true`,
      });

      return { url: session.url, sessionId: session.id };
    } catch (err: any) {
      throw new InternalServerErrorException(
        err?.message ?? 'BILLING.CHECKOUT_ERROR',
      );
    }
  }

  async handleWebhook(event: any) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const organizationId = Number(session.metadata?.organizationId);
      const planId = Number(session.metadata?.planId);

      if (!organizationId || !planId) return;

      await this.prisma.organization.update({
        where: { id: organizationId },
        data: { planId },
      });
    }
  }
}
