import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Head,
  HttpCode,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { PushRequestDto } from './dto/push-mutation.dto';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import {
  MinLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';

@Controller('sync')
@MinLevel(ROLE_LEVEL.employee)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  async pull(@Query('since') since?: string) {
    return this.syncService.pull(since);
  }

  @Post('push')
  async push(@Body() dto: PushRequestDto) {
    return this.syncService.push(dto.mutations);
  }

  @Get('conflicts')
  async getConflicts() {
    return this.syncService.getConflicts();
  }

  @Patch('conflicts/:id/resolve')
  async resolveConflict(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveConflictDto,
  ) {
    return this.syncService.resolveConflict(id, dto);
  }

  @Head('health')
  @HttpCode(200)
  async health() {
    return;
  }
}
