import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @MinOrgLevel(ROLE_LEVEL.manager)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.rolesService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @MinOrgLevel(ROLE_LEVEL.manager)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }
}
