import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  SUBSCRIPTION_STATUS,
  GRACE_PERIOD_DAYS,
  SUBSCRIPTION_DURATION_DAYS,
} from './constants';

@Injectable()
export class SubscriptionLifecycleService {
  private readonly logger = new Logger(SubscriptionLifecycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async evaluateSubscription(organizationId: number): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        planId: true,
        plan: { select: { name: true } },
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
      },
    });
    if (!org) return;

    if (!org.planId) {
      if (org.subscriptionStatus !== SUBSCRIPTION_STATUS.INACTIVE) {
        await this.prisma.organization.update({
          where: { id: organizationId },
          data: {
            subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
            subscriptionExpiresAt: null,
          },
        });
      }
      return;
    }

    if (org.plan?.name === 'free') {
      if (org.subscriptionStatus !== SUBSCRIPTION_STATUS.INACTIVE) {
        await this.prisma.organization.update({
          where: { id: organizationId },
          data: {
            subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
            subscriptionExpiresAt: null,
          },
        });
      }
      return;
    }

    if (!org.subscriptionExpiresAt) {
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
          subscriptionExpiresAt: new Date(
            Date.now() + SUBSCRIPTION_DURATION_DAYS * 86400000,
          ),
        },
      });
      return;
    }

    const now = new Date();

    if (org.subscriptionExpiresAt > now) {
      if (org.subscriptionStatus !== SUBSCRIPTION_STATUS.ACTIVE) {
        await this.prisma.organization.update({
          where: { id: organizationId },
          data: { subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE },
        });
      }
      return;
    }

    const daysSinceExpiry = Math.floor(
      (now.getTime() - org.subscriptionExpiresAt.getTime()) / 86400000,
    );

    if (daysSinceExpiry <= GRACE_PERIOD_DAYS) {
      if (org.subscriptionStatus !== SUBSCRIPTION_STATUS.PAST_DUE) {
        await this.prisma.organization.update({
          where: { id: organizationId },
          data: { subscriptionStatus: SUBSCRIPTION_STATUS.PAST_DUE },
        });
      }
      return;
    }

    const freePlan = await this.prisma.plan.findUnique({
      where: { name: 'free' },
    });
    if (!freePlan) {
      this.logger.warn(
        `Free plan not found, cannot downgrade org ${organizationId}`,
      );
      return;
    }

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        planId: freePlan.id,
        subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
        subscriptionExpiresAt: null,
      },
    });
    this.logger.log(`Organization ${organizationId} downgraded to Free plan`);
  }

  async evaluateAllActive(): Promise<void> {
    const orgs = await this.prisma.organization.findMany({
      where: {
        planId: { not: null },
        deletedAt: null,
      },
      select: { id: true },
    });

    for (const org of orgs) {
      try {
        await this.evaluateSubscription(org.id);
      } catch (error) {
        this.logger.error(`Failed to evaluate org ${org.id}`, error);
      }
    }
  }
}
