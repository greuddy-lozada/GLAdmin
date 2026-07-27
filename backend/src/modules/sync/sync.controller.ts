import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Head,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SyncService } from './sync.service';
import { PushRequestDto } from './dto/push-mutation.dto';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import {
  MinOrgLevel,
  ROLE_LEVEL,
} from '../../common/decorators/min-level.decorator';

@Controller('sync')
@MinOrgLevel(ROLE_LEVEL.employee)
// Offline-first: pull/push can burst on reconnect; higher than default 100/min
@Throttle({ default: { limit: 120, ttl: 60000 } })
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
  async getConflicts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.syncService.getConflicts(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Patch('conflicts/:id/resolve')
  async resolveConflict(
    @Param('id', ParseUUIDPipe) id: string,
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
