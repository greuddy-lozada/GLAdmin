import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ForeignExchangesService } from './foreign-exchanges.service';
import { CreateForeignExchangeDto } from './dto/create-foreign-exchange.dto';
import { UpdateForeignExchangeDto } from './dto/update-foreign-exchange.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('foreign-exchanges')
export class ForeignExchangesController {
  constructor(
    private readonly foreignExchangesService: ForeignExchangesService,
  ) {}

  @Post()
  @Roles('master', 'admin')
  create(@Body() dto: CreateForeignExchangeDto) {
    return this.foreignExchangesService.create(dto);
  }

  @Get()
  @Roles('master', 'admin', 'employee')
  findAll() {
    return this.foreignExchangesService.findAll();
  }

  @Get(':id')
  @Roles('master', 'admin', 'employee')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foreignExchangesService.findOne(id);
  }

  @Patch(':id')
  @Roles('master', 'admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateForeignExchangeDto,
  ) {
    return this.foreignExchangesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('master')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.foreignExchangesService.remove(id);
  }
}
