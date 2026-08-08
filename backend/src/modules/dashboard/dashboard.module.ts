import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardEventsService } from './dashboard-events.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardEventsService],
  exports: [DashboardService, DashboardEventsService],
})
export class DashboardModule {}
