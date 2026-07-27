import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('customers')
@PlanLevel('free')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @MinOrgLevel(ROLE_LEVEL.manager)
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get()
  @MinOrgLevel(ROLE_LEVEL.employee)
  async findAll(@Query() pagination: PaginationQueryDto) {
    return this.customersService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @MinOrgLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @MinOrgLevel(ROLE_LEVEL.manager)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @MinOrgLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }
}
