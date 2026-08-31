import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ContextService } from '../../tenant/context.service';
import { MailService } from '../../../shared/mail/mail.service';
import { setRoleLevels } from '../../../common/auth/role-hierarchy';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

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
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: { findUnique: jest.fn(), findFirst: jest.fn() },
    organization: { findUnique: jest.fn() },
    userOrganization: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
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
          orderBy: { updatedAt: 'desc' },
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

  describe('createUser()', () => {
    const executiveId = 'role-executive';
    const employeeId = 'role-employee';

    beforeEach(() => {
      setRoleLevels({
        master: 100,
        admin: 90,
        executive: 80,
        manager: 60,
        employee: 40,
      });
    });

    test('no usa un rol org como User.idRole', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.role.findUnique.mockImplementation(
        ({ where }: { where: { id: string } }) => {
          if (where.id === executiveId) {
            return Promise.resolve({
              id: executiveId,
              slug: 'executive',
              type: 'org',
            });
          }
          return Promise.resolve(null);
        },
      );
      mockPrisma.role.findFirst.mockResolvedValue({
        id: employeeId,
        slug: 'employee',
        type: 'org',
      });
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        password: 'hashed',
        idRole: employeeId,
      });
      mockPrisma.userOrganization.create.mockResolvedValue({});

      await service.createUser(
        {
          firstName: 'Ana',
          lastName: 'Perez',
          userName: 'anap',
          email: 'ana@x.com',
          password: 'secret12',
          idRole: executiveId,
          organizationId: 'org-1',
          orgRoleId: executiveId,
        },
        'admin',
      );

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ idRole: employeeId }),
        }),
      );
      expect(mockPrisma.userOrganization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ roleId: executiveId }),
        }),
      );
    });

    const dto = {
      firstName: 'Ana',
      lastName: 'Perez',
      userName: 'anap',
      email: 'ana@x.com',
      password: 'secret12',
      idRole: executiveId,
      organizationId: 'org-1',
      orgRoleId: executiveId,
    };

    const existing = {
      id: 'user-1',
      isActive: false,
      currentOrganizationId: null,
      password: 'old',
    };

    function stubAssignableOrgRole() {
      mockPrisma.role.findUnique.mockImplementation(
        ({ where }: { where: { id: string } }) => {
          if (where.id === executiveId) {
            return Promise.resolve({
              id: executiveId,
              slug: 'executive',
              type: 'org',
            });
          }
          return Promise.resolve(null);
        },
      );
      mockPrisma.role.findFirst.mockResolvedValue({
        id: employeeId,
        slug: 'employee',
        type: 'org',
      });
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        plan: null,
      });
    }

    test('reactiva un usuario inactivo en vez de rechazar', async () => {
      stubAssignableOrgRole();
      mockPrisma.user.findMany.mockResolvedValue([existing]);
      mockPrisma.userOrganization.findUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrisma.user.update.mockResolvedValue(existing);
      mockPrisma.userOrganization.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({
        ...existing,
        isActive: true,
        password: 'hashed',
        role: { slug: 'employee' },
      });

      const result = await service.createUser(dto, 'admin');

      expect(result.message).toBe('ADMIN.USER_CREATED');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: existing.id },
          data: expect.objectContaining({
            isActive: true,
            password: 'hashed',
            deletedAt: null,
          }),
        }),
      );
      expect(mockPrisma.userOrganization.create).toHaveBeenCalled();
    });

    test('reasigna a la org un usuario activo sin membresía', async () => {
      stubAssignableOrgRole();
      const active = { ...existing, isActive: true };
      mockPrisma.user.findMany.mockResolvedValue([active]);
      mockPrisma.userOrganization.findUnique.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue(active);
      mockPrisma.userOrganization.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({
        ...active,
        password: 'old',
        role: { slug: 'employee' },
      });

      const result = await service.createUser(dto, 'admin');

      expect(result.message).toBe('ADMIN.USER_CREATED');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockPrisma.userOrganization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: active.id,
            organizationId: 'org-1',
          }),
        }),
      );
    });

    test('reutiliza un admin activo aunque no se envíe organización', async () => {
      const active = { ...existing, isActive: true };
      mockPrisma.user.findMany.mockResolvedValue([active]);
      mockPrisma.role.findUnique.mockResolvedValue({
        id: 'role-admin',
        slug: 'admin',
        type: 'system',
      });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrisma.user.update.mockResolvedValue(active);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...active,
        password: 'hashed',
        role: { slug: 'admin' },
      });

      const result = await service.createUser(
        {
          firstName: 'Ana',
          lastName: 'Perez',
          userName: 'anap',
          email: 'ana@x.com',
          password: 'secret12',
          idRole: 'role-admin',
        },
        'master',
      );

      expect(result.message).toBe('ADMIN.USER_CREATED');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: active.id },
          data: expect.objectContaining({
            password: 'hashed',
            idRole: 'role-admin',
            isActive: true,
          }),
        }),
      );
    });

    test('reactiva un admin inactivo sin volver a crear la cuenta', async () => {
      mockPrisma.user.findMany.mockResolvedValue([existing]);
      mockPrisma.role.findUnique.mockResolvedValue({
        id: 'role-admin',
        slug: 'admin',
        type: 'system',
      });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrisma.user.update.mockResolvedValue(existing);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...existing,
        isActive: true,
        password: 'hashed',
        role: { slug: 'admin' },
      });

      const result = await service.createUser(
        {
          firstName: 'Ana',
          lastName: 'Perez',
          userName: 'anap',
          email: 'ana@x.com',
          password: 'secret12',
          idRole: 'role-admin',
        },
        'master',
      );

      expect(result.message).toBe('ADMIN.USER_CREATED');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.userOrganization.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: existing.id },
          data: expect.objectContaining({ isActive: true, deletedAt: null }),
        }),
      );
    });

    test('rechaza si el usuario activo ya es miembro de la org', async () => {
      stubAssignableOrgRole();
      const active = { ...existing, isActive: true };
      mockPrisma.user.findMany.mockResolvedValue([active]);
      mockPrisma.userOrganization.findUnique.mockResolvedValue({
        userId: active.id,
        organizationId: 'org-1',
      });

      await expect(service.createUser(dto, 'admin')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });
});
