import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class RefreshTokenCron {
  private readonly logger = new Logger(RefreshTokenCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 3 * * *')
  async cleanupExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
    }
  }
}
