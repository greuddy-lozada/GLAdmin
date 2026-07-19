import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionLifecycleService } from '../subscription-lifecycle.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CacheService } from '../../../shared/cache/cache.service';
import { SUBSCRIPTION_STATUS } from '../constants';

describe('SubscriptionLifecycleService', () => {
  let service: SubscriptionLifecycleService;

  const orgId = '00000000-0000-0000-0000-000000000001';
  const freePlanId = '11111111-1111-1111-1111-111111111111';
  const paidPlanId = '22222222-2222-2222-2222-222222222222';

  const freePlan = { id: freePlanId, name: 'free' };
  const paidPlan = { id: paidPlanId, name: 'starter' };

  const mockPrisma = {
    organization: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delByPrefix: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionLifecycleService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<SubscriptionLifecycleService>(
      SubscriptionLifecycleService,
    );
    jest.clearAllMocks();
  });

  function createMockOrg(overrides: Record<string, unknown> = {}) {
    return {
      id: orgId,
      planId: paidPlanId,
      plan: paidPlan,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
      ...overrides,
    };
  }

  describe('evaluateSubscription()', () => {
    test('org sin planId → debe marcar como inactive', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(
        createMockOrg({ planId: null, plan: null }),
      );

      await service.evaluateSubscription(orgId);

      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orgId },
          data: {
            subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
            subscriptionExpiresAt: null,
          },
        }),
      );
    });

    test('org con plan Free → debe mantener inactive', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(
        createMockOrg({
          planId: freePlanId,
          plan: freePlan,
          subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
        }),
      );

      await service.evaluateSubscription(orgId);

      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
            subscriptionExpiresAt: null,
          },
        }),
      );
    });

    test('org con plan pago activo → no debe cambiar nada', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(createMockOrg());

      await service.evaluateSubscription(orgId);

      expect(mockPrisma.organization.update).not.toHaveBeenCalled();
    });

    test('org sin subscriptionExpiresAt → debe corregir a active + 30d', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(
        createMockOrg({ subscriptionExpiresAt: null }),
      );

      await service.evaluateSubscription(orgId);

      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
            subscriptionExpiresAt: expect.any(Date),
          },
        }),
      );
    });

    test('org vencida dentro del grace period (3 días) → past_due', async () => {
      const expired3DaysAgo = new Date(Date.now() - 3 * 86400000);
      mockPrisma.organization.findUnique.mockResolvedValue(
        createMockOrg({ subscriptionExpiresAt: expired3DaysAgo }),
      );

      await service.evaluateSubscription(orgId);

      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { subscriptionStatus: SUBSCRIPTION_STATUS.PAST_DUE },
        }),
      );
    });

    test('org vencida fuera del grace period (8 días) → downgrade a Free', async () => {
      const expired8DaysAgo = new Date(Date.now() - 8 * 86400000);
      mockPrisma.organization.findUnique.mockResolvedValue(
        createMockOrg({ subscriptionExpiresAt: expired8DaysAgo }),
      );
      mockPrisma.plan.findUnique.mockResolvedValue(freePlan);

      await service.evaluateSubscription(orgId);

      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            planId: freePlan.id,
            subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
            subscriptionExpiresAt: null,
          },
        }),
      );
    });

    test('org no encontrada → no debe hacer nada', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await service.evaluateSubscription(
        '00000000-0000-0000-0000-000000000999',
      );

      expect(mockPrisma.organization.update).not.toHaveBeenCalled();
    });
  });

  describe('evaluateAllActive()', () => {
    test('debe evaluar todas las orgs con plan asignado', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([
        { id: orgId },
        { id: '00000000-0000-0000-0000-000000000002' },
      ]);
      mockPrisma.organization.findUnique.mockResolvedValue(createMockOrg());

      await service.evaluateAllActive();

      expect(mockPrisma.organization.findUnique).toHaveBeenCalledTimes(2);
    });

    test('debe continuar si una org falla', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([
        { id: orgId },
        { id: '00000000-0000-0000-0000-000000000002' },
      ]);
      mockPrisma.organization.findUnique
        .mockResolvedValueOnce(createMockOrg())
        .mockRejectedValueOnce(new Error('DB error'));

      await service.evaluateAllActive();

      expect(mockPrisma.organization.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
