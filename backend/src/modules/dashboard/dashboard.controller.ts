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
}
