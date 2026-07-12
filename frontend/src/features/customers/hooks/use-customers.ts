'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../models/customer.model';
import { customerService } from '../services/customer.service';

function buildOptimistic(data: CreateCustomerRequest, tempId: string): Customer {
  return {
    id: tempId,
    idCardNumber: data.idCardNumber,
    firstName: data.firstName,
    lastName: data.lastName,
    address: data.address ?? null,
    phoneNumber: data.phoneNumber ?? null,
    email: data.email ?? null,
    available: true,
    isWithholdingAgent: data.isWithholdingAgent ?? false,
    withholdingPercentage: data.withholdingPercentage ?? null,
    withholdingProof: data.withholdingProof ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useCustomers() {
  return useOptimisticCrud<Customer, CreateCustomerRequest, UpdateCustomerRequest>({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
    createFn: (data) => customerService.create(data),
    updateFn: (id, data) => customerService.update(id, data),
    deleteFn: (id) => customerService.delete(id),
    buildOptimistic,
  });
}
