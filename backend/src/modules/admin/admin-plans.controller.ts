import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @MinLevel(ROLE_LEVEL.master)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.adminService.findAllPlans(pagination.page, pagination.limit);
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.master)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findOnePlan(id);
  }

  @Post()
  @MinLevel(ROLE_LEVEL.master)
  create(@Body() dto: CreatePlanDto) {
    return this.adminService.createPlan(dto);
  }

  @Patch(':id')
  @MinLevel(ROLE_LEVEL.master)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePlanDto) {
    return this.adminService.updatePlan(id, dto);
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removePlan(id);
  }
}
