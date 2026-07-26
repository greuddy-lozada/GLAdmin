import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { CashRegisterService } from './cash-register.service';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';
import { OpenRegisterDto } from './dto/open-register.dto';
import { CloseRegisterDto } from './dto/close-register.dto';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string; orgId: string };
}

@Controller('cash-registers')
@PlanLevel('starter')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post()
  @MinLevel(ROLE_LEVEL.manager)
  create(@Body() dto: CreateCashRegisterDto) {
    return this.cashRegisterService.create(dto);
  }

  @Get()
  @MinLevel(ROLE_LEVEL.employee)
  findAll() {
    return this.cashRegisterService.findAll();
  }

  @Get('my-active-session')
  @MinLevel(ROLE_LEVEL.employee)
  myActiveSession(@Req() req: AuthenticatedRequest) {
    return this.cashRegisterService.findMyActiveSession(req.user!.id);
  }

  @Get('sessions')
  @MinLevel(ROLE_LEVEL.employee)
  findSessions(@Query('status') status?: string) {
    return this.cashRegisterService.findSessions(status);
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cashRegisterService.findOne(id);
  }

  @Patch(':id')
  @MinLevel(ROLE_LEVEL.manager)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCashRegisterDto,
  ) {
    return this.cashRegisterService.update(id, dto);
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.master)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.cashRegisterService.remove(id);
  }

  @Post(':id/open')
  @MinLevel(ROLE_LEVEL.employee)
  open(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OpenRegisterDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cashRegisterService.open(id, dto, req.user!.id);
  }

  @Post('sessions/:id/close')
  @MinLevel(ROLE_LEVEL.employee)
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseRegisterDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cashRegisterService.close(id, dto, req.user!.id);
  }
}
