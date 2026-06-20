import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('exchange-rates')
@PlanLevel('free')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Post('sync')
  @Roles('master', 'executive')
  syncFromApi() {
    return this.exchangeRatesService.syncFromApi();
  }

  @Post()
  @Roles('master', 'executive')
  create(@Body() dto: CreateExchangeRateDto) {
    return this.exchangeRatesService.create(dto);
  }

  @Get()
  @Roles('master', 'executive', 'employee')
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.exchangeRatesService.findAll(pagination.page, pagination.limit);
  }

  @Get('latest')
  @Roles('master', 'executive', 'employee')
  findLatest() {
    return this.exchangeRatesService.findLatest();
  }

  @Get(':id')
  @Roles('master', 'executive', 'employee')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.exchangeRatesService.findOne(id);
  }

  @Patch(':id')
  @Roles('master', 'executive')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExchangeRateDto,
  ) {
    return this.exchangeRatesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('master', 'executive')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.exchangeRatesService.remove(id);
  }
}
