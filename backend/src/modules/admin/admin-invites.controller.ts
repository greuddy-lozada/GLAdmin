import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MinLevel, ROLE_LEVEL } from '../../common/decorators/min-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('admin/invites')
export class AdminInvitesController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @MinLevel(ROLE_LEVEL.master)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.adminService.findAllInvites(pagination.page, pagination.limit);
  }

  @Post()
  @MinLevel(ROLE_LEVEL.master)
  create(
    @Body() dto: CreateInviteDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.adminService.createInvite(dto, userId);
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeInvite(id);
  }
}
