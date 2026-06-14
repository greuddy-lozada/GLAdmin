import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('pago-movil/transactions')
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
    @CurrentUser('id') userId: number,
  ) {
    return this.pagoMovilService.createTransaction(dto, userId);
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pagoMovilService.getTransaction(id);
  }

  @Patch(':id/review')
  @MinLevel(ROLE_LEVEL.manager)
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewPagoMovilTransactionDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.pagoMovilService.reviewTransaction(id, dto, userId);
  }
}
