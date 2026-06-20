import { Module } from '@nestjs/common';
import { SubscriptionPaymentService } from './subscription-payment.service';
import { SubscriptionPaymentController } from './subscription-payment.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionPaymentController],
  providers: [SubscriptionPaymentService],
})
export class SubscriptionsModule {}
