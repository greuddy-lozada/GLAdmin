import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('taxes')
@PlanLevel('starter')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  @MinOrgLevel(ROLE_LEVEL.manager)
  create(@Body() dto: CreateTaxDto) {
    return this.taxesService.create(dto);
  }

  @Get()
  @MinOrgLevel(ROLE_LEVEL.employee)
  async findAll(@Query() pagination: PaginationQueryDto) {
    return this.taxesService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @MinOrgLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.taxesService.findOne(id);
  }

  @Patch(':id')
  @MinOrgLevel(ROLE_LEVEL.manager)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaxDto) {
    return this.taxesService.update(id, dto);
  }

  @Delete(':id')
  @MinOrgLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.taxesService.remove(id);
  }
}
