import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Post()
  @Roles('master', 'admin')
  create(@Body() dto: CreateExchangeRateDto) {
    return this.exchangeRatesService.create(dto);
  }

  @Get()
  @Roles('master', 'admin', 'employee')
  findAll() {
    return this.exchangeRatesService.findAll();
  }

  @Get('latest')
  @Roles('master', 'admin', 'employee')
  findLatest() {
    return this.exchangeRatesService.findLatest();
  }

  @Get(':id')
  @Roles('master', 'admin', 'employee')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.exchangeRatesService.findOne(id);
  }

  @Patch(':id')
  @Roles('master', 'admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExchangeRateDto,
  ) {
    return this.exchangeRatesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('master', 'admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.exchangeRatesService.remove(id);
  }
}
