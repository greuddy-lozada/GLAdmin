import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../products.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ContextService } from '../../tenant/context.service';
import {
  createTestProductDto,
  createTestProductEntity,
} from './fixtures/product.fixture';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockOrgId = 1;
  const mockContext = { getCurrent: () => ({ organizationId: mockOrgId }) };

  const mockPrisma = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    exchangeRateDay: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ContextService, useValue: mockContext },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    test('debe crear un producto y retornar data + mensaje', async () => {
      const dto = createTestProductDto({ name: 'Laptop' });
      const entity = createTestProductEntity({ name: 'Laptop' });
      mockPrisma.product.create.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(mockPrisma.product.create).toHaveBeenCalledTimes(1);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('Laptop');
      expect(result.message).toBe('PRODUCT.CREATED');
    });
  });

  describe('findAll()', () => {
    test('debe retornar lista paginada de productos', async () => {
      const entities = [
        createTestProductEntity(),
        createTestProductEntity({ name: 'Product 2' }),
      ];
      mockPrisma.product.findMany.mockResolvedValue(entities);
      mockPrisma.product.count.mockResolvedValue(2);

      const result = await service.findAll();

      expect(mockPrisma.product.findMany).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    test('debe filtrar por búsqueda cuando se pasa search', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll(1, 20, 'Laptop');

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Laptop' } }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne()', () => {
    test('debe retornar un producto por ID', async () => {
      const entity = createTestProductEntity({ name: 'Found Product' });
      mockPrisma.product.findUnique.mockResolvedValue(entity);

      const result = await service.findOne(1);

      expect(result.name).toBe('Found Product');
    });

    test('debe lanzar error si no existe el producto', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow();
    });
  });

  describe('update()', () => {
    test('debe actualizar un producto existente', async () => {
      const existing = createTestProductEntity({ name: 'Old Name' });
      mockPrisma.product.findUnique.mockResolvedValue(existing);
      mockPrisma.product.update.mockResolvedValue({
        ...existing,
        name: 'New Name',
        price: 200,
      });

      const result = await service.update(1, { name: 'New Name', price: 200 });

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ name: 'New Name', price: 200 }),
        }),
      );
      expect(result.data).toBeDefined();
    });
  });

  describe('remove()', () => {
    test('debe hacer soft-delete de un producto (available: false)', async () => {
      const entity = createTestProductEntity();
      mockPrisma.product.findUnique.mockResolvedValue(entity);
      mockPrisma.product.update.mockResolvedValue({
        ...entity,
        available: false,
      });

      const result = await service.remove(1);

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ available: false }),
        }),
      );
      expect(result.data).toBeDefined();
    });
  });
});
