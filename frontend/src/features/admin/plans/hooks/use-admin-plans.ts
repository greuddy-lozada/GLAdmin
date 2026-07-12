'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { AdminPlan, CreateAdminPlanRequest, UpdateAdminPlanRequest } from '../models/admin-plan.model';
import { adminPlansService } from '../services/admin-plans.service';

function buildOptimistic(data: CreateAdminPlanRequest, tempId: string): AdminPlan {
  return {
    id: tempId,
    name: data.name,
    label: data.label,
    amount: data.amount,
    currency: data.currency ?? 'usd',
    interval: data.interval,
    features: data.features ?? '',
    maxUsers: data.maxUsers ?? 5,
    isActive: data.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useAdminPlans() {
  return useOptimisticCrud<AdminPlan, CreateAdminPlanRequest, UpdateAdminPlanRequest>({
    queryKey: ['adminPlans'],
    queryFn: () => adminPlansService.getAll(),
    createFn: (data) => adminPlansService.create(data),
    updateFn: (id, data) => adminPlansService.update(id, data),
    deleteFn: (id) => adminPlansService.delete(id),
    buildOptimistic,
  });
}
