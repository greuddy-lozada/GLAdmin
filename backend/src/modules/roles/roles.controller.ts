import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('master', 'executive', 'manager')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles('master', 'executive', 'manager')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }
}
