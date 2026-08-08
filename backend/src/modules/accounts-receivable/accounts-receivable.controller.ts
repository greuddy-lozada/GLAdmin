import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AccountsReceivableService } from './accounts-receivable.service';
import { RegisterArPaymentDto } from './dto/register-payment.dto';
import { ArQueryDto } from './dto/ar-query.dto';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';

@Controller('accounts-receivable')
@PlanLevel('professional')
export class AccountsReceivableController {
  constructor(private readonly service: AccountsReceivableService) {}

  @Get()
  @MinOrgLevel(ROLE_LEVEL.employee)
  findAll(@Query() query: ArQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @MinOrgLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/payments')
  @MinOrgLevel(ROLE_LEVEL.employee)
  registerPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterArPaymentDto,
  ) {
    return this.service.registerPayment(id, dto);
  }
}
