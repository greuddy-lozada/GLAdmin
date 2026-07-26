import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from '../companies.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ContextService } from '../../tenant/context.service';

describe('CompaniesService org scope', () => {
  let service: CompaniesService;

  const mockOrgId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const mockContext = {
    getCurrent: () => ({ organizationId: mockOrgId }),
  };

  const mockPrisma = {
    company: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ContextService, useValue: mockContext },
      ],
    }).compile();

    service = module.get(CompaniesService);
    jest.clearAllMocks();
  });

  it('create stamps organizationId', async () => {
    mockPrisma.company.create.mockResolvedValue({
      id: 'c1',
      name: 'Acme',
      organizationId: mockOrgId,
    });

    await service.create({
      name: 'Acme',
      taxId: 'J-1',
      address: 'Street',
      phoneNumber: '123',
      email: 'a@b.com',
    } as never);

    expect(mockPrisma.company.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: mockOrgId }),
      }),
    );
  });

  it('findAll filters by organizationId', async () => {
    mockPrisma.company.findMany.mockResolvedValue([]);
    mockPrisma.company.count.mockResolvedValue(0);

    await service.findAll();
    expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: mockOrgId },
      }),
    );
  });

  it('findOne throws when company not in org', async () => {
    mockPrisma.company.findFirst.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws Forbidden when no org context', async () => {
    mockContext.getCurrent = () => ({}) as never;
    await expect(service.findAll()).rejects.toBeInstanceOf(ForbiddenException);
    mockContext.getCurrent = () => ({ organizationId: mockOrgId });
  });
});
