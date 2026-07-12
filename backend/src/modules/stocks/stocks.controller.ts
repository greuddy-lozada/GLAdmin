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
import { StocksService } from './stocks.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('stocks')
@PlanLevel('professional')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post()
  @Roles('master', 'admin')
  create(@Body() dto: CreateStockDto) {
    return this.stocksService.create(dto);
  }

  @Get()
  @Roles('master', 'admin', 'employee')
  async findAll(@Query() pagination: PaginationQueryDto) {
    return this.stocksService.findAll(pagination.page, pagination.limit);
  }

  @Get('alerts')
  @Roles('master', 'admin', 'employee')
  getAlerts(@Query('threshold') threshold?: string) {
    return this.stocksService.getAlerts(threshold ? Number(threshold) : 5);
  }

  @Get(':id')
  @Roles('master', 'admin', 'employee')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocksService.findOne(id);
  }

  @Patch(':id')
  @Roles('master', 'admin')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStockDto) {
    return this.stocksService.update(id, dto);
  }

  @Delete(':id')
  @Roles('master')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocksService.remove(id);
  }
}
