import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminOrgsController } from './admin-orgs.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminPlansController } from './admin-plans.controller';
import { AdminInvitesController } from './admin-invites.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminOrgsController,
    AdminUsersController,
    AdminPlansController,
    AdminInvitesController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
