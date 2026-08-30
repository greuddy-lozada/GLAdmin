import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from '../sync.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ContextService } from '../../tenant/context.service';
import { SalesService } from '../../sales/sales.service';
import {
  MOCK_ORG_ID,
  createProductRow,
  createCustomerRow,
  createExchangeRateRow,
  createExchangeRateDayRow,
  createSupplierRow,
  createCompanyRow,
  createTaxRow,
  createBrandRow,
  createCategoryRow,
  createPushMutation,
  createSalePushMutation,
  createSyncConflictEntity,
} from './fixtures/sync.fixture';

describe('SyncService', () => {
  let service: SyncService;

  const mockContext = {
    getCurrent: (): { organizationId: string } | undefined => ({
      organizationId: MOCK_ORG_ID,
    }),
  };
  const mockContextNoOrg: {
    getCurrent: () => { organizationId: string } | undefined;
  } = { getCurrent: () => undefined };

  const mockSalesService = { create: jest.fn() };

  const mockPrisma = {
    product: { findMany: jest.fn() },
    customer: { findMany: jest.fn() },
    exchangeRate: { findMany: jest.fn() },
    exchangeRateDay: { findMany: jest.fn() },
    supplier: { findMany: jest.fn() },
    company: { findMany: jest.fn() },
    tax: { findMany: jest.fn() },
    brand: { findMany: jest.fn() },
    category: { findMany: jest.fn() },
    cashRegister: { findMany: jest.fn() },
    syncCursor: { upsert: jest.fn() },
    syncConflict: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    stock: { findMany: jest.fn() },
    sale: { findMany: jest.fn() },
  };

  function buildModule(
    context: {
      getCurrent: () => { organizationId: string } | undefined;
    } = mockContext,
  ) {
    return Test.createTestingModule({
      providers: [
        SyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ContextService, useValue: context },
        { provide: SalesService, useValue: mockSalesService },
      ],
    }).compile();
  }

  beforeEach(async () => {
    const module: TestingModule = await buildModule();
    service = module.get<SyncService>(SyncService);
    jest.clearAllMocks();
  });

  describe('pull()', () => {
    const product = createProductRow({ stockExistence: 5 });
    const customer = createCustomerRow();
    const exchangeRate = createExchangeRateRow();
    const exchangeRateDay = createExchangeRateDayRow();
    const supplier = createSupplierRow();
    const company = createCompanyRow();
    const tax = createTaxRow();
    const brand = createBrandRow();
    const category = createCategoryRow();

    beforeEach(() => {
      mockPrisma.product.findMany.mockResolvedValue([product]);
      mockPrisma.customer.findMany.mockResolvedValue([customer]);
      mockPrisma.exchangeRate.findMany.mockResolvedValue([exchangeRate]);
      mockPrisma.exchangeRateDay.findMany.mockResolvedValue([exchangeRateDay]);
      mockPrisma.supplier.findMany.mockResolvedValue([supplier]);
      mockPrisma.company.findMany.mockResolvedValue([company]);
      mockPrisma.tax.findMany.mockResolvedValue([tax]);
      mockPrisma.brand.findMany.mockResolvedValue([brand]);
      mockPrisma.category.findMany.mockResolvedValue([category]);
      mockPrisma.cashRegister.findMany.mockResolvedValue([]);
    });

    test('debe retornar todas las entidades con stock agregado en productos', async () => {
      const result = await service.pull();

      expect(result.products).toHaveLength(1);
      expect(result.products[0].stock).toBe(5);
      expect(result.products[0].dollarPrice).toBeNull();
      expect(result.products[0].baseCost).toBeNull();
      expect(result.customers).toHaveLength(1);
      expect(result.exchangeRates).toHaveLength(1);
      expect(result.exchangeRateDays).toHaveLength(1);
      expect(result.suppliers).toHaveLength(1);
      expect(result.companies).toHaveLength(1);
      expect(result.taxes).toHaveLength(1);
      expect(result.brands).toHaveLength(1);
      expect(result.categories).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    test('debe filtrar por since cuando se pasa una fecha', async () => {
      await service.pull('2025-01-01T00:00:00.000Z');

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: MOCK_ORG_ID,
            updatedAt: expect.objectContaining({ gt: expect.any(Date) }),
          }),
        }),
      );
    });

    test('debe actualizar syncCursor cuando todos los datos caben (hasMore=false)', async () => {
      await service.pull();

      expect(mockPrisma.syncCursor.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: MOCK_ORG_ID },
          update: { lastPullAt: expect.any(Date) },
        }),
      );
    });

    test('debe establecer hasMore=true y no actualizar cursor cuando productos alcanzan batchSize', async () => {
      const products = Array.from({ length: 500 }, (_, i) =>
        createProductRow({ id: `prod-${i}`, name: `Product ${i}` }),
      );
      mockPrisma.product.findMany.mockResolvedValue(products);

      const result = await service.pull();

      expect(result.hasMore).toBe(true);
      expect(mockPrisma.syncCursor.upsert).not.toHaveBeenCalled();
    });

    test('debe establecer hasMore=true y no actualizar cursor cuando customers alcanzan batchSize', async () => {
      const customers = Array.from({ length: 500 }, (_, i) =>
        createCustomerRow({ id: `cust-${i}` }),
      );
      mockPrisma.customer.findMany.mockResolvedValue(customers);

      const result = await service.pull();

      expect(result.hasMore).toBe(true);
      expect(mockPrisma.syncCursor.upsert).not.toHaveBeenCalled();
    });

    test('debe retornar hasMore=true desde el cursor con la fecha since cuando hay overflow', async () => {
      const products = Array.from({ length: 500 }, (_, i) =>
        createProductRow({ id: `prod-${i}`, name: `Product ${i}` }),
      );
      mockPrisma.product.findMany.mockResolvedValue(products);

      const result = await service.pull('2025-01-01T00:00:00.000Z');

      expect(result.hasMore).toBe(true);
      expect(result.cursor.lastPullAt).toBe('2025-01-01T00:00:00.000Z');
    });

    test('debe lanzar error si no hay contexto de organización', async () => {
      const moduleNoOrg: TestingModule = await buildModule(mockContextNoOrg);
      const serviceNoOrg = moduleNoOrg.get<SyncService>(SyncService);

      await expect(serviceNoOrg.pull()).rejects.toThrow(
        'No organization context',
      );
    });

    test('debe convertir dollarPrice y baseCost a números cuando existen', async () => {
      const productWithPrices = createProductRow({
        dollarPrice: 2.82,
        baseCost: 80,
        stockExistence: 3,
      });
      mockPrisma.product.findMany.mockResolvedValue([productWithPrices]);

      const result = await service.pull();

      expect(result.products[0].dollarPrice).toBe(2.82);
      expect(result.products[0].baseCost).toBe(80);
    });

    test('debe sumar stock de múltiples registros en stocks', async () => {
      const productMultiStock = {
        ...createProductRow(),
        stocks: [{ existence: 5 }, { existence: 3 }, { existence: 2 }],
      };
      mockPrisma.product.findMany.mockResolvedValue([productMultiStock]);

      const result = await service.pull();

      expect(result.products[0].stock).toBe(10);
    });
  });

  describe('push()', () => {
    test('debe crear una venta exitosamente cuando hay stock suficiente', async () => {
      mockPrisma.stock.findMany.mockResolvedValue([
        {
          idProduct: '00000000-0000-0000-0000-000000000001',
          existence: 10,
          organizationId: MOCK_ORG_ID,
        },
      ]);
      mockSalesService.create.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000s01',
      });
      mockPrisma.syncCursor.upsert.mockResolvedValue({});

      const mutation = createSalePushMutation();
      const result = await service.push([mutation]);

      expect(result.accepted).toContain('00000000-0000-0000-0000-000000000s01');
      expect(result.conflicts).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockSalesService.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.syncCursor.upsert).toHaveBeenCalled();
    });

    test('debe generar conflicto oversold cuando el producto no tiene stock', async () => {
      mockPrisma.stock.findMany.mockResolvedValue([]);
      mockPrisma.sale.findMany.mockResolvedValue([]);
      mockPrisma.syncCursor.upsert.mockResolvedValue({});
      mockPrisma.syncConflict.createMany.mockResolvedValue({ count: 1 });

      const mutation = createSalePushMutation();
      const result = await service.push([mutation]);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].issue).toBe('oversold');
      expect(result.accepted).toHaveLength(0);
      expect(mockSalesService.create).not.toHaveBeenCalled();
    });

    test('debe generar conflicto oversold cuando cantidad solicitada excede stock', async () => {
      mockPrisma.stock.findMany.mockResolvedValue([
        {
          idProduct: '00000000-0000-0000-0000-000000000001',
          existence: 1,
          organizationId: MOCK_ORG_ID,
        },
      ]);
      mockPrisma.sale.findMany.mockResolvedValue([]);
      mockPrisma.syncCursor.upsert.mockResolvedValue({});
      mockPrisma.syncConflict.createMany.mockResolvedValue({ count: 1 });

      const mutation = createSalePushMutation({
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            quantity: 5,
            unitPrice: 100,
            unitPriceUsd: 2.82,
            subtotal: 500,
            subtotalUsd: 14.1,
          },
        ],
      });

      const result = await service.push([mutation]);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].issue).toBe('oversold');
    });

    test('debe restar ventas recientes del stock disponible al detectar conflicto', async () => {
      mockPrisma.stock.findMany.mockResolvedValue([
        {
          idProduct: '00000000-0000-0000-0000-000000000001',
          existence: 8,
          organizationId: MOCK_ORG_ID,
        },
      ]);
      mockPrisma.sale.findMany.mockResolvedValue([
        {
          id: 'other-sale',
          details: [
            { idProduct: '00000000-0000-0000-0000-000000000001', quantity: 3 },
          ],
        },
      ]);
      mockPrisma.syncCursor.upsert.mockResolvedValue({});
      mockPrisma.syncConflict.createMany.mockResolvedValue({ count: 1 });

      const mutation = createSalePushMutation({
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            quantity: 10,
            unitPrice: 100,
            unitPriceUsd: 2.82,
            subtotal: 1000,
            subtotalUsd: 28.2,
          },
        ],
      });

      const result = await service.push([mutation]);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].description).toContain('available 5');
    });

    test('debe crear múltiples ventas cuando hay varias mutaciones válidas', async () => {
      mockPrisma.stock.findMany.mockResolvedValue([
        {
          idProduct: '00000000-0000-0000-0000-000000000001',
          existence: 50,
          organizationId: MOCK_ORG_ID,
        },
        {
          idProduct: '00000000-0000-0000-0000-000000000002',
          existence: 30,
          organizationId: MOCK_ORG_ID,
        },
      ]);
      mockSalesService.create
        .mockResolvedValueOnce({ id: 'sale-1' })
        .mockResolvedValueOnce({ id: 'sale-2' });
      mockPrisma.syncCursor.upsert.mockResolvedValue({});

      const mutation1 = createSalePushMutation({
        recordId: 'rec-1',
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000001',
            quantity: 2,
            unitPrice: 500,
            unitPriceUsd: 14.08,
            subtotal: 1000,
            subtotalUsd: 28.17,
          },
        ],
      });
      const mutation2 = createSalePushMutation({
        recordId: 'rec-2',
        items: [
          {
            productId: '00000000-0000-0000-0000-000000000002',
            quantity: 1,
            unitPrice: 300,
            unitPriceUsd: 8.45,
            subtotal: 300,
            subtotalUsd: 8.45,
          },
        ],
      });

      const result = await service.push([mutation1, mutation2]);

      expect(result.accepted).toHaveLength(2);
      expect(mockSalesService.create).toHaveBeenCalledTimes(2);
    });

    test('debe aceptar mutaciones no-sale con accepted vacío', async () => {
      mockPrisma.syncCursor.upsert.mockResolvedValue({});

      const mutation = createPushMutation({
        table: 'products',
        operation: 'update',
      });
      const result = await service.push([mutation]);

      expect(result.accepted).toEqual(['']);
      expect(result.conflicts).toHaveLength(0);
    });

    test('debe capturar errores y devolverlos en el array de errors', async () => {
      mockPrisma.stock.findMany.mockResolvedValue([]);
      mockPrisma.sale.findMany.mockRejectedValue(new Error('DB down'));
      mockPrisma.syncCursor.upsert.mockResolvedValue({});

      const mutation = createSalePushMutation();
      const result = await service.push([mutation]);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('DB down');
    });

    test('debe lanzar error si no hay contexto de organización', async () => {
      const moduleNoOrg: TestingModule = await buildModule(mockContextNoOrg);
      const serviceNoOrg = moduleNoOrg.get<SyncService>(SyncService);

      await expect(serviceNoOrg.push([])).rejects.toThrow(
        'No organization context',
      );
    });

    test('debe pre-cargar stocks solo para mutaciones sale/create', async () => {
      mockPrisma.stock.findMany.mockResolvedValue([]);
      mockPrisma.syncCursor.upsert.mockResolvedValue({});

      const saleMutation = createSalePushMutation();
      const productMutation = createPushMutation({
        table: 'products',
        operation: 'update',
      });

      await service.push([saleMutation, productMutation]);

      expect(mockPrisma.stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            idProduct: { in: ['00000000-0000-0000-0000-000000000001'] },
          }),
        }),
      );
    });
  });

  describe('getConflicts()', () => {
    const conflict1 = createSyncConflictEntity({ id: 'conf-1' });
    const conflict2 = createSyncConflictEntity({
      id: 'conf-2',
      description: 'Another oversold',
    });

    beforeEach(() => {
      mockPrisma.syncConflict.findMany.mockResolvedValue([
        conflict1,
        conflict2,
      ]);
    });

    test('debe retornar conflictos pendientes con paginación por defecto', async () => {
      const result = await service.getConflicts();

      expect(result).toHaveLength(2);
      expect(mockPrisma.syncConflict.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: MOCK_ORG_ID, status: 'pending' },
          skip: 0,
          take: 50,
        }),
      );
    });

    test('debe aplicar skip y take según page y limit', async () => {
      await service.getConflicts(3, 10);

      expect(mockPrisma.syncConflict.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    test('debe lanzar error si no hay contexto de organización', async () => {
      const moduleNoOrg: TestingModule = await buildModule(mockContextNoOrg);
      const serviceNoOrg = moduleNoOrg.get<SyncService>(SyncService);

      await expect(serviceNoOrg.getConflicts()).rejects.toThrow(
        'No organization context',
      );
    });

    test('debe retornar array vacío cuando no hay conflictos pendientes', async () => {
      mockPrisma.syncConflict.findMany.mockResolvedValue([]);

      const result = await service.getConflicts();

      expect(result).toHaveLength(0);
    });
  });

  describe('resolveConflict()', () => {
    test('debe actualizar el estado del conflicto y establecer resolvedAt', async () => {
      const conflict = createSyncConflictEntity({
        id: 'conf-to-resolve',
        status: 'pending',
      });
      const resolved = {
        ...conflict,
        status: 'resolved_server',
        resolvedAt: new Date(),
      };
      mockPrisma.syncConflict.update.mockResolvedValue(resolved);

      const result = await service.resolveConflict('conf-to-resolve', {
        status: 'resolved_server',
      });

      expect(mockPrisma.syncConflict.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conf-to-resolve', organizationId: MOCK_ORG_ID },
          data: expect.objectContaining({
            status: 'resolved_server',
            resolvedAt: expect.any(Date),
          }),
        }),
      );
      expect(result.status).toBe('resolved_server');
    });

    test('debe resolver conflicto con status resolved_local', async () => {
      const resolved = createSyncConflictEntity({
        id: 'conf-local',
        status: 'resolved_local',
      });
      mockPrisma.syncConflict.update.mockResolvedValue(resolved);

      const result = await service.resolveConflict('conf-local', {
        status: 'resolved_local',
      });

      expect(result.status).toBe('resolved_local');
    });

    test('debe lanzar error si no hay contexto de organización', async () => {
      const moduleNoOrg: TestingModule = await buildModule(mockContextNoOrg);
      const serviceNoOrg = moduleNoOrg.get<SyncService>(SyncService);

      await expect(
        serviceNoOrg.resolveConflict('any-id', { status: 'resolved_server' }),
      ).rejects.toThrow('No organization context');
    });
  });
});
