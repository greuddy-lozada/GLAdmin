import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('exchange-rates')
@PlanLevel('free')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Post('sync')
  @MinLevel(ROLE_LEVEL.executive)
  syncFromApi() {
    return this.exchangeRatesService.syncFromApi();
  }

  @Post()
  @MinLevel(ROLE_LEVEL.executive)
  create(@Body() dto: CreateExchangeRateDto) {
    return this.exchangeRatesService.create(dto);
  }

  @Get()
  @MinLevel(ROLE_LEVEL.employee)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.exchangeRatesService.findAll(pagination.page, pagination.limit);
  }

  @Get('latest')
  @MinLevel(ROLE_LEVEL.employee)
  findLatest() {
    return this.exchangeRatesService.findLatest();
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.exchangeRatesService.findOne(id);
  }

  @Patch(':id')
  @MinLevel(ROLE_LEVEL.executive)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExchangeRateDto,
  ) {
    return this.exchangeRatesService.update(id, dto);
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.executive)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.exchangeRatesService.remove(id);
  }
}
