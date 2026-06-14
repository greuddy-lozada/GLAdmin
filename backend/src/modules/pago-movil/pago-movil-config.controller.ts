import { Controller, Get, Post, Patch, Delete, Body } from '@nestjs/common';
import { PagoMovilService } from './pago-movil.service';
import {
  CreatePagoMovilConfigDto,
  UpdatePagoMovilConfigDto,
} from './pago-movil-config.dto';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';

@Controller('pago-movil/config')
export class PagoMovilConfigController {
  constructor(private readonly pagoMovilService: PagoMovilService) {}

  @Get()
  @MinLevel(ROLE_LEVEL.manager)
  findOne() {
    return this.pagoMovilService.getConfig();
  }

  @Post()
  @MinLevel(ROLE_LEVEL.manager)
  create(@Body() dto: CreatePagoMovilConfigDto) {
    return this.pagoMovilService.createConfig(dto);
  }

  @Patch()
  @MinLevel(ROLE_LEVEL.manager)
  update(@Body() dto: UpdatePagoMovilConfigDto) {
    return this.pagoMovilService.updateConfig(dto);
  }

  @Delete()
  @MinLevel(ROLE_LEVEL.manager)
  remove() {
    return this.pagoMovilService.deactivateConfig();
  }
}
