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
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly adminService: AdminService,
    private readonly approvalsService: AdminApprovalsService,
  ) {}

  @Post()
  @MinLevel(ROLE_LEVEL.admin)
  async create(
    @Body() dto: CreateAdminUserDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') actorRole: string,
  ) {
    const result = await this.adminService.createUser(dto, actorRole);
    await this.approvalsService.log({
      action: 'CREATE_ADMIN_USER',
      entity: 'User',
      entityId: result.data.id,
      description: `Created admin user "${result.data.userName}" (${result.data.email})`,
      performedById: userId,
      metadata: {
        userName: result.data.userName,
        email: result.data.email,
        role: result.data.role,
      },
    });
    return result;
  }

  @Get()
  @MinLevel(ROLE_LEVEL.admin)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.adminService.findAllUsers(
      pagination.page,
      pagination.limit,
      pagination.isActive,
    );
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.admin)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findOneUser(id);
  }

  @Patch(':id')
  @MinLevel(ROLE_LEVEL.admin)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') actorRole: string,
  ) {
    const before = await this.adminService.findOneUser(id);
    const result = await this.adminService.updateUser(id, dto, actorRole);
    await this.approvalsService.log({
      action: 'UPDATE_ADMIN_USER',
      entity: 'User',
      entityId: id,
      description: `Updated admin user "${result.data.userName}"`,
      performedById: userId,
      metadata: {
        oldValues: { isActive: before.isActive, idRole: before.idRole },
        newValues: {
          isActive: result.data.isActive,
          idRole: result.data.idRole,
        },
      },
    });
    return result;
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deactivateUser(id);
  }
}
