import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('purchase-orders')
@PlanLevel('professional')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles('master', 'admin')
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(dto);
  }

  @Get()
  @Roles('master', 'admin', 'employee')
  async findAll(@Query() pagination: PaginationQueryDto) {
    return this.purchaseOrdersService.findAll(
      pagination.page,
      pagination.limit,
    );
  }

  @Get(':id')
  @Roles('master', 'admin', 'employee')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles('master', 'admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(id, dto);
  }

  @Post(':id/receive')
  @Roles('master', 'admin')
  receive(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.receive(id, dto);
  }

  @Delete(':id')
  @Roles('master')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.remove(id);
  }
}
