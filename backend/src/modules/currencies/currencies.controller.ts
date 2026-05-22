import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @Roles('master', 'admin', 'employee')
  findAll() {
    return this.currenciesService.findAll();
  }

  @Get(':id')
  @Roles('master', 'admin', 'employee')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.currenciesService.findOne(id);
  }
}
