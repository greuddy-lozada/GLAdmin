import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthFactory } from './auth.factory';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SubscriptionsModule } from '../subscriptions/subscription-payments.module';

@Module({
  imports: [UsersModule, PrismaModule, AuditLogModule, SubscriptionsModule],
  controllers: [AuthController],
  providers: [AuthService, AuthFactory],
})
export class AuthModule {}
