import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  SUBSCRIPTION_STATUS,
  GRACE_PERIOD_DAYS,
  SUBSCRIPTION_DURATION_DAYS,
  DAY_MS,
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
            Date.now() + SUBSCRIPTION_DURATION_DAYS * DAY_MS,
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
      (now.getTime() - org.subscriptionExpiresAt.getTime()) / DAY_MS,
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
    const BATCH_SIZE = 100;
    const CONCURRENCY = 10;
    let cursor: number | undefined;

    do {
      const orgs = await this.prisma.organization.findMany({
        where: {
          planId: { not: null },
          deletedAt: null,
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
      });

      for (let i = 0; i < orgs.length; i += CONCURRENCY) {
        const chunk = orgs.slice(i, i + CONCURRENCY);
        await Promise.allSettled(
          chunk.map((org) =>
            this.evaluateSubscription(org.id).catch((error) => {
              this.logger.error(`Failed to evaluate org ${org.id}`, error);
            }),
          ),
        );
      }

      cursor =
        orgs.length === BATCH_SIZE ? orgs[orgs.length - 1].id : undefined;
    } while (cursor);
  }
}
