import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminApprovalsService } from './admin-approvals.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('admin/invites')
export class AdminInvitesController {
  constructor(
    private readonly adminService: AdminService,
    private readonly approvalsService: AdminApprovalsService,
  ) {}

  @Get()
  @MinLevel(ROLE_LEVEL.admin)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.adminService.findAllInvites(pagination.page, pagination.limit);
  }

  @Post()
  @MinLevel(ROLE_LEVEL.admin)
  async create(
    @Body() dto: CreateInviteDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.adminService.createInvite(dto, userId);
    await this.approvalsService.log({
      action: 'CREATE_INVITE',
      entity: 'Invite',
      entityId: result.data.id,
      description: `Created invitation for "${result.data.email}"`,
      performedById: userId,
      metadata: {
        email: result.data.email,
        organizationId: dto.organizationId,
        roleId: dto.roleId,
      },
    });
    return result;
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.removeInvite(id);
  }
}
