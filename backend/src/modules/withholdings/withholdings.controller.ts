import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { WithholdingsService } from './withholdings.service';
import { CreateWithholdingDto } from './dto/create-withholding.dto';
import { UpdateWithholdingDto } from './dto/update-withholding.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('withholdings')
export class WithholdingsController {
  constructor(private readonly withholdingsService: WithholdingsService) {}

  @Post()
  @Roles('master', 'admin')
  create(@Body() dto: CreateWithholdingDto) {
    return this.withholdingsService.create(dto);
  }

  @Get()
  @Roles('master', 'admin', 'employee')
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.withholdingsService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @Roles('master', 'admin', 'employee')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.withholdingsService.findOne(id);
  }

  @Patch(':id')
  @Roles('master', 'admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWithholdingDto,
  ) {
    return this.withholdingsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('master', 'admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.withholdingsService.remove(id);
  }
}
