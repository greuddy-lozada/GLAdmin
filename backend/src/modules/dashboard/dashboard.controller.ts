import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';

@Controller('dashboard')
@PlanLevel('free')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @MinLevel(ROLE_LEVEL.employee)
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('analytics')
  @MinLevel(ROLE_LEVEL.employee)
  getAnalytics() {
    return this.dashboardService.getAnalytics();
  }

  @Get('sales-analytics')
  @MinLevel(ROLE_LEVEL.employee)
  getSalesAnalytics() {
    return this.dashboardService.getSalesAnalytics();
  }
}
