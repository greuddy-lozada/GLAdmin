import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ContextService } from '../../tenant/context.service';
import { UserRepository } from '../repository/user.repository';
import { UserFactory } from '../user.factory';
import { setRoleLevels } from '../../../common/auth/role-hierarchy';

describe('UsersService hierarchy', () => {
  let service: UsersService;

  const mockOrgId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const employeeRoleId = '00000000-0000-0000-0000-000000000040';
  const managerRoleId = '00000000-0000-0000-0000-000000000060';
  const executiveRoleId = '00000000-0000-0000-0000-000000000080';

  let orgRole = 'executive';
  let systemRole: string | undefined;
  let isSuperAdmin = false;
  const mockContext = {
    getCurrent: () => ({
      organizationId: mockOrgId,
      orgRole,
      systemRole,
      isSuperAdmin,
    }),
  };

  const mockPrisma = {
    role: { findUnique: jest.fn() },
    organization: { findUnique: jest.fn() },
    userOrganization: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockUserRepository = {
    findByUserName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockUserFactory = {
    createFromDto: jest.fn(),
  };

  beforeEach(async () => {
    orgRole = 'executive';
    systemRole = undefined;
    isSuperAdmin = false;
    setRoleLevels({
      master: 100,
      admin: 90,
      executive: 80,
      manager: 60,
      employee: 40,
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ContextService, useValue: mockContext },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: UserFactory, useValue: mockUserFactory },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  const dto = {
    firstName: 'Ana',
    lastName: 'Perez',
    userName: 'aperez',
    password: 'secret1',
    email: 'ana@example.com',
    idRole: employeeRoleId,
  };

  it('executive can create employee', async () => {
    mockPrisma.role.findUnique.mockResolvedValue({
      id: employeeRoleId,
      slug: 'employee',
      name: 'Empleado',
    });
    mockUserRepository.findByUserName.mockResolvedValue(null);
    mockPrisma.organization.findUnique.mockResolvedValue({ plan: null });
    mockUserFactory.createFromDto.mockResolvedValue({ ...dto });
    mockUserRepository.create.mockResolvedValue({
      id: 'u1',
      ...dto,
      password: 'hash',
      isActive: true,
      mustChangePassword: false,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.userOrganization.create.mockResolvedValue({});

    const result = await service.create(dto);
    expect(result.message).toBe('USER.CREATED');
    expect(mockPrisma.userOrganization.create).toHaveBeenCalled();
  });

  it('executive cannot create executive', async () => {
    mockPrisma.role.findUnique.mockResolvedValue({
      id: executiveRoleId,
      slug: 'executive',
      name: 'Ejecutivo',
    });

    await expect(
      service.create({ ...dto, idRole: executiveRoleId }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('manager can create employee', async () => {
    orgRole = 'manager';
    mockPrisma.role.findUnique.mockResolvedValue({
      id: employeeRoleId,
      slug: 'employee',
      name: 'Empleado',
    });
    mockUserRepository.findByUserName.mockResolvedValue(null);
    mockPrisma.organization.findUnique.mockResolvedValue({ plan: null });
    mockUserFactory.createFromDto.mockResolvedValue({ ...dto });
    mockUserRepository.create.mockResolvedValue({
      id: 'u2',
      ...dto,
      password: 'hash',
      isActive: true,
      mustChangePassword: false,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.userOrganization.create.mockResolvedValue({});

    await expect(service.create(dto)).resolves.toMatchObject({
      message: 'USER.CREATED',
    });
  });

  it('manager cannot create manager', async () => {
    orgRole = 'manager';
    mockPrisma.role.findUnique.mockResolvedValue({
      id: managerRoleId,
      slug: 'manager',
      name: 'Gerente',
    });

    await expect(
      service.create({ ...dto, idRole: managerRoleId }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('employee create is blocked by missing hierarchy (service still checks)', async () => {
    orgRole = 'employee';
    mockPrisma.role.findUnique.mockResolvedValue({
      id: employeeRoleId,
      slug: 'employee',
      name: 'Empleado',
    });

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('system master bypasses org membership role for hierarchy', async () => {
    orgRole = 'employee';
    systemRole = 'master';
    isSuperAdmin = true;
    mockPrisma.role.findUnique.mockResolvedValue({
      id: executiveRoleId,
      slug: 'executive',
      name: 'Ejecutivo',
    });
    mockUserRepository.findByUserName.mockResolvedValue(null);
    mockPrisma.organization.findUnique.mockResolvedValue({ plan: null });
    mockUserFactory.createFromDto.mockResolvedValue({
      ...dto,
      idRole: executiveRoleId,
    });
    mockUserRepository.create.mockResolvedValue({
      id: '1',
      ...dto,
      idRole: executiveRoleId,
      password: 'hashed',
    });
    mockPrisma.userOrganization.create.mockResolvedValue({});

    await expect(
      service.create({ ...dto, idRole: executiveRoleId }),
    ).resolves.toMatchObject({ message: 'USER.CREATED' });
  });

  it('system admin bypasses org membership role for hierarchy', async () => {
    orgRole = 'employee';
    systemRole = 'admin';
    isSuperAdmin = false;
    mockPrisma.role.findUnique.mockResolvedValue({
      id: executiveRoleId,
      slug: 'executive',
      name: 'Ejecutivo',
    });
    mockUserRepository.findByUserName.mockResolvedValue(null);
    mockPrisma.organization.findUnique.mockResolvedValue({ plan: null });
    mockUserFactory.createFromDto.mockResolvedValue({
      ...dto,
      idRole: executiveRoleId,
    });
    mockUserRepository.create.mockResolvedValue({
      id: '2',
      ...dto,
      idRole: executiveRoleId,
      password: 'hashed',
    });
    mockPrisma.userOrganization.create.mockResolvedValue({});

    await expect(
      service.create({ ...dto, idRole: executiveRoleId }),
    ).resolves.toMatchObject({ message: 'USER.CREATED' });
  });
});
