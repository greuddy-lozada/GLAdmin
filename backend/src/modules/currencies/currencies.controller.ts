import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('currencies')
@PlanLevel('free')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @Roles('master', 'admin', 'employee')
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.currenciesService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @Roles('master', 'admin', 'employee')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.currenciesService.findOne(id);
  }
}
