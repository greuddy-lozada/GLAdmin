import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @Roles('master', 'admin', 'employee')
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.currenciesService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @Roles('master', 'admin', 'employee')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.currenciesService.findOne(id);
  }
}
