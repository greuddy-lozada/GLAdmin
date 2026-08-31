import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ContextService } from '../../tenant/context.service';
import { MailService } from '../../../shared/mail/mail.service';

describe('AdminService invites', () => {
  let service: AdminService;

  const mockPrisma = {
    invite: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    role: { findUnique: jest.fn() },
    organization: { findUnique: jest.fn() },
    userOrganization: { count: jest.fn() },
  };

  const mockContext = { getCurrent: () => ({ organizationId: 'org-current' }) };
  const mockMail = { sendInviteEmail: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ContextService, useValue: mockContext },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();

    service = module.get(AdminService);
    jest.clearAllMocks();
  });

  describe('findAllInvites()', () => {
    test('lista sin filtrar por org activa y ordena por createdAt desc', async () => {
      const rows = [
        { id: '1', email: 'new@x.com', organizationId: 'org-other' },
        { id: '2', email: 'old@x.com', organizationId: 'org-current' },
      ];
      mockPrisma.invite.findMany.mockResolvedValue(rows);
      mockPrisma.invite.count.mockResolvedValue(2);

      const result = await service.findAllInvites(1, 20);

      expect(mockPrisma.invite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(mockPrisma.invite.findMany.mock.calls[0][0].where).toBeUndefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('findAllUsers()', () => {
    test('filtra por membresía de organización cuando hay organizationId', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);
      const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

      await service.findAllUsers(1, 20, 'true', orgId);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            organizations: { some: { organizationId: orgId } },
          },
        }),
      );
    });

    test('no filtra por org cuando organizationId está ausente', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.findAllUsers(1, 20, 'all');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });
});
