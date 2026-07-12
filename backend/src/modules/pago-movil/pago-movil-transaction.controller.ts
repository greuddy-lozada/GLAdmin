import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { PagoMovilService } from './pago-movil.service';
import {
  CreatePagoMovilTransactionDto,
  ReviewPagoMovilTransactionDto,
} from './pago-movil-transaction.dto';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('pago-movil/transactions')
@PlanLevel('professional')
export class PagoMovilTransactionController {
  constructor(private readonly pagoMovilService: PagoMovilService) {}

  @Get()
  @MinLevel(ROLE_LEVEL.employee)
  findAll(@Query('status') status?: string) {
    return this.pagoMovilService.getTransactions(status);
  }

  @Post()
  @MinLevel(ROLE_LEVEL.employee)
  create(
    @Body() dto: CreatePagoMovilTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pagoMovilService.createTransaction(dto, userId);
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagoMovilService.getTransaction(id);
  }

  @Patch(':id/review')
  @MinLevel(ROLE_LEVEL.manager)
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewPagoMovilTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pagoMovilService.reviewTransaction(id, dto, userId);
  }
}
