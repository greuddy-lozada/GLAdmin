import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminApprovalsService } from './admin-approvals.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('admin/plans')
export class AdminPlansController {
  constructor(
    private readonly adminService: AdminService,
    private readonly approvalsService: AdminApprovalsService,
  ) {}

  @Get()
  @MinLevel(ROLE_LEVEL.admin)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.adminService.findAllPlans(pagination.page, pagination.limit);
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.master)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOnePlan(id);
  }

  @Post()
  @MinLevel(ROLE_LEVEL.admin)
  async create(@Body() dto: CreatePlanDto, @CurrentUser('id') userId: string) {
    const result = await this.adminService.createPlan(dto);
    await this.approvalsService.log({
      action: 'CREATE_PLAN',
      entity: 'Plan',
      entityId: result.data.id,
      description: `Created plan "${result.data.label}" (${result.data.name})`,
      performedById: userId,
      metadata: {
        name: result.data.name,
        label: result.data.label,
        amount: result.data.amount,
      },
    });
    return result;
  }

  @Patch(':id')
  @MinLevel(ROLE_LEVEL.admin)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser('id') userId: string,
  ) {
    const before = await this.adminService.findOnePlan(id);
    const result = await this.adminService.updatePlan(id, dto);
    await this.approvalsService.log({
      action: 'UPDATE_PLAN',
      entity: 'Plan',
      entityId: id,
      description: `Updated plan "${result.data.label}"`,
      performedById: userId,
      metadata: {
        oldValues: {
          name: before.name,
          label: before.label,
          amount: before.amount,
          currency: before.currency,
          interval: before.interval,
          maxUsers: before.maxUsers,
          isActive: before.isActive,
          features: before.features,
        },
        newValues: {
          name: result.data.name,
          label: result.data.label,
          amount: result.data.amount,
          currency: result.data.currency,
          interval: result.data.interval,
          maxUsers: result.data.maxUsers,
          isActive: result.data.isActive,
          features: result.data.features,
        },
      },
    });
    return result;
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.removePlan(id);
  }
}
