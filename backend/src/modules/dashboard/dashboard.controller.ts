import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('master', 'admin', 'employee')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('analytics')
  @Roles('master', 'admin', 'employee')
  getAnalytics() {
    return this.dashboardService.getAnalytics();
  }

  @Get('sales-analytics')
  @Roles('master', 'admin', 'employee')
  getSalesAnalytics() {
    return this.dashboardService.getSalesAnalytics();
  }
}
