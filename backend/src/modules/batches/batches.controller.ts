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
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('batches')
@PlanLevel('professional')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @MinOrgLevel(ROLE_LEVEL.manager)
  create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Get()
  @MinOrgLevel(ROLE_LEVEL.employee)
  async findAll(@Query() pagination: PaginationQueryDto) {
    return this.batchesService.findAll(
      pagination.page,
      pagination.limit,
      pagination.search,
    );
  }

  @Get(':id')
  @MinOrgLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchesService.findOne(id);
  }

  @Patch(':id')
  @MinOrgLevel(ROLE_LEVEL.manager)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBatchDto) {
    return this.batchesService.update(id, dto);
  }

  @Delete(':id')
  @MinOrgLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchesService.remove(id);
  }
}
