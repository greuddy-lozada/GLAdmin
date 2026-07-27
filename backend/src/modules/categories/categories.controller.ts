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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('categories')
@PlanLevel('starter')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @MinOrgLevel(ROLE_LEVEL.manager)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @MinOrgLevel(ROLE_LEVEL.employee)
  findAll(@Query() pagination?: PaginationQueryDto) {
    return this.categoriesService.findAll(pagination?.page, pagination?.limit);
  }

  @Get(':id')
  @MinOrgLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @MinOrgLevel(ROLE_LEVEL.manager)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @MinOrgLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
