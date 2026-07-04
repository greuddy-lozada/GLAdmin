import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';

@Injectable()
export class SubscriptionLifecycleCron {
  private readonly logger = new Logger(SubscriptionLifecycleCron.name);

  constructor(
    private readonly lifecycleService: SubscriptionLifecycleService,
  ) {}

  @Cron('0 3 * * *')
  async handleSubscriptionCheck() {
    this.logger.log('Running subscription lifecycle check');
    await this.lifecycleService.evaluateAllActive();
    this.logger.log('Subscription lifecycle check complete');
  }
}
