import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    orgId: string;
    orgRole: string;
  };
}

@Controller('reports')
@PlanLevel('free')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @MinOrgLevel(ROLE_LEVEL.manager)
  generate(@Body() dto: GenerateReportDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id ?? 'unknown';
    return this.reportsService.generate(dto, userId);
  }

  @Get()
  @MinOrgLevel(ROLE_LEVEL.employee)
  findAll(@Query() query: ReportQueryDto) {
    return this.reportsService.findAll(query);
  }

  @Get('types')
  @MinOrgLevel(ROLE_LEVEL.employee)
  getTypes() {
    return this.reportsService.getTypes();
  }

  @Get(':id')
  @MinOrgLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.findOne(id);
  }

  @Delete(':id')
  @MinOrgLevel(ROLE_LEVEL.executive)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.remove(id);
  }
}
