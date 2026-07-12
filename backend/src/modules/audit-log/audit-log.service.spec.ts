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
              create: jest.fn().mockResolvedValue({
                id: '00000000-0000-0000-0000-000000000001',
              }),
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
      organizationId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      userId: '00000000-0000-0000-0000-000000000099',
      action: 'user.created',
      entity: 'User',
      entityId: '00000000-0000-0000-0000-000000000001',
      metadata: { email: 'test@test.com' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        userId: '00000000-0000-0000-0000-000000000099',
        action: 'user.created',
        entity: 'User',
        entityId: '00000000-0000-0000-0000-000000000001',
        metadata: '{"email":"test@test.com"}',
        ipAddress: null,
      },
    });
  });
});
