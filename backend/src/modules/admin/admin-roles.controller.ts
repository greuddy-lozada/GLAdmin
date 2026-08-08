import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';

@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly adminService: AdminService) {}

  /** Full role catalog (system + org) for platform admin UIs. */
  @Get()
  @MinLevel(ROLE_LEVEL.admin)
  findAll() {
    return this.adminService.findAllRoles();
  }
}
