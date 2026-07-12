import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from '../customers.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ContextService } from '../../tenant/context.service';
import {
  createTestCustomerDto,
  createTestCustomerEntity,
} from './fixtures/customer.fixture';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockOrgId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const mockContext = { getCurrent: () => ({ organizationId: mockOrgId }) };

  const mockPrisma = {
    customer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ContextService, useValue: mockContext },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    test('debe crear un cliente y retornar data + mensaje', async () => {
      const dto = createTestCustomerDto({ firstName: 'John' });
      const entity = createTestCustomerEntity({ firstName: 'John' });
      mockPrisma.customer.create.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(mockPrisma.customer.create).toHaveBeenCalledTimes(1);
      expect(result.data).toBeDefined();
      expect(result.data.firstName).toBe('John');
      expect(result.message).toBe('CUSTOMER.CREATED');
    });
  });

  describe('findAll()', () => {
    test('debe retornar lista paginada de clientes', async () => {
      const entities = [
        createTestCustomerEntity(),
        createTestCustomerEntity({ firstName: 'Jane' }),
      ];
      mockPrisma.customer.findMany.mockResolvedValue(entities);
      mockPrisma.customer.count.mockResolvedValue(2);

      const result = await service.findAll();

      expect(mockPrisma.customer.findMany).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    test('debe respetar los parámetros de paginación', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);
      mockPrisma.customer.count.mockResolvedValue(0);

      const result = await service.findAll(2, 10);

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: { available: true },
        skip: 10,
        take: 10,
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  describe('findOne()', () => {
    test('debe retornar un cliente por ID', async () => {
      const entity = createTestCustomerEntity({ firstName: 'Found' });
      mockPrisma.customer.findUnique.mockResolvedValue(entity);

      const result = await service.findOne(entity.id);

      expect(result.firstName).toBe('Found');
    });

    test('debe lanzar error si no existe el cliente', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('00000000-0000-0000-0000-000000000999'),
      ).rejects.toThrow();
    });
  });

  describe('update()', () => {
    test('debe actualizar un cliente existente', async () => {
      const existing = createTestCustomerEntity({ firstName: 'Old' });
      mockPrisma.customer.findUnique.mockResolvedValue(existing);
      mockPrisma.customer.update.mockResolvedValue({
        ...existing,
        firstName: 'New',
        phoneNumber: '+58 555-0000',
      });

      const result = await service.update(existing.id, {
        firstName: 'New',
        phoneNumber: '+58 555-0000',
      });

      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: existing.id },
          data: expect.objectContaining({
            firstName: 'New',
            phoneNumber: '+58 555-0000',
          }),
        }),
      );
      expect(result.data).toBeDefined();
      expect(result.message).toBe('CUSTOMER.UPDATED');
    });
  });

  describe('remove()', () => {
    test('debe hacer soft-delete de un cliente (available: false)', async () => {
      const entity = createTestCustomerEntity();
      mockPrisma.customer.findUnique.mockResolvedValue(entity);
      mockPrisma.customer.update.mockResolvedValue({
        ...entity,
        available: false,
      });

      const result = await service.remove(entity.id);

      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: entity.id },
          data: expect.objectContaining({ available: false }),
        }),
      );
      expect(result.data).toBeDefined();
      expect(result.message).toBe('CUSTOMER.DELETED');
    });
  });
});
