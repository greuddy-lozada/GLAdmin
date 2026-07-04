import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionPaymentService } from './subscription-payment.service';
import { SubscriptionPaymentController } from './subscription-payment.controller';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import { SubscriptionLifecycleCron } from './subscription-lifecycle.cron';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [SubscriptionPaymentController],
  providers: [
    SubscriptionPaymentService,
    SubscriptionLifecycleService,
    SubscriptionLifecycleCron,
  ],
  exports: [SubscriptionLifecycleService],
})
export class SubscriptionsModule {}
