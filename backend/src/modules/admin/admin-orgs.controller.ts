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
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { AssignUserOrgDto } from './dto/assign-user-org.dto';
import { MinLevel, ROLE_LEVEL } from '../../common/decorators/min-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('admin/orgs')
export class AdminOrgsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @MinLevel(ROLE_LEVEL.master)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.adminService.findAllOrgs(pagination.page, pagination.limit);
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.master)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findOneOrg(id);
  }

  @Post()
  @MinLevel(ROLE_LEVEL.master)
  create(@Body() dto: CreateOrgDto) {
    return this.adminService.createOrg(dto);
  }

  @Patch(':id')
  @MinLevel(ROLE_LEVEL.master)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrgDto,
  ) {
    return this.adminService.updateOrg(id, dto);
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeOrg(id);
  }

  @Post(':id/assign-user')
  @MinLevel(ROLE_LEVEL.master)
  assignUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignUserOrgDto,
  ) {
    return this.adminService.assignUserToOrg(id, dto);
  }

  @Post(':id/remove-user/:userId')
  @MinLevel(ROLE_LEVEL.master)
  removeUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.adminService.removeUserFromOrg(id, userId);
  }

  @Patch(':id/change-role/:userId')
  @MinLevel(ROLE_LEVEL.master)
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.adminService.changeUserRole(id, userId, roleId);
  }
}
