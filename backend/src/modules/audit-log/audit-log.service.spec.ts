import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn().mockResolvedValue({ id: 1 }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should log an audit entry', async () => {
    await service.log({
      organizationId: 1,
      userId: 1,
      action: 'user.created',
      entity: 'User',
      entityId: 1,
      metadata: { email: 'test@test.com' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        organizationId: 1,
        userId: 1,
        action: 'user.created',
        entity: 'User',
        entityId: 1,
        metadata: '{"email":"test@test.com"}',
        ipAddress: null,
      },
    });
  });
});
