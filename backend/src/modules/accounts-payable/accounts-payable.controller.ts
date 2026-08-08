import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AccountsPayableService } from './accounts-payable.service';
import { RegisterApPaymentDto } from './dto/register-payment.dto';
import { ApQueryDto } from './dto/ap-query.dto';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';

@Controller('accounts-payable')
@PlanLevel('professional')
export class AccountsPayableController {
  constructor(private readonly service: AccountsPayableService) {}

  @Get()
  @MinOrgLevel(ROLE_LEVEL.employee)
  findAll(@Query() query: ApQueryDto) {
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
    @Body() dto: RegisterApPaymentDto,
  ) {
    return this.service.registerPayment(id, dto);
  }
}
