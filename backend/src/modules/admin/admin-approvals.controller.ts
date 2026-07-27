import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AdminApprovalsService } from './admin-approvals.service';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin/approvals')
export class AdminApprovalsController {
  constructor(private readonly approvalsService: AdminApprovalsService) {}

  @Get()
  @MinLevel(ROLE_LEVEL.master)
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.approvalsService.findAll(page ?? 1, limit ?? 20, status);
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.master)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvalsService.findOne(id);
  }

  @Post(':id/approve')
  @MinLevel(ROLE_LEVEL.master)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.approvalsService.approve(id, userId);
  }

  @Post(':id/reject')
  @MinLevel(ROLE_LEVEL.master)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.approvalsService.reject(id, userId, reason);
  }
}
