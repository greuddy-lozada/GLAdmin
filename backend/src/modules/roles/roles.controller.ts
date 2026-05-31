import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('master', 'executive', 'manager')
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.rolesService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @Roles('master', 'executive', 'manager')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }
}
