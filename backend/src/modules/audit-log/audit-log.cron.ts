import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AuditLogCron {
  private readonly logger = new Logger(AuditLogCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 4 * * *')
  async cleanupOldLogs() {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      this.logger.log(
        `Cleaned up ${result.count} audit log entries older than 90 days`,
      );
    }
  }
}
