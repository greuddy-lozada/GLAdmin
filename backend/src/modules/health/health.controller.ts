import { Controller, Get, Head, HttpCode } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        data: {
          status: 'ok',
          database: 'connected',
          timestamp: new Date().toISOString(),
        },
        message: null,
      };
    } catch {
      return {
        data: {
          status: 'error',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        },
        message: 'HEALTH.DB_ERROR',
      };
    }
  }

  @Head()
  @HttpCode(200)
  async head() {
    return;
  }
}
