import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminOrgsController } from './admin-orgs.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminPlansController } from './admin-plans.controller';
import { AdminInvitesController } from './admin-invites.controller';
import { AdminApprovalsController } from './admin-approvals.controller';
import { AdminApprovalsService } from './admin-approvals.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminOrgsController,
    AdminUsersController,
    AdminPlansController,
    AdminInvitesController,
    AdminApprovalsController,
  ],
  providers: [AdminService, AdminApprovalsService],
})
export class AdminModule {}
