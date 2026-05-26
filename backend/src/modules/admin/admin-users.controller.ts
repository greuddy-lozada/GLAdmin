import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { MinLevel, ROLE_LEVEL } from '../../common/decorators/min-level.decorator';

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @MinLevel(ROLE_LEVEL.master)
  findAll() {
    return this.adminService.findAllUsers();
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.master)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findOneUser(id);
  }

  @Patch(':id')
  @MinLevel(ROLE_LEVEL.master)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deactivateUser(id);
  }
}
