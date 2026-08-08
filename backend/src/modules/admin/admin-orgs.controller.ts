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
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { AssignUserOrgDto } from './dto/assign-user-org.dto';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('admin/orgs')
export class AdminOrgsController {
  constructor(
    private readonly adminService: AdminService,
    private readonly approvalsService: AdminApprovalsService,
  ) {}

  @Get()
  @MinLevel(ROLE_LEVEL.admin)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.adminService.findAllOrgs(
      pagination.page,
      pagination.limit,
      pagination.isActive,
    );
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.admin)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOneOrg(id);
  }

  @Post()
  @MinLevel(ROLE_LEVEL.admin)
  async create(@Body() dto: CreateOrgDto, @CurrentUser('id') userId: string) {
    const result = await this.adminService.createOrg(dto);
    await this.approvalsService.log({
      action: 'CREATE_ORG',
      entity: 'Organization',
      entityId: result.data.id,
      description: `Created organization "${result.data.name}"`,
      performedById: userId,
      metadata: {
        org: {
          name: result.data.name,
          slug: result.data.slug,
          planId: result.data.planId,
        },
      },
    });
    return result;
  }

  @Patch(':id')
  @MinLevel(ROLE_LEVEL.admin)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrgDto,
    @CurrentUser('id') userId: string,
  ) {
    const before = await this.adminService.findOneOrg(id);
    const result = await this.adminService.updateOrg(id, dto);
    await this.approvalsService.log({
      action: 'UPDATE_ORG',
      entity: 'Organization',
      entityId: id,
      description: `Updated organization "${result.data.name}"`,
      performedById: userId,
      metadata: {
        oldValues: {
          name: before.name,
          slug: before.slug,
          planId: before.planId,
          isActive: before.isActive,
        },
        newValues: {
          name: result.data.name,
          slug: result.data.slug,
          planId: result.data.planId,
          isActive: result.data.isActive,
        },
      },
    });
    return result;
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.removeOrg(id);
  }

  @Post(':id/assign-user')
  @MinLevel(ROLE_LEVEL.admin)
  async assignUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignUserOrgDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') actorRole: string,
  ) {
    const result = await this.adminService.assignUserToOrg(
      id,
      dto,
      actorRole,
    );
    await this.approvalsService.log({
      action: 'ASSIGN_USER_ORG',
      entity: 'UserOrganization',
      entityId: dto.userId,
      description: `Assigned user "${dto.userId}" to org`,
      performedById: userId,
      metadata: { userId: dto.userId, orgId: id, roleId: dto.roleId },
    });
    return result;
  }

  @Post(':id/remove-user/:userId')
  @MinLevel(ROLE_LEVEL.admin)
  async removeUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.adminService.removeUserFromOrg(id, targetUserId);
    await this.approvalsService.log({
      action: 'REMOVE_USER_ORG',
      entity: 'UserOrganization',
      entityId: `${targetUserId}_${id}`,
      description: `Removed user ${targetUserId} from org ${id}`,
      performedById: userId,
      metadata: {
        userId: targetUserId,
        orgId: id,
        oldMembership: result.oldMembership,
      },
    });
    return result;
  }

  @Patch(':id/change-role/:userId')
  @MinLevel(ROLE_LEVEL.admin)
  async changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body('roleId') roleId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') actorRole: string,
  ) {
    const result = await this.adminService.changeUserRole(
      id,
      targetUserId,
      roleId,
      actorRole,
    );
    await this.approvalsService.log({
      action: 'CHANGE_USER_ROLE',
      entity: 'UserOrganization',
      entityId: `${targetUserId}_${id}`,
      description: `Changed role for user ${targetUserId} in org ${id}`,
      performedById: userId,
      metadata: {
        userId: targetUserId,
        orgId: id,
        newRoleId: roleId,
        oldRoleId: result.oldRoleId,
      },
    });
    return result;
  }
}
