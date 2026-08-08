import { Controller, Get, MessageEvent, Sse } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { DashboardEventsService } from './dashboard-events.service';
import { ContextService } from '../tenant/context.service';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';

@Controller('dashboard')
@PlanLevel('free')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly events: DashboardEventsService,
    private readonly context: ContextService,
  ) {}

  @Get('overview')
  @MinOrgLevel(ROLE_LEVEL.employee)
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Sse('stream')
  @MinOrgLevel(ROLE_LEVEL.employee)
  stream(): Observable<MessageEvent> {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) {
      throw new Error('No organization context');
    }
    return this.events.observe(orgId).pipe(
      map(
        (msg): MessageEvent => ({
          type: msg.type,
          data: msg.data as object,
        }),
      ),
    );
  }

  @Get('stats')
  @MinOrgLevel(ROLE_LEVEL.employee)
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('analytics')
  @MinOrgLevel(ROLE_LEVEL.employee)
  getAnalytics() {
    return this.dashboardService.getAnalytics();
  }

  @Get('sales-analytics')
  @MinOrgLevel(ROLE_LEVEL.employee)
  getSalesAnalytics() {
    return this.dashboardService.getSalesAnalytics();
  }
}
