import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('sales')
@MinOrgLevel(ROLE_LEVEL.employee)
@PlanLevel('professional')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }

  @Get()
  async findAll(@Query() pagination: PaginationQueryDto) {
    return this.salesService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSaleDto,
  ) {
    return this.salesService.update(id, dto);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.remove(id);
  }
}
